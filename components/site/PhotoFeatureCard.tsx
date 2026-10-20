import Image from "next/image";
import { cn } from "@/lib/utils";

const BORDER_CLASSES = {
  red: "border-comic-red",
  blue: "border-sky-blue",
  green: "border-hero-green",
  orange: "border-golden-orange",
} as const;

export type FeatureBorderColor = keyof typeof BORDER_CLASSES;

export function PhotoFeatureCard({
  image,
  title,
  subtitle,
  color,
  className,
}: {
  image: string;
  title: string;
  subtitle?: string;
  color: FeatureBorderColor;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border-4 bg-comic-black shadow-[6px_6px_0_var(--color-comic-black)]",
        BORDER_CLASSES[color],
        className,
      )}
    >
      <div className="relative aspect-[4/5] w-full sm:aspect-square">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover opacity-80 transition-transform duration-300 group-hover:scale-105 group-hover:opacity-100"
          sizes="(min-width: 768px) 33vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-comic-black via-comic-black/10 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="font-display text-2xl text-white sm:text-3xl">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-xs font-bold tracking-wide text-white/80 uppercase">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
