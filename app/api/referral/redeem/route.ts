import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendRedemptionConfirmationEmail } from "@/lib/email/resend";
import { getUpcomingEvent } from "@/lib/data/events";
import { formatEventDate } from "@/lib/utils";

const payloadSchema = z.object({
  code: z.string().trim().min(3).max(40),
  name: z.string().trim().min(2).max(120),
  email: z.email().trim().max(180),
});

const ERROR_MESSAGES: Record<string, string> = {
  code_not_found: "We couldn't find that referral code. Double-check it and try again.",
  code_not_available: "This referral code has already been redeemed or has been disabled.",
  visitor_name_required: "Please enter your name.",
  valid_email_required: "Please enter a valid email address.",
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const { code, name, email } = parsed.data;

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("redeem_referral_code", {
      p_code: code,
      p_visitor_name: name,
      p_visitor_email: email,
    });

    if (error) {
      const friendly = ERROR_MESSAGES[error.message] ?? ERROR_MESSAGES[error.code ?? ""];
      const isConflict = error.message === "code_not_available" || error.code === "23505";
      return NextResponse.json(
        { error: friendly ?? "We couldn't redeem that code. Please try again." },
        { status: isConflict ? 409 : 400 },
      );
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (!result) {
      return NextResponse.json(
        { error: "We couldn't redeem that code. Please try again." },
        { status: 500 },
      );
    }

    const event = await getUpcomingEvent();

    const emailResult = await sendRedemptionConfirmationEmail({
      to: email,
      visitorName: name,
      confirmationRef: result.confirmation_ref,
      eventTitle: event.title,
      eventDate: formatEventDate(event.event_date),
      venue: event.venue,
    });

    if (emailResult.status !== "skipped") {
      await supabase.rpc("mark_redemption_email_status", {
        p_redemption_id: result.redemption_id,
        p_status: emailResult.status,
      });
    }

    return NextResponse.json({
      confirmationRef: result.confirmation_ref,
      influencerName: result.influencer_name,
      eventTitle: event.title,
      eventDate: formatEventDate(event.event_date),
      venue: event.venue,
    });
  } catch (err) {
    console.error("[referral/redeem] unexpected error", err);
    return NextResponse.json(
      {
        error:
          "Referral redemption isn't available right now — the site owner needs to finish connecting Supabase. Please try again shortly.",
      },
      { status: 503 },
    );
  }
}
