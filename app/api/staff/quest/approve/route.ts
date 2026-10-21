import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const approveSchema = z.object({
  passCode: z.string().trim().min(4).max(40),
  checkpointCode: z.string().trim().min(2).max(20),
});

const ERROR_MESSAGES: Record<string, string> = {
  not_authorized: "You're not authorized to approve this checkpoint.",
  not_assigned_to_checkpoint: "You're not assigned to this checkpoint.",
  checkpoint_not_found: "Unknown checkpoint.",
  checkpoint_closed: "This checkpoint is closed.",
  checkpoint_not_open_yet: "This checkpoint hasn't opened yet.",
  pass_not_found: "Quest pass not found. Check the code and try again.",
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = approveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("approve_quest_checkpoint", {
    p_pass_code: parsed.data.passCode,
    p_checkpoint_code: parsed.data.checkpointCode.toUpperCase(),
  });

  if (error) {
    const friendly = ERROR_MESSAGES[error.message] ?? "Couldn't approve this checkpoint.";
    const isAuth = error.message === "not_authorized" || error.message === "not_assigned_to_checkpoint";
    return NextResponse.json({ error: friendly }, { status: isAuth ? 403 : 400 });
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result) {
    return NextResponse.json({ error: "Couldn't approve this checkpoint." }, { status: 500 });
  }

  return NextResponse.json(result);
}
