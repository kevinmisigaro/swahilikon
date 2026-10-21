import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("quest_staff_summary");

  const summary = Array.isArray(data) ? data[0] : data;
  if (error || !summary) {
    return NextResponse.json({ error: "Not authorized or no data available." }, { status: 403 });
  }

  return NextResponse.json(summary);
}
