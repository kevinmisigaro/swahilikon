import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { COMICS } from "@/lib/data/comics";

export const metadata: Metadata = { title: "Comics" };

export default function ComicsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeading eyebrow="Read online" title="Comics" />
      <p className="mt-4 max-w-2xl text-comic-black/70">
        Web comics from East African creators — free to read right here on the site.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {COMICS.map((comic) => (
          <Link
            key={comic.slug}
            href={`/comics/${comic.slug}`}
            className="comic-panel motion-safe-wiggle group block overflow-hidden rounded-2xl bg-white transition-transform duration-150"
          >
            <div className="relative aspect-[1400/1986] w-full overflow-hidden border-b-4 border-comic-black">
              <Image
                src={comic.pages[0]}
                alt={`${comic.title} cover`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
              />
              {/* Solid backing so the translucent badge stays legible over cover art. */}
              <div className="absolute top-3 left-3 rounded-full bg-white">
                <Badge tone="upcoming">{comic.language}</Badge>
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-display text-2xl text-comic-black">{comic.title}</h3>
              {comic.subtitle && (
                <p className="text-sm font-semibold text-comic-red">{comic.subtitle}</p>
              )}
              <p className="mt-2 line-clamp-3 text-sm text-comic-black/70">{comic.description}</p>
              <p className="mt-3 flex items-center gap-2 text-xs font-bold tracking-wide text-comic-black/50 uppercase">
                <BookOpen size={14} /> {comic.creator} · {comic.pages.length} pages
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
