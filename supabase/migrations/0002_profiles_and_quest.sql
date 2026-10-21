-- Swahili Komik Con — member profiles + SKC Quest verification (v3 PRD §5, §6)
-- Run after 0001_init.sql.

-- ---------------------------------------------------------------------------
-- Member profiles — one row per auth.users member. Role drives which
-- dashboard panel is shown; it does NOT grant staff/admin access (that is
-- controlled separately by admin_profiles / staff_checkpoint_assignments).
-- ---------------------------------------------------------------------------
create type member_role as enum (
  'fan',
  'parent_guardian',
  'creator',
  'competitor',
  'vendor',
  'instructor',
  'influencer'
);

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  role member_role not null default 'fan',
  bio text,
  interests text[] not null default '{}',
  -- Role-specific optional fields (portfolio/catalog links, assigned class
  -- notes, etc.) kept schemaless since each role needs only a few free-text
  -- fields today; promote to dedicated columns/tables if they grow.
  details jsonb not null default '{}',
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on profiles (role);

alter table profiles enable row level security;

create policy "members read own profile" on profiles
  for select using (auth.uid() = id);
create policy "members update own profile" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "members create own profile" on profiles
  for insert with check (auth.uid() = id);
create policy "admins read all profiles" on profiles
  for select using (is_admin());

-- ---------------------------------------------------------------------------
-- SKC Quest checkpoints — public mission config, no verification secrets.
-- ---------------------------------------------------------------------------
create table quest_checkpoints (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  mission_text text not null,
  xp integer not null default 20,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  opens_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz not null default now()
);

alter table quest_checkpoints enable row level security;

create policy "public reads active checkpoints" on quest_checkpoints
  for select using (is_active or is_admin());
create policy "admins manage checkpoints" on quest_checkpoints
  for all using (is_admin()) with check (is_admin());

