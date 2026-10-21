# Swahili Komik Con — Public Website

"Your World of Comics, Gaming, Animation & Cosplay" — the public website for
Swahili Komik Con, built per the P0 scope in `SKC_Website_PRD_v1.1.docx`
(website-only, referral-code pilot for SKC Reloaded / Tanzanite on
14 November 2026).

This is the **public site only**. The staff admin dashboard is a separate
app — see [`skc-admin`](../skc-admin) — deployed on its own domain so the
admin surface and its Supabase Auth session never touch this site's origin.
Both apps share one Supabase project.

- Home, Events, Explore, Competitions, Masterclasses, FanZone, Past Events
  (2 August 2026 photo archive).
- Ticket purchase with an optional referral code: a visitor starts a ticket
  order, optionally adding an influencer's referral code for 10% off (the
  influencer earns a 10% commission), and Resend sends an order
  confirmation before the buyer is sent to the external ticket link to pay.
- My SKC: free Fan Pass + Quest progress (no payment required), plus an
  optional free account with one of the PRD §4 member roles (Fan, Parent/
  Guardian, Creator, Competitor, Vendor, Instructor, Influencer).
- SKC Quest (PRD §6): public checkpoint list, a guest Fan Pass that earns XP
  as stations are completed, and a staff console that verifies completions
  server-side so XP can only ever be awarded once per pass/checkpoint.

## Stack

Next.js (App Router, TypeScript) · Supabase (Postgres, Auth, Row Level
Security) · Resend (confirmation emails) · Tailwind CSS v4.

## 1. Set up Supabase

If you haven't already run it for `skc-admin`, apply the schema:

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run `supabase/migrations/0001_init.sql`, then
   `supabase/migrations/0002_profiles_and_quest.sql`, then
   `supabase/migrations/0003_ticket_purchases.sql`, in that order. The
   first creates core tables and RLS policies. The second adds member
   `profiles` plus the `quest_checkpoints` / `quest_completions` /
   `quest_redemptions` tables and the `approve_quest_checkpoint` /
   `redeem_quest_reward` / `link_fan_pass_to_profile` RPCs that keep Quest
   verification exactly-once and staff-authorized. The third adds
   `events.price_cents`/`currency`, makes referral codes reusable discount
   codes (`discount_percent`/`commission_percent`), renames `redemptions` to
   `ticket_orders`, and replaces `redeem_referral_code` with
   `create_ticket_order` (referral code now optional). These are the same
   migrations as in `skc-admin` — only run them once per Supabase project.
3. Copy **Project Settings → API** into `.env.local` (copy `.env.example`
   first):

   ```bash
   cp .env.example .env.local
   ```

   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Admin accounts are provisioned from the `skc-admin` repo
(`scripts/create-admin.mjs`), not from here — this site never holds the
`SUPABASE_SERVICE_ROLE_KEY`.

## 2. Set up Resend

