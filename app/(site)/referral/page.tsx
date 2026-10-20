import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { ReferralForm } from "@/components/site/ReferralForm";
import { formatEventDate } from "@/lib/utils";
import { getUpcomingEvent } from "@/lib/data/events";

export const metadata: Metadata = { title: "Referral Code" };

export default async function ReferralPage() {
  const event = await getUpcomingEvent();

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <Badge tone="upcoming">{event.title} · {formatEventDate(event.event_date)}</Badge>
        <h1 className="font-display mt-3 text-5xl text-comic-black">Referral Code</h1>
        <p className="mx-auto mt-4 max-w-md text-comic-black/70">
          Got a code from an SKC influencer? Enter it below to confirm your
          spot at {event.venue}. This is registration, not a ticket purchase —
          no payment is collected.
        </p>
      </div>

      <div className="mt-10">
        <ReferralForm />
      </div>
    </div>
  );
}
