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
- Referral Code redemption (the P0 feature): a visitor enters a code, the
  backend confirms and redeems it exactly once, and Resend sends a
  confirmation email.
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
   `supabase/migrations/0002_profiles_and_quest.sql`, in that order. The
   first creates core tables, RLS policies, and the `redeem_referral_code`
   function that makes code redemption atomic. The second adds member
   `profiles` plus the `quest_checkpoints` / `quest_completions` /
   `quest_redemptions` tables and the `approve_quest_checkpoint` /
   `redeem_quest_reward` / `link_fan_pass_to_profile` RPCs that keep Quest
   verification exactly-once and staff-authorized. These are the same
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
    referral/redeem/    Public redemption endpoint (calls the Postgres RPC)
    profile/            Signed-in member's own profile (get/create/update)
    quest/               Public checkpoints, guest pass create/lookup, pass-linking
    staff/quest/         Staff-authorized approve/redeem/summary endpoints
components/
  ui/                 Shared comic-styled primitives (buttons, badges, headings)
  site/               Public-site components (AuthPanel, ProfileSetupForm/Dashboard,
                      FanPassPanel, StaffQuestConsole, ...)
lib/
  supabase/            Browser / server Supabase clients (anon key only — no service role here)
  data/                Server-only data-fetching helpers
  email/               Resend integration
supabase/migrations/   SQL schema, RLS policies, the atomic redemption function
public/images/          Curated photos from the 2 August 2026 event
```

## How redemption stays "exactly once"

`redeem_referral_code` (see the migration) does three things in a single
Postgres function call: locks the matching code row (`FOR UPDATE`), flips
its status from `available` to `used` only if it's still `available`, and
inserts the redemption row — which has a `UNIQUE` constraint on
`referral_code_id`. A concurrent second request either blocks on the lock
and then finds the code no longer `available`, or loses the unique-index
race on insert. Either way it gets a clean rejection instead of a duplicate
redemption or duplicate confirmation email.

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
