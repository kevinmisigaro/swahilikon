import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Calendar, ExternalLink, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ComicButton } from "@/components/ui/ComicButton";
import { formatEventDate } from "@/lib/utils";
import { getEventBySlug } from "@/lib/data/events";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  return { title: event?.title ?? "Event" };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  return (
    <div>
      <div className="relative h-72 w-full overflow-hidden border-b-4 border-comic-black sm:h-96">
        {event.cover_image ? (
          <Image src={event.cover_image} alt={event.title} fill priority className="object-cover" />
        ) : (
          <div className="halftone h-full w-full bg-sky-blue/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-comic-black/80 to-transparent" />
        <div className="absolute bottom-6 left-0 w-full px-4 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <Link
              href="/events"
              className="mb-3 inline-flex items-center gap-1 font-sans text-sm font-bold text-white/85 hover:text-white"
            >
              <ArrowLeft size={16} /> All events
            </Link>
            <Badge tone={event.status === "upcoming" ? "upcoming" : "past"}>
              {event.status}
            </Badge>
            <h1 className="font-display mt-2 text-4xl text-white sm:text-6xl">
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <p className="text-lg text-comic-black/80">{event.description}</p>
        </div>

        <aside className="comic-panel h-fit space-y-4 rounded-2xl bg-white p-6">
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 shrink-0 text-comic-red" size={20} />
            <div>
              <p className="text-xs font-bold tracking-wide text-comic-black/50 uppercase">Date</p>
              <p className="font-semibold">{formatEventDate(event.event_date)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 shrink-0 text-comic-red" size={20} />
            <div>
              <p className="text-xs font-bold tracking-wide text-comic-black/50 uppercase">Venue</p>
              <p className="font-semibold">{event.venue}</p>
            </div>
          </div>

          {event.status === "upcoming" && (
            <div className="space-y-3 pt-2">
              <ComicButton href="/referral" variant="red" className="w-full">
                Enter Referral Code
              </ComicButton>
              {event.ticket_url && (
                <a
                  href={event.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm font-bold text-comic-red hover:underline"
                >
                  Official tickets <ExternalLink size={14} />
                </a>
              )}
            </div>
          )}
          {event.status === "past" && (
            <ComicButton href="/past-events" variant="outline" className="w-full">
              View photo gallery
            </ComicButton>
          )}
        </aside>
      </div>
    </div>
  );
}
