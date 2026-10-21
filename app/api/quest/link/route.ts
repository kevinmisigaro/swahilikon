import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const linkSchema = z.object({
  passCode: z.string().trim().min(4).max(40),
});

const ERROR_MESSAGES: Record<string, string> = {
  not_authorized: "Please sign in first.",
  profile_required: "Finish setting up your SKC profile before linking a Quest pass.",
  pass_not_found: "We couldn't find that Quest pass.",
  pass_already_linked: "That Quest pass is already linked to a different account.",
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("link_fan_pass_to_profile", {
    p_pass_code: parsed.data.passCode,
  });

  if (error) {
    const friendly = ERROR_MESSAGES[error.message] ?? "Couldn't link that Quest pass.";
    return NextResponse.json({ error: friendly }, { status: 400 });
  }

  const result = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ status: result?.status ?? "LINKED" });
}
