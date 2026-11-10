"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, GalleryVertical, BookOpen } from "lucide-react";
import { ComicButtonAsButton } from "@/components/ui/ComicButton";
import { cn } from "@/lib/utils";
import type { Comic } from "@/lib/data/comics";

type Mode = "scroll" | "page";

const PAGE_SIZES = "(min-width: 896px) 832px, 100vw";

export function ComicReader({ comic }: { comic: Comic }) {
  const [mode, setMode] = useState<Mode>("scroll");
  const [index, setIndex] = useState(0);
  const last = comic.pages.length - 1;
  const pageRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (next: number) => {
      setIndex(Math.min(Math.max(next, 0), last));
      // If the reader has scrolled past the top of the page (e.g. after
      // hitting Next at the bottom), bring the new page's top into view.
      const el = pageRef.current;
      if (el && el.getBoundingClientRect().top < 0) {
        el.scrollIntoView({ block: "start" });
      }
    },
    [last],
  );

  useEffect(() => {
    if (mode !== "page") return;
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, index, go]);

  function pageLabel(i: number) {
    // Not every comic ends on a back cover (Heri's last page is story art),
    // so only the first page gets a special label.
    return i === 0 ? "Cover" : `Page ${i}`;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Reading mode"
          className="comic-panel-sm inline-flex overflow-hidden rounded-full bg-white"
        >
          {(
            [
              { value: "scroll", label: "Scroll", Icon: GalleryVertical },
              { value: "page", label: "Page by page", Icon: BookOpen },
            ] as const
          ).map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 text-sm font-bold transition-colors",
                mode === value ? "bg-comic-black text-white" : "text-comic-black hover:bg-comic-black/10",
              )}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
        {mode === "page" && (
          <p className="text-sm font-bold text-comic-black/60" aria-live="polite">
            {pageLabel(index)} · {index + 1} / {comic.pages.length}
          </p>
        )}
      </div>

      {mode === "scroll" ? (
        <div className="mx-auto flex max-w-[832px] flex-col gap-6">
          {comic.pages.map((src, i) => (
            <figure key={src} className="comic-panel overflow-hidden rounded-2xl bg-white">
              <Image
                src={src}
                alt={`${comic.title} — ${pageLabel(i)}`}
                width={comic.pageWidth}
                height={comic.pageHeight}
                sizes={PAGE_SIZES}
                priority={i === 0}
                className="h-auto w-full"
              />
            </figure>
          ))}
          <EndPanel comic={comic} />
        </div>
      ) : (
        <div className="mx-auto max-w-[832px]">
          <div
            ref={pageRef}
            className="comic-panel relative scroll-mt-24 overflow-hidden rounded-2xl bg-white"
          >
            <Image
              key={comic.pages[index]}
              src={comic.pages[index]}
              alt={`${comic.title} — ${pageLabel(index)}`}
              width={comic.pageWidth}
              height={comic.pageHeight}
              sizes={PAGE_SIZES}
              priority
              className="h-auto w-full"
            />
            {/* Tap the left/right half of the page to turn it. */}
            <button
              type="button"
              aria-label="Previous page"
              disabled={index === 0}
              onClick={() => go(index - 1)}
              className="absolute inset-y-0 left-0 w-1/3 cursor-w-resize disabled:cursor-default"
            />
            <button
              type="button"
              aria-label="Next page"
              disabled={index === last}
              onClick={() => go(index + 1)}
              className="absolute inset-y-0 right-0 w-1/3 cursor-e-resize disabled:cursor-default"
            />
          </div>
          {/* Preload the next page so turning feels instant. */}
          {index < last && (
            <Image
              src={comic.pages[index + 1]}
              alt=""
              aria-hidden
              width={comic.pageWidth}
              height={comic.pageHeight}
              sizes={PAGE_SIZES}
              priority
              className="hidden"
            />
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <ComicButtonAsButton variant="outline" onClick={() => go(index - 1)} disabled={index === 0}>
              <ChevronLeft size={20} /> Prev
            </ComicButtonAsButton>
            <ComicButtonAsButton variant="red" onClick={() => go(index + 1)} disabled={index === last}>
              Next <ChevronRight size={20} />
            </ComicButtonAsButton>
          </div>
          <p className="mt-3 text-center text-xs text-comic-black/50">
            Tip: use your ← → arrow keys, or tap the sides of the page.
          </p>
          {index === last && (
            <div className="mt-8">
              <EndPanel comic={comic} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EndPanel({ comic }: { comic: Comic }) {
  return (
    <div className="comic-panel halftone rounded-2xl bg-white p-6 text-center">
      <p className="font-display text-3xl text-comic-black">Mwisho — The End</p>
      <p className="mt-1 text-sm text-comic-black/70">
        Thanks for reading {comic.title} by {comic.creator}.
      </p>
    </div>
  );
}
