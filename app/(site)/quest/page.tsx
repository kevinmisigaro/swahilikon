import type { Metadata } from "next";
import { MapPin, Clock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FanPassPanel } from "@/components/site/FanPassPanel";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "SKC Quest" };

export default async function QuestPage() {
  const supabase = await createClient();
  const { data: checkpoints } = await supabase
    .from("quest_checkpoints")
    .select("code, title, mission_text, xp, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const totalXp = (checkpoints ?? []).reduce((sum, c) => sum + c.xp, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <Badge tone="upcoming">Free · No purchase required</Badge>
        <h1 className="font-display mt-3 text-5xl text-comic-black">SKC Quest</h1>
        <p className="mx-auto mt-4 max-w-xl text-comic-black/70">
          Visit every station, complete the mission, and show your Fan Pass to
          checkpoint staff to earn XP. Finish all five to unlock the Explorer
          badge and prize eligibility.
        </p>
      </div>

      <div className="comic-panel mt-10 grid grid-cols-1 gap-4 rounded-2xl bg-white p-6 text-sm sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <Clock className="shrink-0 text-action-orange" size={20} />
          <span>Completion closes 16:00 EAT, 14 Nov 2026</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="shrink-0 text-sky-blue" size={20} />
          <span>Dar es Salaam — all zones</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="shrink-0 text-hero-green" size={20} />
          <span>Verified by staff only — no self check-in</span>
        </div>
      </div>

      <div className="mt-12">
        <SectionHeading eyebrow={`${totalXp} XP total`} title="The five stations" />
        <ol className="mt-6 space-y-4">
          {(checkpoints ?? []).map((cp, i) => (
            <li key={cp.code} className="comic-panel-sm flex gap-4 rounded-xl bg-white p-4">
              <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-comic-red text-lg text-white">
                {i + 1}
              </span>
              <div>
                <p className="font-display text-xl text-comic-black">{cp.title}</p>
                <p className="mt-1 text-sm text-comic-black/70">{cp.mission_text}</p>
                <p className="mt-1 text-xs font-bold tracking-wide text-golden-orange uppercase">
                  +{cp.xp} XP
                </p>
              </div>
            </li>
          ))}
          {(!checkpoints || checkpoints.length === 0) && (
            <p className="text-center text-comic-black/60">
              Quest stations will be published closer to the event.
            </p>
          )}
        </ol>
      </div>

      <div className="mt-12">
        <SectionHeading eyebrow="Your pass" title="Get your free Fan Pass" />
        <p className="mt-2 text-comic-black/70">
          No email or phone required to play. Staff verify every completion on
          their own device — your Quest pass QR is just a lookup code, not
          proof of completion.
        </p>
        <div className="mt-6">
          <FanPassPanel />
        </div>
      </div>
    </div>
  );
}
