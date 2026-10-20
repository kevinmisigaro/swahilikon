import type { Metadata } from "next";
import { Palette } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Masterclasses" };

export default function MasterclassesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeading eyebrow="Learn" title="Masterclasses" />
      <p className="mt-4 max-w-2xl text-comic-black/70">
        Hands-on workshops with working creators. Topics, instructor profiles,
        schedule and capacity are published once confirmed by the organiser.
      </p>

      <div className="comic-panel halftone mt-10 rounded-2xl bg-golden-orange/10 p-8 text-center">
        <span className="comic-panel-sm mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-golden-orange text-white">
          <Palette size={24} />
        </span>
        <div className="mt-4">
          <Badge tone="neutral">Schedule opens after P0 pilot</Badge>
        </div>
        <h3 className="font-display mt-4 text-3xl text-comic-black">
          Workshop lineup coming soon
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-comic-black/70">
          Masterclasses launch in the post-event phase, alongside the creator
          directory and competitions.
        </p>
      </div>
    </div>
  );
}
