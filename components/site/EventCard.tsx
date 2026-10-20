import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatEventDate } from "@/lib/utils";
import type { EventRow } from "@/lib/data/events";

export function EventCard({ event }: { event: EventRow }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="comic-panel motion-safe-wiggle group block overflow-hidden rounded-2xl bg-white transition-transform duration-150"
    >
      <div className="relative h-48 w-full overflow-hidden border-b-4 border-comic-black">
        {event.cover_image ? (
          <Image
            src={event.cover_image}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(min-width: 768px) 400px, 100vw"
          />
        ) : (
          <div className="halftone flex h-full w-full items-center justify-center bg-sky-blue/20">
            <span className="font-display text-3xl text-comic-black/40">SKC</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge tone={event.status === "upcoming" ? "upcoming" : "past"}>
            {event.status}
          </Badge>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display text-2xl text-comic-black">{event.title}</h3>
        <p className="mt-1 text-sm font-semibold text-comic-red">
          {formatEventDate(event.event_date)}
        </p>
        <p className="mt-2 line-clamp-2 text-sm text-comic-black/70">
          {event.description}
        </p>
        <p className="mt-3 text-xs font-bold tracking-wide text-comic-black/50 uppercase">
          {event.venue}
        </p>
      </div>
    </Link>
  );
}
