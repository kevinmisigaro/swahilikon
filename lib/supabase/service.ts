import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client — bypasses RLS entirely. Only ever import
 * this from server-only payment code (lib/payments/**, the DPO webhook and
 * verify-on-return routes). Payment status is the one place in this app
 * where a trusted server process needs to write ticket_orders without a
 * signed-in admin session, so it can't go through RLS or a public
 * SECURITY DEFINER RPC the way the rest of the app does — those would let
 * anyone call it with an arbitrary order id. Never import this from a
 * Client Component or any code reachable from the browser.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — payment status updates are unavailable.",
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
