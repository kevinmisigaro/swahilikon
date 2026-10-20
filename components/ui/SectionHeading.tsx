import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      {eyebrow && (
        <p className="mb-1 inline-block rounded-full bg-comic-black px-3 py-1 font-sans text-xs font-bold tracking-[0.2em] text-white uppercase">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-4xl text-comic-black sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}
