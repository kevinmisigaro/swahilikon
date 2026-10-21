import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { MySkcDashboard } from "@/components/site/MySkcDashboard";

export const metadata: Metadata = { title: "My SKC" };

export default function MySkcPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <SectionHeading eyebrow="Your membership" title="My SKC" align="center" />
      <p className="mx-auto mt-4 max-w-md text-center text-comic-black/70">
        Your free Fan Pass, Quest progress and SKC identity — always free.
      </p>
      <div className="mt-10">
        <MySkcDashboard />
      </div>
    </div>
  );
}
