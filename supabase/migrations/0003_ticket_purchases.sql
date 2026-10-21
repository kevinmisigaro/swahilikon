-- Swahili Komik Con — paid ticket purchases with an optional referral discount.
--
-- Replaces the single-use, free "enter a code to RSVP" flow with a ticket
-- purchase flow where the referral code is optional: if the buyer supplies
-- one, they get a discount and the referring influencer earns a commission.
-- Actual payment still happens on the event's external ticket_url — this
-- records the order intent (price/discount/commission) before redirecting
-- the buyer there.

-- ---------------------------------------------------------------------------
-- Events need a price to discount against.
-- ---------------------------------------------------------------------------
alter table events
  add column price_cents integer not null default 0,
  add column currency text not null default 'TZS';

-- ---------------------------------------------------------------------------
-- Referral codes become reusable discount/commission codes instead of
-- single-use invites: discount_percent is what the buyer saves,
-- commission_percent is what the influencer earns per order. A code no
-- longer gets consumed after one use — `status` is now only used to let an
-- admin disable a code (existing 'used' rows just behave as available).
-- ---------------------------------------------------------------------------
alter table referral_codes
  add column discount_percent numeric(5,2) not null default 10,
  add column commission_percent numeric(5,2) not null default 10;

-- ---------------------------------------------------------------------------
-- redemptions -> ticket_orders: one row per ticket purchase intent, with an
-- OPTIONAL referral code (nullable FK) instead of a mandatory one, and no
-- longer unique per code since many buyers can now share one code.
-- ---------------------------------------------------------------------------
alter table redemptions rename to ticket_orders;
alter table ticket_orders rename column visitor_name to buyer_name;
alter table ticket_orders rename column visitor_email to buyer_email;
alter table ticket_orders rename column redeemed_at to created_at;

alter table ticket_orders
  drop constraint redemptions_referral_code_id_fkey,
  drop constraint if exists redemptions_referral_code_id_key;

alter table ticket_orders
  alter column referral_code_id drop not null,
  add constraint ticket_orders_referral_code_id_fkey
    foreign key (referral_code_id) references referral_codes (id) on delete set null;

alter table ticket_orders
  add column event_id uuid references events (id) on delete restrict,
  add column unit_price_cents integer not null default 0,
  add column discount_cents integer not null default 0,
  add column commission_cents integer not null default 0,
  add column total_cents integer not null default 0,
  add column currency text not null default 'TZS';

create index ticket_orders_event_id_idx on ticket_orders (event_id);
create index ticket_orders_referral_code_id_idx on ticket_orders (referral_code_id);

-- ---------------------------------------------------------------------------
-- Replace the RPC: the referral code is now optional. When present and
-- valid it computes a discount off the event price for the buyer and a
-- commission for the influencer; when absent the order is just full price.
-- SECURITY DEFINER so anonymous visitors can call it without direct table
-- grants on events/referral_codes/ticket_orders.
-- ---------------------------------------------------------------------------
drop function if exists redeem_referral_code(text, text, text);

create or replace function create_ticket_order(
  p_event_slug text,
  p_buyer_name text,
  p_buyer_email text,
  p_code text default null
)
returns table (
  order_id uuid,
  confirmation_ref text,
  influencer_name text,
  unit_price_cents integer,
  discount_cents integer,
  total_cents integer,
  currency text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_price_cents integer;
  v_currency text;
  v_code_id uuid;
  v_influencer_name text;
  v_discount_percent numeric;
  v_commission_percent numeric;
  v_discount_cents integer := 0;
  v_commission_cents integer := 0;
  v_total_cents integer;
  v_order_id uuid;
  v_confirmation_ref text;
begin
  if p_buyer_name is null or length(trim(p_buyer_name)) = 0 then
    raise exception 'buyer_name_required' using errcode = 'P0001';
  end if;
  if p_buyer_email is null or p_buyer_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'valid_email_required' using errcode = 'P0001';
  end if;

  select id, price_cents, currency into v_event_id, v_price_cents, v_currency
  from events
  where slug = p_event_slug;

  if v_event_id is null then
    raise exception 'event_not_found' using errcode = 'P0004';
  end if;

  if p_code is not null and length(trim(p_code)) > 0 then
    select rc.id, i.display_name, rc.discount_percent, rc.commission_percent
    into v_code_id, v_influencer_name, v_discount_percent, v_commission_percent
    from referral_codes rc
    join influencers i on i.id = rc.influencer_id
    where rc.code = upper(trim(p_code)) and rc.status = 'available';

    if v_code_id is null then
      raise exception 'code_not_found' using errcode = 'P0002';
    end if;

    v_discount_cents := round(v_price_cents * v_discount_percent / 100);
    v_commission_cents := round((v_price_cents - v_discount_cents) * v_commission_percent / 100);
  end if;

  v_total_cents := v_price_cents - v_discount_cents;

  insert into ticket_orders (
    event_id, referral_code_id, buyer_name, buyer_email,
    unit_price_cents, discount_cents, commission_cents, total_cents, currency
  )
  values (
    v_event_id, v_code_id, trim(p_buyer_name), lower(trim(p_buyer_email)),
    v_price_cents, v_discount_cents, v_commission_cents, v_total_cents, v_currency
  )
  returning id, confirmation_ref into v_order_id, v_confirmation_ref;

  return query
    select v_order_id, v_confirmation_ref, v_influencer_name,
           v_price_cents, v_discount_cents, v_total_cents, v_currency;
end;
$$;

grant execute on function create_ticket_order(text, text, text, text) to anon, authenticated;

-- mark_redemption_email_status -> mark_ticket_order_email_status
drop function if exists mark_redemption_email_status(uuid, email_status);

create or replace function mark_ticket_order_email_status(
  p_order_id uuid,
  p_status email_status
)
returns void
language sql
security definer
set search_path = public
as $$
  update ticket_orders set email_status = p_status where id = p_order_id;
$$;

grant execute on function mark_ticket_order_email_status(uuid, email_status) to anon, authenticated;

-- RLS policy follows the table rename.
drop policy if exists "admins read redemptions" on ticket_orders;
create policy "admins read ticket orders" on ticket_orders
  for select using (is_admin());

-- Placeholder price for the upcoming event — update via admin console/SQL
-- once the real ticket price is set.
update events set price_cents = 150000, currency = 'TZS'
where slug = 'skc-reloaded-tanzanite-2026-11-14';
