import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendTicketOrderConfirmationEmail } from "@/lib/email/resend";
import { getUpcomingEvent } from "@/lib/data/events";
import { formatEventDate, formatMoney } from "@/lib/utils";
import { createPaymentToken, getPaymentPageUrl, isDpoConfigured, DpoError } from "@/lib/payments/dpo";

const payloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().trim().max(180),
  code: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

const ERROR_MESSAGES: Record<string, string> = {
  code_not_found: "We couldn't find that referral code. Double-check it, or leave it blank to continue without a discount.",
  buyer_name_required: "Please enter your name.",
  valid_email_required: "Please enter a valid email address.",
  event_not_found: "This event isn't open for ticket sales right now.",
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

  const { name, email, code } = parsed.data;

  try {
    const supabase = await createClient();
    const event = await getUpcomingEvent();

    const { data, error } = await supabase.rpc("create_ticket_order", {
      p_event_slug: event.slug,
      p_buyer_name: name,
      p_buyer_email: email,
      p_code: code ?? null,
    });

    if (error) {
      const friendly = ERROR_MESSAGES[error.message] ?? ERROR_MESSAGES[error.code ?? ""];
      return NextResponse.json(
        { error: friendly ?? "We couldn't start your order. Please try again." },
        { status: 400 },
      );
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (!result) {
      return NextResponse.json(
        { error: "We couldn't start your order. Please try again." },
        { status: 500 },
      );
    }

    const unitPrice = formatMoney(result.unit_price_cents, result.currency);
    const discount = result.discount_cents > 0 ? formatMoney(result.discount_cents, result.currency) : null;
    const total = formatMoney(result.total_cents, result.currency);

    // Decide how the buyer will actually pay: a DPO hosted-checkout token if
    // DPO is configured, the event's external ticket link as a fallback
    // while it isn't, or nothing at all if the order is fully covered by a
    // discount.
    let paymentUrl: string | null = null;
    let alreadyPaid = false;
    let mobileMoneyAvailable = false;

    if (result.total_cents <= 0) {
      alreadyPaid = true;
      try {
        const service = createServiceClient();
        await service
          .from("ticket_orders")
          .update({ payment_status: "paid", paid_at: new Date().toISOString() })
          .eq("id", result.order_id);
      } catch (err) {
        console.error("[tickets/purchase] failed to mark free order paid", err);
      }
    } else if (isDpoConfigured()) {
      try {
        const origin = new URL(request.url).origin;
        const { transToken, transRef } = await createPaymentToken({
          amountCents: result.total_cents,
          currency: result.currency,
          companyRef: result.confirmation_ref,
          description: `${event.title} ticket`,
          redirectUrl: `${origin}/tickets/confirm?ref=${result.confirmation_ref}`,
          backUrl: `${origin}/api/payments/dpo/callback`,
          customerName: name,
          customerEmail: email,
        });

        const service = createServiceClient();
        await service
          .from("ticket_orders")
          .update({ payment_token: transToken, payment_ref: transRef })
          .eq("id", result.order_id);

        paymentUrl = getPaymentPageUrl(transToken);
        // Tanzania-specific mobile money networks (M-Pesa, Airtel Money,
        // HaloPesa, Mixx by Yas) — see lib/payments/dpo.ts.
        mobileMoneyAvailable = result.currency === "TZS";
      } catch (err) {
        const message = err instanceof DpoError ? `${err.code}: ${err.message}` : err;
        console.error("[tickets/purchase] DPO createToken failed, falling back to ticket_url", message);
        paymentUrl = event.ticket_url;
      }
    } else {
      paymentUrl = event.ticket_url;
    }

    const emailResult = await sendTicketOrderConfirmationEmail({
      to: email,
      buyerName: name,
      confirmationRef: result.confirmation_ref,
      eventTitle: event.title,
      eventDate: formatEventDate(event.event_date),
      venue: event.venue,
      unitPrice,
      discount,
      total,
      influencerName: result.influencer_name,
      paymentUrl,
      alreadyPaid,
    });

    if (emailResult.status !== "skipped") {
      await supabase.rpc("mark_ticket_order_email_status", {
        p_order_id: result.order_id,
        p_status: emailResult.status,
      });
    }

    return NextResponse.json({
      confirmationRef: result.confirmation_ref,
      influencerName: result.influencer_name,
      eventTitle: event.title,
      eventDate: formatEventDate(event.event_date),
      venue: event.venue,
      unitPrice,
      discount,
      total,
      paymentUrl,
      alreadyPaid,
      mobileMoneyAvailable,
    });
  } catch (err) {
    console.error("[tickets/purchase] unexpected error", err);
    return NextResponse.json(
      {
        error:
          "Ticket purchase isn't available right now — the site owner needs to finish connecting Supabase. Please try again shortly.",
      },
      { status: 503 },
    );
  }
}
