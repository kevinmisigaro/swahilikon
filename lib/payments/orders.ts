import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyPayment, type VerifiedPaymentStatus } from "@/lib/payments/dpo";

/** Re-verifies a ticket order's payment with DPO and persists the authoritative status. Idempotent — safe to call repeatedly (webhook retries, repeat page visits). */
export async function syncTicketOrderPaymentStatus(
  orderId: string,
  paymentToken: string,
): Promise<VerifiedPaymentStatus> {
  const verify = await verifyPayment(paymentToken);
  const service = createServiceClient();

  const { data: current } = await service
    .from("ticket_orders")
    .select("paid_at")
    .eq("id", orderId)
    .maybeSingle();

  await service
    .from("ticket_orders")
    .update({
      payment_status: verify.status,
      paid_at:
        verify.status === "paid" ? current?.paid_at ?? new Date().toISOString() : current?.paid_at ?? null,
    })
    .eq("id", orderId);

  return verify.status;
}
