import type { Metadata } from "next";
import { TicketConfirmStatus } from "@/components/site/TicketConfirmStatus";

export const metadata: Metadata = { title: "Order Confirmation" };

export default async function TicketConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="font-display text-4xl text-comic-black">Order Status</h1>
      </div>
      {ref ? (
        <TicketConfirmStatus confirmationRef={ref} />
      ) : (
        <div className="comic-panel rounded-2xl bg-white p-8 text-center text-comic-black/70">
          Missing order reference.
        </div>
      )}
    </div>
  );
}
