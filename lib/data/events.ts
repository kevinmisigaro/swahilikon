import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type EventRow = Database["public"]["Tables"]["events"]["Row"];

/**
 * Fallback content so the site renders meaningfully before a Supabase
 * project is connected / migrated. Once `events` has real rows these are
 * never used — see lib/data/events.ts callers.
 */
const FALLBACK_EVENTS: EventRow[] = [
  {
    id: "fallback-upcoming",
    slug: "skc-reloaded-tanzanite-2026-11-14",
    title: "SKC Reloaded / Tanzanite",
    description:
      "The next Swahili Komik Con event. Get your ticket online — got a code from an SKC influencer? Add it at checkout for 10% off.",
    event_date: "2026-11-14",
    venue: "Dar es Salaam, Tanzania",
    schedule: [],
    ticket_url: null,
    price_cents: 150000,
    currency: "TZS",
    status: "upcoming",
    is_published: true,
    cover_image: "/images/hero/skc-hero-crowd.jpg",
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-past",
    slug: "skc-2026-08-02",
    title: "SKC 2026",
    description:
      "The first Swahili Komik Con gathering of 2026 — cosplay, gaming, animation and a live crowd that brought the energy all night.",
    event_date: "2026-08-02",
    venue: "Dar es Salaam, Tanzania",
    schedule: [],
    ticket_url: null,
    price_cents: 150000,
    currency: "TZS",
    status: "past",
    is_published: true,
    cover_image: "/images/hero/skc-hero-main.jpg",
    created_at: new Date().toISOString(),
  },
];

export async function getUpcomingEvent(): Promise<EventRow> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("status", "upcoming")
      .eq("is_published", true)
      .order("event_date", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error || !data) throw error ?? new Error("no upcoming event");
    return data;
  } catch {
    return FALLBACK_EVENTS[0];
  }
}

export async function getPastEvents(): Promise<EventRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("status", "past")
      .eq("is_published", true)
      .order("event_date", { ascending: false });
    if (error || !data || data.length === 0) throw error ?? new Error("no past events");
    return data;
  } catch {
    return FALLBACK_EVENTS.filter((e) => e.status === "past");
  }
}

export async function getEventBySlug(slug: string): Promise<EventRow | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
    throw new Error("not found in db");
  } catch {
    return FALLBACK_EVENTS.find((e) => e.slug === slug) ?? null;
  }
}

export async function getAllPublishedEvents(): Promise<EventRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("is_published", true)
      .order("event_date", { ascending: true });
    if (error || !data || data.length === 0) throw error ?? new Error("no events");
    return data;
  } catch {
    return FALLBACK_EVENTS;
  }
}
