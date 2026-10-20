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
- My SKC: free Fan Pass, no payment or account required.

## Stack

Next.js (App Router, TypeScript) · Supabase (Postgres, Auth, Row Level
Security) · Resend (confirmation emails) · Tailwind CSS v4.

## 1. Set up Supabase

If you haven't already run it for `skc-admin`, apply the schema:

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run `supabase/migrations/0001_init.sql`. This creates
   every table, the RLS policies, and the `redeem_referral_code` function
   that makes code redemption atomic (so two people can never redeem the
   same code at once). It's the same migration as in `skc-admin` — only run
   it once per Supabase project.
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
  api/
    referral/redeem/   Public redemption endpoint (calls the Postgres RPC)
    fan-pass/          Free Fan Pass create/lookup
components/
  ui/                 Shared comic-styled primitives (buttons, badges, headings)
  site/               Public-site components
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

## What's deliberately out of scope (per the PRD)

No ticket payment/checkout, no native mobile app, no Shop checkout. The
Quest (five-checkpoint scavenger pilot) is modeled in the schema notes but
not built in this pass — it's explicitly secondary to the referral-code
system in the PRD and should follow once the pilot is stable. Creator
directory, competitions and masterclasses ship as informational pages for
now, ready to wire up to real content tables in P1.
