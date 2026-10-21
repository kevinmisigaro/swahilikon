import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().trim().max(180).optional().or(z.literal("")),
});

const SERVICE_UNAVAILABLE =
  "Quest Passes aren't available right now — the site owner needs to finish connecting Supabase. Please try again shortly.";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("fan_passes")
      .insert({
        holder_name: parsed.data.name,
        holder_email: parsed.data.email || null,
      })
      .select("pass_code, holder_name, xp, badge, created_at")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "We couldn't create your Quest pass. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ...data, completed_checkpoints: [], redeemed: false });
  } catch (err) {
    console.error("[quest/pass] unexpected error", err);
    return NextResponse.json({ error: SERVICE_UNAVAILABLE }, { status: 503 });
  }
}

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing pass code." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_quest_status", {
      p_pass_code: code,
    });

    const status = Array.isArray(data) ? data[0] : null;
    if (error || !status) {
      return NextResponse.json({ error: "Quest pass not found." }, { status: 404 });
    }

    return NextResponse.json(status);
  } catch (err) {
    console.error("[quest/pass] unexpected error", err);
    return NextResponse.json({ error: SERVICE_UNAVAILABLE }, { status: 503 });
  }
}
