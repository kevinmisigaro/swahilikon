import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GalleryGrid } from "@/components/site/GalleryGrid";
import { formatEventDate } from "@/lib/utils";
import { getPastEvents } from "@/lib/data/events";
import { SKC_AUG_2026_GALLERY } from "@/lib/data/gallery";

export const metadata: Metadata = { title: "Past Events" };

export default async function PastEventsPage() {
  const pastEvents = await getPastEvents();
  const headline = pastEvents[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeading eyebrow="Archive" title="Past Events" />
      <p className="mt-4 max-w-2xl text-comic-black/70">
        A look back at SKC gatherings. These events have already happened —
        head to the{" "}
        <Link href="/events" className="font-semibold text-comic-red hover:underline">
          Events page
        </Link>{" "}
        for what&apos;s coming up next.
      </p>

      {headline && (
        <div className="comic-panel mt-10 rounded-2xl bg-white p-6">
          <h2 className="font-display text-3xl text-comic-black">{headline.title}</h2>
          <p className="mt-1 text-sm font-semibold text-comic-black/60">
            {formatEventDate(headline.event_date)} · {headline.venue}
          </p>
          <p className="mt-4 text-comic-black/80">{headline.description}</p>
        </div>
      )}

      <div className="mt-12">
        <h3 className="font-display text-2xl text-comic-black">Photo highlights</h3>
        <p className="mt-1 mb-6 text-sm text-comic-black/60">
          Cosplay, crowd energy and stage moments from the day.
        </p>
        <GalleryGrid
          images={SKC_AUG_2026_GALLERY}
          altPrefix="Swahili Komik Con — 2 August 2026"
        />
      </div>
    </div>
  );
}
