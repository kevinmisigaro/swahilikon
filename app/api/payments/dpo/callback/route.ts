import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { syncTicketOrderPaymentStatus } from "@/lib/payments/orders";

// DPO's pushPayments (BackURL) notification. Server-to-server, called by DPO
// after a payment attempt — see
// https://docs.dpopay.com/dpo-pay-by-network/reference/pushpayments
//
// The payload isn't signed, so we don't trust its claimed Result: we only
// use it to learn which TransactionToken to re-check, then ask DPO directly
// via verifyToken for the real status before writing anything.
const ACK_XML = `<?xml version="1.0" encoding="utf-8"?><API3G><Response>OK</Response></API3G>`;

function extractTag(xml: string, name: string): string | null {
  const match = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return match ? match[1].trim() : null;
}

export async function POST(request: Request) {
  const body = await request.text();
  const transactionToken = extractTag(body, "TransactionToken");

  if (!transactionToken) {
    console.error("[dpo/callback] push payload missing TransactionToken");
    return new NextResponse(ACK_XML, { headers: { "Content-Type": "application/xml" } });
  }

  try {
    const service = createServiceClient();
    const { data: order } = await service
      .from("ticket_orders")
      .select("id")
      .eq("payment_token", transactionToken)
      .maybeSingle();

    if (!order) {
      console.error("[dpo/callback] no ticket order for token", transactionToken);
    } else {
      await syncTicketOrderPaymentStatus(order.id, transactionToken);
    }
  } catch (err) {
    console.error("[dpo/callback] failed to sync payment status", err);
  }

  // Always ack — DPO retries undeliverable notifications, and a missing or
  // unknown order isn't something a retry would fix.
  return new NextResponse(ACK_XML, { headers: { "Content-Type": "application/xml" } });
}
