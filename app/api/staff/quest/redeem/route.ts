import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const redeemSchema = z.object({
  passCode: z.string().trim().min(4).max(40),
});

const ERROR_MESSAGES: Record<string, string> = {
  not_authorized: "You're not authorized to redeem rewards.",
  pass_not_found: "Quest pass not found.",
  badge_not_earned: "This pass hasn't earned the Explorer badge yet.",
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = redeemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_quest_reward", {
    p_pass_code: parsed.data.passCode,
  });

  if (error) {
    const friendly = ERROR_MESSAGES[error.message] ?? "Couldn't redeem this reward.";
    return NextResponse.json(
      { error: friendly },
      { status: error.message === "not_authorized" ? 403 : 400 },
    );
  }

  const result = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ status: result?.status ?? "REDEEMED" });
}
