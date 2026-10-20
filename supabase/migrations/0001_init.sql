-- Swahili Komik Con — core schema (P0: referral-code pilot + public content)
-- Run against a fresh Supabase Postgres database (SQL editor or `supabase db push`).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type influencer_status as enum ('active', 'inactive');
create type referral_code_status as enum ('available', 'used', 'disabled');
create type email_status as enum ('pending', 'sent', 'failed');
create type event_status as enum ('upcoming', 'past');
create type admin_role as enum ('platform_admin', 'event_manager', 'moderator', 'quest_staff');

-- ---------------------------------------------------------------------------
-- Admin staff profiles — one row per auth.users admin, created by an existing
-- platform_admin (see README "Creating the first admin user"). Role drives
-- every server-side authorization check; never trust a client-supplied role.
-- ---------------------------------------------------------------------------
create table admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role admin_role not null default 'event_manager',
  created_at timestamptz not null default now()
);

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admin_profiles where id = auth.uid());
$$;

create or replace function is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_profiles where id = auth.uid() and role = 'platform_admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Influencers & referral codes
-- ---------------------------------------------------------------------------
create table influencers (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  contact text,
  status influencer_status not null default 'active',
  notes text,
  created_at timestamptz not null default now()
);

create table referral_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  influencer_id uuid not null references influencers (id) on delete restrict,
  status referral_code_status not null default 'available',
  created_at timestamptz not null default now(),
  created_by uuid references admin_profiles (id)
);

create index referral_codes_influencer_id_idx on referral_codes (influencer_id);
create index referral_codes_status_idx on referral_codes (status);

create table redemptions (
  id uuid primary key default gen_random_uuid(),
  referral_code_id uuid not null unique references referral_codes (id) on delete restrict,
  visitor_name text not null,
  visitor_email text not null,
  confirmation_ref text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  email_status email_status not null default 'pending',
  redeemed_at timestamptz not null default now()
);

-- The unique constraint on referral_code_id is what makes redemption
-- "exactly once" even under two concurrent requests: the second insert
-- fails with a unique-violation rather than silently succeeding.

