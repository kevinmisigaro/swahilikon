import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Keeps the Supabase project from auto-pausing. Free-plan projects are paused
 * after ~7 days without database activity, which happens between events when
 * the site gets little traffic. Vercel Cron (see vercel.json) calls this daily
 * and it runs one tiny read against Postgres so the project stays active.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET` on cron requests when the
 * CRON_SECRET env var is set; when it is, we reject anything else so the
 * endpoint can't be hammered by outsiders.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const supabase = createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // A real query (not just an HTTP ping) so it registers as database activity.
  const { error } = await supabase.from("events").select("id").limit(1);

  if (error) {
    console.error("[keep-alive] Supabase query failed", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
