import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EventCard } from "@/components/site/EventCard";
import { getAllPublishedEvents } from "@/lib/data/events";

export const metadata: Metadata = { title: "Events" };

export default async function EventsPage() {
  const events = await getAllPublishedEvents();
  const upcoming = events.filter((e) => e.status === "upcoming");
  const past = events.filter((e) => e.status === "past");

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeading eyebrow="What's on" title="Events" />
      <p className="mt-4 max-w-2xl text-comic-black/70">
        Dates, venue and schedule for every SKC gathering — plus the official
        ticket link when one is live.
      </p>

      {upcoming.length > 0 && (
        <div className="mt-10">
          <h3 className="font-display text-2xl text-comic-black">Upcoming</h3>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="mt-14">
          <h3 className="font-display text-2xl text-comic-black">Past</h3>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {upcoming.length === 0 && past.length === 0 && (
        <div className="comic-panel halftone mt-10 rounded-2xl bg-sky-blue/10 p-10 text-center">
          <h3 className="font-display text-2xl text-comic-black">
            No events published yet
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-comic-black/70">
            Check back soon — the next SKC gathering will show up here as
            soon as it&apos;s confirmed.
          </p>
        </div>
      )}
    </div>
  );
}
