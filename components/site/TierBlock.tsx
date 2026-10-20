import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const COLOR_CLASSES = {
  red: "bg-comic-red",
  blue: "bg-sky-blue",
  green: "bg-hero-green",
} as const;

export function TierBlock({
  color,
  label,
  title,
  description,
  href,
  cta,
  disabled,
}: {
  color: keyof typeof COLOR_CLASSES;
  label: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  disabled?: boolean;
}) {
  const content = (
    <>
      <div
        className={cn(
          "comic-panel flex aspect-[4/3] items-center justify-center rounded-2xl p-6 text-center sm:aspect-square",
          COLOR_CLASSES[color],
        )}
      >
        <span className="font-display text-3xl text-white sm:text-4xl">{label}</span>
      </div>
      <div className="mt-4">
        <h3 className="font-display text-xl text-comic-black">{title}</h3>
        <p className="mt-1 text-sm text-comic-black/70">{description}</p>
        <span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-comic-black group-hover:underline">
          {cta} <ArrowRight size={14} />
        </span>
      </div>
    </>
  );

  if (disabled) {
    return (
      <div className="cursor-not-allowed opacity-50" aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="motion-safe-wiggle group block transition-transform duration-150"
    >
      {content}
    </Link>
  );
}
