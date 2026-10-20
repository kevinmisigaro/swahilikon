import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = { title: "FanZone" };

const categories = [
  { name: "Anime & Manga", color: "bg-comic-red" },
  { name: "Comics & Superheroes", color: "bg-sky-blue" },
  { name: "Cosplay", color: "bg-golden-orange" },
  { name: "Gaming & Esports", color: "bg-hero-green" },
  { name: "Animation & Film", color: "bg-action-orange" },
  { name: "African Creators", color: "bg-comic-black" },
];

export default function FanZonePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeading eyebrow="Community" title="FanZone" />
      <p className="mt-4 max-w-2xl text-comic-black/70">
        A moderated community landing area. FanZone launches with
        staff-seeded content and curated links — open uploads and private
        messaging are intentionally excluded for now.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div
            key={cat.name}
            className={`comic-panel-sm flex h-28 flex-col items-center justify-center gap-1 rounded-2xl p-4 text-center text-white ${cat.color}`}
          >
            <span className="font-display text-xl">{cat.name}</span>
            <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase">
              Coming soon
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