Create an API key at [resend.com](https://resend.com), verify a sending
domain, and set `RESEND_API_KEY` / `RESEND_FROM_ADDRESS` in `.env.local`. If
`RESEND_API_KEY` is left unset, redemption still works — the app just logs
that it skipped sending an email, which is convenient while developing.

## 3. Point at the admin dashboard

Set `NEXT_PUBLIC_ADMIN_URL` in `.env.local` to wherever `skc-admin` is
running (e.g. `http://localhost:3203` locally, `https://admin.yourdomain.com`
in production). The footer's "Admin login" link uses this.

## 4. Run it

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` (or whichever port you configure).

The home, events and past-events pages render with placeholder event data
even before Supabase is connected, so you can preview the design
immediately — see `lib/data/events.ts`.

## Project structure

```
app/
  (site)/            Every public page — wrapped in the Navbar/Footer layout
    quest/             Public Quest rules + checkpoint list + Fan Pass panel
    my-skc/             Free account, profile setup/dashboard, Fan Pass panel
    staff/quest/        Staff-only Quest verification console
  api/
    tickets/purchase/   Public ticket-order endpoint (calls the Postgres RPC)
    payments/dpo/        DPO webhook (callback) + return-page status check (verify)
    profile/            Signed-in member's own profile (get/create/update)
    quest/               Public checkpoints, guest pass create/lookup, pass-linking
    staff/quest/         Staff-authorized approve/redeem/summary endpoints
components/
  ui/                 Shared comic-styled primitives (buttons, badges, headings)
  site/               Public-site components (AuthPanel, ProfileSetupForm/Dashboard,
                      FanPassPanel, StaffQuestConsole, TicketForm, TicketConfirmStatus, ...)
lib/
  supabase/            Browser / server Supabase clients (anon key) + service.ts (service
                      role, payment writes only — see "How ticket payment works" below)
  payments/            DPO Pay API client + payment-status sync helper
  data/                Server-only data-fetching helpers
  email/               Resend integration
supabase/migrations/   SQL schema, RLS policies, the create_ticket_order RPC
public/images/          Curated photos from the 2 August 2026 event
```

## How ticket orders work

`create_ticket_order` (see `0003_ticket_purchases.sql`) takes the buyer's
name/email and an **optional** referral code. With no code, the order is
full price. With a valid code, it computes a 10% discount for the buyer and
a 10% commission for the referring influencer (both percentages live on
`referral_codes` and can be tuned per code). Unlike the old single-use
`redeem_referral_code` RPC, a referral code is not consumed — the same code
can be used by many buyers, since it is now a discount/commission code
rather than a one-time invite.

## How ticket payment works (DPO Pay)

`app/api/tickets/purchase` decides how the buyer pays, in this order:

1. **Fully discounted order** (`total_cents` is 0) — nothing to pay; the
   order is marked `paid` immediately.
2. **DPO configured** (`DPO_COMPANY_TOKEN` + `DPO_SERVICE_TYPE` set) —
   `createPaymentToken` (`lib/payments/dpo.ts`) opens a DPO transaction for
   the order total and returns a hosted-checkout URL
   (`https://secure.3gdirectpay.com/pay.asp?ID={token}`), which the buyer is
   sent to from the success panel / confirmation email.
3. **DPO not configured** — falls back to the event's external `ticket_url`,
   same as before DPO existed. Nothing breaks if you add DPO credentials
   later; purchases just start getting routed through DPO's checkout once
   both env vars are set.

Payment status then gets confirmed two ways, both re-verifying with DPO's
`verifyToken` rather than trusting a claimed status (DPO's push payload
isn't signed):

- **Webhook** (`app/api/payments/dpo/callback`) — DPO calls this
  server-to-server (the `BackURL` on the transaction) once the buyer pays.
- **Return page** (`/tickets/confirm`, the transaction's `RedirectURL`) —
  the buyer's browser lands here after paying; `app/api/payments/dpo/verify`
  re-checks with DPO if the webhook hasn't landed yet, so the page doesn't
  just show stale "pending" state.

Both paths write through `lib/supabase/service.ts` (the Supabase
**service role** key, bypassing RLS) rather than a public RPC — a
SECURITY DEFINER function grantable to `anon` would let anyone mark an
arbitrary order "paid" by guessing/observing its id. Payment writes are the
one place in this app that need a trusted, server-only credential; don't
use `createServiceClient()` anywhere else. Without
`SUPABASE_SERVICE_ROLE_KEY` set, ticket purchases still work — orders just
stay `pending` since there's nowhere to persist the DPO token or the
verified status.

## Tanzania mobile money (M-Pesa, Airtel Money, HaloPesa, Mixx by Yas)

When an order's currency is TZS and a DPO token was created, the success
panel also offers a native "pay with mobile money" form (network + phone
number) instead of sending the buyer to DPO's hosted page. Submitting it
calls `app/api/payments/dpo/charge-mobile`, which uses
`chargeMobileMoney` (`lib/payments/dpo.ts`, DPO's `ChargeTokenMobile`) to
push a PIN prompt straight to the buyer's phone, then sends them to
`/tickets/confirm` to watch for the real outcome the same way a card
payment does.

The four MNO codes this maps to (`TANZANIA_MNO_CODES` in `lib/payments/dpo.ts`)
were captured from a **live** sandbox `CompanyMobilePaymentOptions` /
`ChargeTokenMobile` call against a Tanzania-enabled DPO test account, not
from DPO's public docs (their response schema for this endpoint isn't
published) — three are a direct match (`TIGOdebitMandate` for Mixx by Yas,
`Selcom_webPay_Airtel` for Airtel Money, `Selcom_webPay_Halotel` for
HaloPesa); **M-Pesa is an inference** (`Selcom_webPay`, the one unsuffixed
entry in a response where every other Tanzania network had a named suffix —
DPO never labels it "Vodacom" or "Mpesa"). Confirm that one with DPO support
before relying on it for real payments, and correct it via `DPO_MNO_MPESA`
if it's wrong. A successful push also comes back in an undocumented shape —
`<StatusCode>130</StatusCode>` rather than the `<Result>000</Result>` every
other DPO v6 call uses — which is why `chargeMobileMoney` checks for
`StatusCode` specifically rather than reusing the `Result` parsing the rest
of this module shares.

## Design tokens

| Token | Hex |
| --- | --- |
| Comic Red | `#C0272F` |
| Sky Blue | `#29AAE0` |
| Hero Green | `#019245` |
| Golden Orange | `#E58622` |
| Action Orange | `#F35E24` |
| Comic Black | `#111111` |
| Warm White | `#FFF9F4` |

Defined in `app/globals.css` under `@theme inline`, exposed as Tailwind
utilities (`bg-comic-red`, `text-sky-blue`, …). `skc-admin` uses the same
tokens for a consistent look.

## How SKC Quest verification stays "exactly once"

`approve_quest_checkpoint` mirrors the redemption pattern: it locks the
Fan Pass row, checks the caller is an authenticated admin assigned to that
checkpoint (`is_assigned_to_checkpoint`), and relies on the
`unique (fan_pass_id, checkpoint_id)` constraint on `quest_completions`. A
repeat scan returns `ALREADY_COMPLETED` without awarding XP again. The
Fan Pass QR code only encodes the opaque `pass_code` — it is a lookup
reference for staff, never proof of completion by itself.

**Staff console note:** `/staff/quest` lives in this app for pilot
convenience and only renders staff tools after confirming the signed-in
user has an `admin_profiles` row (checked server-side; RLS and the RPCs
above enforce this independently of the UI). The `skc-admin` app remains
the source of truth for admin account creation and other staff tooling —
consider moving this console there if/when stricter origin isolation
between public and staff sessions is required.

## What's deliberately out of scope (per the PRD)

No ticket payment/checkout, no native mobile app, no Shop checkout (§9) and
no Masterclasses booking/LMS (§10) — both remain informational-only per the
user's request. Creator directory and competitions ship as informational
pages for now, ready to wire up to real content tables in P1. Native
ticketing, automated influencer payouts and FanZone posting remain gated
behind later phases per the PRD's go/no-go gates.
