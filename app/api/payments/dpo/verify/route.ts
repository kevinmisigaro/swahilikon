import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { syncTicketOrderPaymentStatus } from "@/lib/payments/orders";
import { formatEventDate, formatMoney } from "@/lib/utils";

// Backs the /tickets/confirm page the buyer's browser lands on after paying.
// The DPO BackURL webhook (app/api/payments/dpo/callback) is the primary way
// payment status gets confirmed, but it can arrive after the browser redirect
// does, so this route re-verifies with DPO itself if the order still looks
// pending rather than just reading what the webhook has (or hasn't) written yet.
export async function GET(request: Request) {
  const ref = new URL(request.url).searchParams.get("ref");
  if (!ref) {
    return NextResponse.json({ error: "Missing order reference." }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: order } = await service
    .from("ticket_orders")
    .select(
      "id, payment_status, payment_token, total_cents, currency, confirmation_ref, events(title, event_date, venue)",
    )
    .eq("confirmation_ref", ref.toUpperCase())
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "We couldn't find that order." }, { status: 404 });
  }

  let status = order.payment_status;
  if (status === "pending" && order.payment_token) {
    try {
      status = await syncTicketOrderPaymentStatus(order.id, order.payment_token);
    } catch (err) {
      console.error("[dpo/verify] re-verify failed", err);
    }
  }

  const event = Array.isArray(order.events) ? order.events[0] : order.events;

  return NextResponse.json({
    confirmationRef: order.confirmation_ref,
    status,
    eventTitle: event?.title ?? null,
    eventDate: event?.event_date ? formatEventDate(event.event_date) : null,
    venue: event?.venue ?? null,
    total: formatMoney(order.total_cents, order.currency),
  });
}
