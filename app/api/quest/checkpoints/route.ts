import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quest_checkpoints")
    .select("code, title, mission_text, xp, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Couldn't load the Quest checkpoints." }, { status: 500 });
  }

  return NextResponse.json({ checkpoints: data });
}
