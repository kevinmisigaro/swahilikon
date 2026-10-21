import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { chargeMobileMoney, normalizeTanzaniaPhone, DpoError } from "@/lib/payments/dpo";

const payloadSchema = z.object({
  confirmationRef: z.string().trim().min(4).max(40),
  network: z.enum(["mpesa", "airtel_money", "halopesa", "mixx_by_yas"]),
  phoneNumber: z.string().trim().min(6).max(20),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  }

  const { confirmationRef, network, phoneNumber } = parsed.data;
  const normalizedPhone = normalizeTanzaniaPhone(phoneNumber);
  if (!normalizedPhone) {
    return NextResponse.json(
      { error: "That doesn't look like a Tanzanian mobile number." },
      { status: 400 },
    );
  }

  try {
    const service = createServiceClient();
    const { data: order } = await service
      .from("ticket_orders")
      .select("payment_token, payment_status")
      .eq("confirmation_ref", confirmationRef.toUpperCase())
      .maybeSingle();

    if (!order || !order.payment_token) {
      return NextResponse.json({ error: "We couldn't find that order." }, { status: 404 });
    }
    if (order.payment_status !== "pending") {
      return NextResponse.json(
        { error: "This order has already been finalized." },
        { status: 409 },
      );
    }

    const { instructions } = await chargeMobileMoney({
      transToken: order.payment_token,
      phoneNumber: normalizedPhone,
      network,
    });

    return NextResponse.json({ instructions });
  } catch (err) {
    const message =
      err instanceof DpoError && (err.code === "954" || err.code === "955")
        ? "Please check your phone number and try again."
        : "We couldn't start that payment. Please try again.";
    console.error("[dpo/charge-mobile] charge failed", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