-- ---------------------------------------------------------------------------
-- Atomic redemption: claims the code and records the redemption in one
-- statement so concurrent requests for the same code can't both win.
-- SECURITY DEFINER so anonymous visitors can call it without direct table
-- grants on referral_codes/redemptions.
-- ---------------------------------------------------------------------------
create or replace function redeem_referral_code(
  p_code text,
  p_visitor_name text,
  p_visitor_email text
)
returns table (
  redemption_id uuid,
  confirmation_ref text,
  influencer_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code_id uuid;
  v_influencer_name text;
  v_redemption_id uuid;
  v_confirmation_ref text;
begin
  if p_visitor_name is null or length(trim(p_visitor_name)) = 0 then
    raise exception 'visitor_name_required' using errcode = 'P0001';
  end if;
  if p_visitor_email is null or p_visitor_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'valid_email_required' using errcode = 'P0001';
  end if;

  -- Lock the matching row so a concurrent call blocks here instead of racing.
  select rc.id, i.display_name into v_code_id, v_influencer_name
  from referral_codes rc
  join influencers i on i.id = rc.influencer_id
  where rc.code = upper(trim(p_code))
  for update;

  if v_code_id is null then
    raise exception 'code_not_found' using errcode = 'P0002';
  end if;

  update referral_codes
  set status = 'used'
  where id = v_code_id and status = 'available';

  if not found then
    raise exception 'code_not_available' using errcode = 'P0003';
  end if;

  insert into redemptions (referral_code_id, visitor_name, visitor_email)
  values (v_code_id, trim(p_visitor_name), lower(trim(p_visitor_email)))
  returning id, confirmation_ref into v_redemption_id, v_confirmation_ref;

  return query select v_redemption_id, v_confirmation_ref, v_influencer_name;
end;
$$;

-- Lets the public redemption API record Resend delivery outcome without
-- granting broad table privileges to the anon role.
create or replace function mark_redemption_email_status(
  p_redemption_id uuid,
  p_status email_status
)
returns void
language sql
security definer
set search_path = public
as $$
  update redemptions set email_status = p_status where id = p_redemption_id;
$$;

grant execute on function redeem_referral_code(text, text, text) to anon, authenticated;
grant execute on function mark_redemption_email_status(uuid, email_status) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Events (public content: upcoming + past, e.g. the 2 Aug 2026 archive)
-- ---------------------------------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  event_date date not null,
  venue text not null,
  schedule jsonb not null default '[]',
  ticket_url text,
  status event_status not null default 'upcoming',
  is_published boolean not null default false,
  cover_image text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Free SKC Fan Pass / Quest guest pass — no email/phone required to create.
-- ---------------------------------------------------------------------------
create table fan_passes (
  id uuid primary key default gen_random_uuid(),
  pass_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  holder_name text not null,
  holder_email text,
  xp integer not null default 0,
  badge text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Audit log — sensitive admin actions and Quest verification events.
-- ---------------------------------------------------------------------------
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references admin_profiles (id),
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table influencers enable row level security;
alter table referral_codes enable row level security;
alter table redemptions enable row level security;
alter table events enable row level security;
alter table fan_passes enable row level security;
alter table admin_profiles enable row level security;
alter table audit_log enable row level security;

-- admin_profiles: admins can read all profiles; only a platform_admin may write.
create policy "admins can read admin profiles" on admin_profiles
  for select using (is_admin());
create policy "platform admins manage admin profiles" on admin_profiles
  for all using (is_platform_admin()) with check (is_platform_admin());

-- influencers / referral_codes / redemptions: staff-only, no public access.
-- The public redemption path goes through the SECURITY DEFINER RPC above,
-- which bypasses these policies deliberately and only after validating the code.
create policy "admins manage influencers" on influencers
  for all using (is_admin()) with check (is_admin());

create policy "admins manage referral codes" on referral_codes
  for all using (is_admin()) with check (is_admin());

create policy "admins read redemptions" on redemptions
  for select using (is_admin());

-- events: anyone can read published events; only admins can write.
create policy "public reads published events" on events
  for select using (is_published = true or is_admin());
create policy "admins manage events" on events
  for all using (is_admin()) with check (is_admin());

-- fan_passes: anyone may create their own pass; only admins list all passes
-- directly. A holder looks up their own pass through the RPC below (by exact
-- pass_code only), so the table itself is never broadly readable.
create policy "anyone creates a fan pass" on fan_passes
  for insert with check (true);
create policy "admins read fan passes" on fan_passes
  for select using (is_admin());
create policy "admins update fan passes" on fan_passes
  for update using (is_admin()) with check (is_admin());

create or replace function get_fan_pass(p_pass_code text)
returns table (
  pass_code text,
  holder_name text,
  xp integer,
  badge text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select pass_code, holder_name, xp, badge, created_at
  from fan_passes
  where pass_code = upper(trim(p_pass_code));
$$;

grant execute on function get_fan_pass(text) to anon, authenticated;

-- audit_log: admin-only, append-only from the client's perspective.
create policy "admins read audit log" on audit_log
  for select using (is_admin());
create policy "admins write audit log" on audit_log
  for insert with check (is_admin());

-- ---------------------------------------------------------------------------
-- Seed: the 2 August 2026 past event (safe to re-run)
-- ---------------------------------------------------------------------------
insert into events (slug, title, description, event_date, venue, status, is_published, cover_image)
values (
  'skc-2026-08-02',
  'SKC 2026',
  'The first Swahili Komik Con gathering of 2026 — cosplay, gaming, animation and a live crowd that brought the energy all night.',
  '2026-08-02',
  'Dar es Salaam, Tanzania',
  'past',
  true,
  '/images/hero/skc-hero-main.jpg'
)
on conflict (slug) do nothing;

insert into events (slug, title, description, event_date, venue, status, is_published, ticket_url)
values (
  'skc-reloaded-tanzanite-2026-11-14',
  'SKC Reloaded / Tanzanite',
  'The next Swahili Komik Con event. Enter your influencer referral code on the Referral Code page to confirm your spot.',
  '2026-11-14',
  'Dar es Salaam, Tanzania',
  'upcoming',
  true,
  null
)
on conflict (slug) do nothing;
