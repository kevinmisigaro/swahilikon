import { ComicButton } from "@/components/ui/ComicButton";
import { cn } from "@/lib/utils";

const COLOR_CLASSES = {
  green: "bg-hero-green text-white",
  red: "bg-comic-red text-white",
  orange: "bg-action-orange text-white",
} as const;

const BUTTON_VARIANT = {
  green: "green",
  red: "red",
  orange: "orange",
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
  return (
    <div
      className={cn("comic-panel relative bg-white p-6 pt-10", disabled && "opacity-50")}
      aria-disabled={disabled || undefined}
    >
      <span
        className={cn(
          "comic-panel-sm absolute -top-5 left-4 -rotate-3 px-3 py-1 font-display text-xl",
          COLOR_CLASSES[color],
        )}
      >
        {label}
      </span>
      <h3 className="font-display text-4xl text-comic-black">{title}</h3>
      <p className="mt-3 text-comic-black">{description}</p>
      <ComicButton
        href={href}
        variant={BUTTON_VARIANT[color]}
        disabled={disabled}
        className="mt-6"
      >
        {cta}
      </ComicButton>
    </div>
  );
}
