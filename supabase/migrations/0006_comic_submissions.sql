-- Swahili Komik Con — comics in Supabase Storage: both the SKC team's own
-- "official" comics and member uploads live in the same table/bucket.
--
-- A comic PDF is rendered client-side into page JPEGs and uploaded to the
-- "comic-submissions" Storage bucket, then recorded here. Member uploads
-- start 'pending' and only appear on the public /comics page once a staff
-- admin approves them in skc-admin — same is_admin()/admin_profiles
-- pattern as Quest checkpoint approval (0002_profiles_and_quest.sql).
-- Official comics are inserted directly by an admin (or the one-off
-- `scripts/migrate-static-comics-to-storage.mjs` import) with
-- `is_official = true` and `status = 'approved'` already set — no review
-- step, and no `owner_id` since they aren't tied to a member profile.
--
-- Storage objects live at `{owner_slug}/{submission_id}/page-001.jpg`
-- (`owner_slug` is the owner's auth uid for a member upload, or the
-- literal "official" for an SKC-team comic) so RLS can tell a member's own
-- files apart from everyone else's by folder name alone, and can look up a
-- submission's review status by the second folder segment without a join.
--
-- This block makes re-running the file from scratch safe (e.g. if you ran
-- an earlier draft of this migration before it had `is_official`): it's
-- only a clean drop-and-recreate, so only do this while the table has no
-- real submissions yet — `drop table ... cascade` takes its rows with it.
-- (The bucket itself is left alone: Supabase blocks direct `delete` on
-- storage.objects/buckets, and the `insert ... on conflict do nothing`
-- below is already a no-op if it's still there from a previous run.)
drop function if exists review_comic_submission(uuid, text, text);
drop policy if exists "public reads approved comic submission files" on storage.objects;
drop policy if exists "admins manage comic submission files" on storage.objects;
drop policy if exists "admins read comic submission files" on storage.objects;
drop policy if exists "owners manage own comic submission files" on storage.objects;
drop function if exists comic_submission_is_approved(text);
drop table if exists comic_submissions cascade;
drop type if exists comic_submission_status;

create type comic_submission_status as enum ('pending', 'approved', 'rejected');

create table comic_submissions (
  id uuid primary key default gen_random_uuid(),
  -- null for an official SKC-team comic; set for a member upload.
  owner_id uuid references auth.users (id) on delete cascade,
  is_official boolean not null default false,
  slug text not null unique,
  title text not null,
  subtitle text,
  creator text not null,
  partners text[] not null default '{}',
  language text not null default 'Kiswahili',
  description text not null,
  content_note text,
  page_count integer not null check (page_count between 1 and 80),
  page_width integer not null check (page_width > 0),
  page_height integer not null check (page_height > 0),
  status comic_submission_status not null default 'pending',
  rejection_reason text,
  reviewed_by uuid references admin_profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comic_submissions_owner_shape check (
    (is_official and owner_id is null) or (not is_official and owner_id is not null)
  )
);

create index comic_submissions_status_idx on comic_submissions (status);
create index comic_submissions_owner_id_idx on comic_submissions (owner_id);

alter table comic_submissions enable row level security;

-- A member can only ever insert their own, non-official submission — so
-- the one escape hatch into "official" content is the admins policy below,
-- which requires is_admin().
create policy "owners insert own comic submissions" on comic_submissions
  for insert with check (owner_id = auth.uid() and not is_official);
create policy "owners read own comic submissions" on comic_submissions
  for select using (owner_id = auth.uid());
create policy "owners delete own comic submissions" on comic_submissions
  for delete using (owner_id = auth.uid());
create policy "public reads approved comic submissions" on comic_submissions
  for select using (status = 'approved');
create policy "admins manage comic submissions" on comic_submissions
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- Storage: private bucket, one folder per submission.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('comic-submissions', 'comic-submissions', false)
on conflict (id) do nothing;

create or replace function comic_submission_is_approved(p_object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from comic_submissions
    where id = (storage.foldername(p_object_name))[2]::uuid
      and status = 'approved'
  );
$$;

create policy "owners manage own comic submission files" on storage.objects
  for all to authenticated
  using (bucket_id = 'comic-submissions' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'comic-submissions' and (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can also write (not just read): skc-admin uploads official SKC
-- comics straight into the "official/" folder, which no owner-scoped
-- policy above would ever match.
create policy "admins manage comic submission files" on storage.objects
  for all to authenticated
  using (bucket_id = 'comic-submissions' and is_admin())
  with check (bucket_id = 'comic-submissions' and is_admin());

create policy "public reads approved comic submission files" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'comic-submissions' and comic_submission_is_approved(name));

-- ---------------------------------------------------------------------------
-- Admin-only review decision. Keeping it in a SECURITY DEFINER RPC (instead
-- of an owner-writable `status` column) means a member can never approve
-- their own submission by crafting a client-side update.
-- ---------------------------------------------------------------------------
create or replace function review_comic_submission(
  p_submission_id uuid,
  p_status text,
  p_rejection_reason text default null
)
returns table (status text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not is_admin() then
    raise exception 'not_authorized' using errcode = '28000';
  end if;

  if p_status not in ('approved', 'rejected') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;

  update comic_submissions
  set status = p_status::comic_submission_status,
      rejection_reason = case when p_status = 'rejected'
        then nullif(trim(coalesce(p_rejection_reason, '')), '')
        else null
      end,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_submission_id;

  if not found then
    raise exception 'submission_not_found' using errcode = 'P0002';
  end if;

  return query select p_status;
end;
$$;

grant execute on function review_comic_submission(uuid, text, text) to authenticated;
