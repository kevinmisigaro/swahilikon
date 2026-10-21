-- Swahili Komik Con — DPO Pay integration for ticket orders.
--
-- Adds payment tracking columns to ticket_orders. Writes to these columns
-- happen outside RLS, from trusted server-only code (the DPO webhook and
-- verify-on-return routes) using the Supabase service role key — never from
-- the anon/public client, and no new SECURITY DEFINER RPC is granted to
-- anon for this, since a forged call could mark someone else's order paid
-- without them actually paying. See lib/supabase/service.ts.

create type payment_status as enum ('pending', 'paid', 'failed', 'cancelled');

alter table ticket_orders
  add column payment_provider text not null default 'dpo',
  add column payment_token text,
  add column payment_ref text,
  add column payment_status payment_status not null default 'pending',
  add column paid_at timestamptz;

-- A DPO transaction token identifies exactly one order; this also stops a
-- forged webhook payload from being able to piggyback a second order onto
-- a token it doesn't own.
create unique index ticket_orders_payment_token_key
  on ticket_orders (payment_token)
  where payment_token is not null;