-- Which quest_staff/event_manager/platform_admin may approve which checkpoint.
create table staff_checkpoint_assignments (
  admin_profile_id uuid not null references admin_profiles (id) on delete cascade,
  checkpoint_id uuid not null references quest_checkpoints (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (admin_profile_id, checkpoint_id)
);

alter table staff_checkpoint_assignments enable row level security;

create policy "admins manage checkpoint assignments" on staff_checkpoint_assignments
  for all using (is_admin()) with check (is_admin());

create or replace function is_assigned_to_checkpoint(p_checkpoint_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_profiles ap
    where ap.id = auth.uid()
      and (
        ap.role in ('platform_admin', 'event_manager')
        or exists (
          select 1 from staff_checkpoint_assignments sca
          where sca.admin_profile_id = ap.id and sca.checkpoint_id = p_checkpoint_id
        )
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Quest passes: extend the existing free fan_passes table so a guest pass can
-- later be linked to exactly one verified member profile without losing XP.
-- ---------------------------------------------------------------------------
alter table fan_passes
  add column profile_id uuid references profiles (id) on delete set null,
  add column linked_at timestamptz;

create unique index fan_passes_profile_id_idx on fan_passes (profile_id) where profile_id is not null;

create table quest_completions (
  id uuid primary key default gen_random_uuid(),
  fan_pass_id uuid not null references fan_passes (id) on delete cascade,
  checkpoint_id uuid not null references quest_checkpoints (id) on delete cascade,
  approved_by uuid not null references admin_profiles (id),
  created_at timestamptz not null default now(),
  unique (fan_pass_id, checkpoint_id)
);

create index quest_completions_fan_pass_idx on quest_completions (fan_pass_id);

alter table quest_completions enable row level security;

create policy "admins read completions" on quest_completions
  for select using (is_admin());

create table quest_redemptions (
  id uuid primary key default gen_random_uuid(),
  fan_pass_id uuid not null unique references fan_passes (id) on delete cascade,
  redeemed_by uuid not null references admin_profiles (id),
  redeemed_at timestamptz not null default now()
);

alter table quest_redemptions enable row level security;

create policy "admins read redemptions table" on quest_redemptions
  for select using (is_admin());

-- ---------------------------------------------------------------------------
-- Public quest status lookup (by exact pass_code only — same pattern as
-- get_fan_pass). Includes which checkpoint codes are already verified.
-- ---------------------------------------------------------------------------
create or replace function get_quest_status(p_pass_code text)
returns table (
  pass_code text,
  holder_name text,
  xp integer,
  badge text,
  completed_checkpoints text[],
  redeemed boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    fp.pass_code,
    fp.holder_name,
    fp.xp,
    fp.badge,
    coalesce(array_agg(qc.code order by qc.sort_order) filter (where qc.code is not null), '{}'),
    exists (select 1 from quest_redemptions qr where qr.fan_pass_id = fp.id)
  from fan_passes fp
  left join quest_completions comp on comp.fan_pass_id = fp.id
  left join quest_checkpoints qc on qc.id = comp.checkpoint_id
  where fp.pass_code = upper(trim(p_pass_code))
  group by fp.id;
$$;

grant execute on function get_quest_status(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Atomic checkpoint approval. Re-scans return ALREADY_COMPLETED without
-- awarding XP again (unique constraint + explicit pre-check in one tx).
-- ---------------------------------------------------------------------------
create or replace function approve_quest_checkpoint(
  p_pass_code text,
  p_checkpoint_code text
)
returns table (
  status text,
  xp integer,
  badge text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pass_id uuid;
  v_checkpoint_id uuid;
  v_checkpoint_xp integer;
  v_is_active boolean;
  v_opens_at timestamptz;
  v_closes_at timestamptz;
  v_total_active integer;
  v_completed_count integer;
  v_new_xp integer;
  v_badge text;
begin
  if auth.uid() is null or not is_admin() then
    raise exception 'not_authorized' using errcode = '28000';
  end if;

  select id, xp, is_active, opens_at, closes_at
    into v_checkpoint_id, v_checkpoint_xp, v_is_active, v_opens_at, v_closes_at
  from quest_checkpoints
  where code = upper(trim(p_checkpoint_code));

  if v_checkpoint_id is null then
    raise exception 'checkpoint_not_found' using errcode = 'P0002';
  end if;

  if not is_assigned_to_checkpoint(v_checkpoint_id) then
    raise exception 'not_assigned_to_checkpoint' using errcode = '28000';
  end if;

  if not v_is_active then
    raise exception 'checkpoint_closed' using errcode = 'P0003';
  end if;
  if v_opens_at is not null and now() < v_opens_at then
    raise exception 'checkpoint_not_open_yet' using errcode = 'P0003';
  end if;
  if v_closes_at is not null and now() > v_closes_at then
    raise exception 'checkpoint_closed' using errcode = 'P0003';
  end if;

  select id into v_pass_id from fan_passes where pass_code = upper(trim(p_pass_code));
  if v_pass_id is null then
    raise exception 'pass_not_found' using errcode = 'P0002';
  end if;

  -- Lock the pass row so concurrent approvals for the same pass serialize.
  perform 1 from fan_passes where id = v_pass_id for update;

  if exists (
    select 1 from quest_completions where fan_pass_id = v_pass_id and checkpoint_id = v_checkpoint_id
  ) then
    select fp.xp, fp.badge into v_new_xp, v_badge from fan_passes fp where fp.id = v_pass_id;
    return query select 'ALREADY_COMPLETED', v_new_xp, v_badge;
    return;
  end if;

  insert into quest_completions (fan_pass_id, checkpoint_id, approved_by)
  values (v_pass_id, v_checkpoint_id, auth.uid());

  update fan_passes set xp = xp + v_checkpoint_xp where id = v_pass_id
  returning xp into v_new_xp;

  select count(*) into v_total_active from quest_checkpoints where is_active;
  select count(*) into v_completed_count
  from quest_completions comp
  join quest_checkpoints qc on qc.id = comp.checkpoint_id
  where comp.fan_pass_id = v_pass_id and qc.is_active;

  if v_completed_count >= v_total_active and v_total_active > 0 then
    update fan_passes set badge = 'Explorer' where id = v_pass_id and badge is null;
  end if;

  select xp, badge into v_new_xp, v_badge from fan_passes where id = v_pass_id;

  return query select 'APPROVED', v_new_xp, v_badge;
end;
$$;

grant execute on function approve_quest_checkpoint(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Exactly-once reward redemption, staff-only, requires an earned badge.
-- ---------------------------------------------------------------------------
create or replace function redeem_quest_reward(p_pass_code text)
returns table (status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pass_id uuid;
  v_badge text;
begin
  if auth.uid() is null or not is_admin() then
    raise exception 'not_authorized' using errcode = '28000';
  end if;

  select id, badge into v_pass_id, v_badge from fan_passes where pass_code = upper(trim(p_pass_code));
  if v_pass_id is null then
    raise exception 'pass_not_found' using errcode = 'P0002';
  end if;
  if v_badge is null then
    raise exception 'badge_not_earned' using errcode = 'P0003';
  end if;

  insert into quest_redemptions (fan_pass_id, redeemed_by)
  values (v_pass_id, auth.uid())
  on conflict (fan_pass_id) do nothing;

  if not found then
    return query select 'ALREADY_REDEEMED';
    return;
  end if;

  return query select 'REDEEMED';
end;
$$;

grant execute on function redeem_quest_reward(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Link a guest quest pass to the signed-in member's profile exactly once.
-- Refuses reassignment away from an existing linked profile.
-- ---------------------------------------------------------------------------
create or replace function link_fan_pass_to_profile(p_pass_code text)
returns table (status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pass_id uuid;
  v_existing_profile uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authorized' using errcode = '28000';
  end if;
  if not exists (select 1 from profiles where id = auth.uid()) then
    raise exception 'profile_required' using errcode = 'P0004';
  end if;

  select id, profile_id into v_pass_id, v_existing_profile
  from fan_passes where pass_code = upper(trim(p_pass_code));

  if v_pass_id is null then
    raise exception 'pass_not_found' using errcode = 'P0002';
  end if;

  if v_existing_profile is not null and v_existing_profile <> auth.uid() then
    raise exception 'pass_already_linked' using errcode = 'P0005';
  end if;

  update fan_passes
  set profile_id = auth.uid(), linked_at = coalesce(linked_at, now())
  where id = v_pass_id;

  return query select 'LINKED';
end;
$$;

grant execute on function link_fan_pass_to_profile(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Staff operations dashboard: aggregate counts only, no per-visitor PII.
-- ---------------------------------------------------------------------------
create or replace function quest_staff_summary()
returns table (
  passes_issued bigint,
  completions_total bigint,
  finishers bigint,
  badges_awarded bigint,
  redemptions bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from fan_passes),
    (select count(*) from quest_completions),
    (select count(*) from (
      select fan_pass_id from quest_completions
      group by fan_pass_id
      having count(*) >= (select count(*) from quest_checkpoints where is_active)
    ) finishers_sub),
    (select count(*) from fan_passes where badge is not null),
    (select count(*) from quest_redemptions)
  where is_admin();
$$;

grant execute on function quest_staff_summary() to authenticated;

-- ---------------------------------------------------------------------------
-- Seed the five working November 14 checkpoints (PRD §6, counts configurable).
-- ---------------------------------------------------------------------------
insert into quest_checkpoints (code, title, mission_text, xp, sort_order) values
  ('CP-01', 'Main Stage', 'Welcome to SKC: identify comics, animation, gaming and cosplay.', 20, 1),
  ('CP-02', 'Tanzanite Animation Zone', 'Animation Detective: place the proposed storyboard frames in order.', 20, 2),
  ('CP-03', 'Gaming Zone', 'Pixel Challenge: solve an age-appropriate visual puzzle.', 20, 3),
  ('CP-04', 'Artistic Corner', 'Artist Detective: find a clue in licensed/original artwork.', 20, 4),
  ('CP-05', 'Family Creativity Checkpoint', 'Create Your Hero: choose a superpower and the cause it serves.', 20, 5)
on conflict (code) do nothing;
