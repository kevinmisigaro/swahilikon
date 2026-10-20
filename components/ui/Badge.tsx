import { cn } from "@/lib/utils";

type Tone = "available" | "used" | "disabled" | "upcoming" | "past" | "neutral";

const toneClasses: Record<Tone, string> = {
  available: "bg-hero-green/15 text-hero-green border-hero-green",
  used: "bg-sky-blue/15 text-sky-blue border-sky-blue",
  disabled: "bg-comic-red/15 text-comic-red border-comic-red",
  upcoming: "bg-golden-orange/15 text-golden-orange border-golden-orange",
  past: "bg-comic-black/10 text-comic-black border-comic-black",
  neutral: "bg-comic-black/10 text-comic-black border-comic-black",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold tracking-wide uppercase",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
