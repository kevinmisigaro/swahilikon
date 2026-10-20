import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Competitions" };

const competitions = [
  {
    name: "Cosplay Competition",
    blurb: "Craftsmanship, performance and accuracy — open categories for all skill levels.",
  },
  {
    name: "Fan Art Competition",
    blurb: "Original illustration inspired by comics, anime, gaming or African pop culture.",
  },
  {
    name: "Gaming Tournament",
    blurb: "Bracket-style competitive play across featured titles at the event.",
  },
];

export default function CompetitionsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeading eyebrow="Compete" title="Competitions" />
      <div className="mt-4 flex max-w-2xl flex-wrap items-center gap-3">
        <Badge tone="upcoming">Opens closer to the event</Badge>
        <p className="text-comic-black/70">
          Rules, eligibility, opening/closing dates and submission
          instructions are published here ahead of each event. Entries stay
          private until the judging panel approves results.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {competitions.map((c) => (
          <div key={c.name} className="comic-panel rounded-2xl bg-white p-6">
            <h3 className="font-display text-2xl text-comic-black">{c.name}</h3>
            <p className="mt-2 text-sm text-comic-black/70">{c.blurb}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
