import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { TicketForm } from "@/components/site/TicketForm";
import { formatEventDate, formatMoney } from "@/lib/utils";
import { getUpcomingEvent } from "@/lib/data/events";

export const metadata: Metadata = { title: "Get Tickets" };

export default async function TicketsPage() {
  const event = await getUpcomingEvent();

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <Badge tone="upcoming">{event.title} · {formatEventDate(event.event_date)}</Badge>
        <h1 className="font-display mt-3 text-5xl text-comic-black">Get Your Ticket</h1>
        <p className="mx-auto mt-4 max-w-md text-comic-black/70">
          {formatMoney(event.price_cents, event.currency)} gets you into{" "}
          {event.title} at {event.venue}. Got a code from an SKC influencer?
          Add it below for 10% off.
        </p>
      </div>

      <div className="mt-10">
        <TicketForm />
      </div>
    </div>
  );
}
