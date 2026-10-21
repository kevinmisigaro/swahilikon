import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/types/database";

const MEMBER_ROLES = [
  "fan",
  "parent_guardian",
  "creator",
  "competitor",
  "vendor",
  "instructor",
  "influencer",
] as const satisfies readonly MemberRole[];

const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  role: z.enum(MEMBER_ROLES),
  bio: z.string().trim().max(500).optional().or(z.literal("")),
  interests: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
  details: z.record(z.string(), z.string().trim().max(300)).optional(),
  marketingOptIn: z.boolean().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Couldn't load your profile." }, { status: 500 });
  }

  return NextResponse.json({ email: user.email, profile: data });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { displayName, role, bio, interests, details, marketingOptIn } = parsed.data;

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        display_name: displayName,
        role,
        bio: bio || null,
        interests: interests ?? [],
        details: details ?? {},
        marketing_opt_in: marketingOptIn ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Couldn't save your profile." }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
