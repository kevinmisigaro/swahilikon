import type { Metadata } from "next";
import Link from "next/link";
import { Users, Gamepad2, Palette, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Explore" };

const directory = {
  icon: Users,
  title: "Creator Directory",
  copy: "Artists, illustrators, animators, studios, cosplayers, game developers and educators — approved profiles launch after the November pilot.",
  color: "bg-sky-blue",
  status: "Opening soon",
};

const sections = [
  {
    icon: Gamepad2,
    title: "Competitions",
    copy: "Cosplay, art and gaming competitions with rules, eligibility, dates and entry instructions.",
    href: "/competitions",
    color: "bg-hero-green",
    status: "See details",
  },
  {
    icon: Palette,
    title: "Masterclasses",
    copy: "Workshops with working creators — topics, instructor profiles and schedule.",
    href: "/masterclasses",
    color: "bg-golden-orange",
    status: "See details",
  },
  {
    icon: Sparkles,
    title: "FanZone",
    copy: "A moderated community space across Anime & Manga, Comics & Superheroes, Cosplay, Gaming & Esports, Animation & Film, and African Creators.",
    href: "/fanzone",
    color: "bg-comic-red",
    status: "See categories",
  },
];

export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeading eyebrow="Discovery hub" title="Explore SKC" />
      <p className="mt-4 max-w-2xl text-comic-black/70">
        One place to find creators, competitions, workshops and the wider SKC
        community.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {/* Not yet linkable — the Creator Directory itself opens after the pilot. */}
        <div className="comic-panel flex flex-col gap-3 rounded-2xl bg-white p-6">
          <div className="flex items-center justify-between">
            <span className={`comic-panel-sm flex h-12 w-12 items-center justify-center rounded-full ${directory.color} text-white`}>
              <directory.icon size={22} />
            </span>
            <Badge tone="upcoming">{directory.status}</Badge>
          </div>
          <h3 className="font-display text-2xl text-comic-black">{directory.title}</h3>
          <p className="text-sm text-comic-black/70">{directory.copy}</p>
        </div>

        {sections.map(({ icon: Icon, title, copy, href, color, status }) => (
          <Link
            key={title}
            href={href}
            className="comic-panel motion-safe-wiggle flex flex-col gap-3 rounded-2xl bg-white p-6 transition-transform duration-150"
          >
            <div className="flex items-center justify-between">
              <span className={`comic-panel-sm flex h-12 w-12 items-center justify-center rounded-full ${color} text-white`}>
                <Icon size={22} />
              </span>
              <Badge tone="neutral">{status}</Badge>
            </div>
            <h3 className="font-display text-2xl text-comic-black">{title}</h3>
            <p className="text-sm text-comic-black/70">{copy}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
