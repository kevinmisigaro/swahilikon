import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: admin } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!admin) {
    return NextResponse.json({ error: "Not authorized for staff access." }, { status: 403 });
  }

  // Platform admins and event managers can act on every checkpoint; other
  // staff only see checkpoints they've been explicitly assigned to.
  if (admin.role === "platform_admin" || admin.role === "event_manager") {
    const { data, error } = await supabase
      .from("quest_checkpoints")
      .select("code, title, xp, is_active")
      .order("sort_order", { ascending: true });

    if (error) return NextResponse.json({ error: "Couldn't load checkpoints." }, { status: 500 });
    return NextResponse.json({ checkpoints: data });
  }

  const { data, error } = await supabase
    .from("staff_checkpoint_assignments")
    .select("quest_checkpoints(code, title, xp, is_active)")
    .eq("admin_profile_id", user.id);

  if (error) return NextResponse.json({ error: "Couldn't load checkpoints." }, { status: 500 });

  const checkpoints = (data ?? [])
    .map((row) => row.quest_checkpoints)
    .flat()
    .filter(Boolean);
  return NextResponse.json({ checkpoints });
}
