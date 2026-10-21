"use client";

import { useEffect, useState } from "react";

function getRemaining(target: number) {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    mins: Math.floor((diff / 60_000) % 60),
    secs: Math.floor((diff / 1_000) % 60),
  };
}

const UNITS: { key: keyof ReturnType<typeof getRemaining>; label: string }[] = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "mins", label: "Mins" },
  { key: "secs", label: "Secs" },
];

export function Countdown({ targetIso }: { targetIso: string }) {
  const target = new Date(targetIso).getTime();
  // Start null so server and first client render match; real value fills in post-mount.
  const [remaining, setRemaining] = useState<ReturnType<typeof getRemaining> | null>(null);

  useEffect(() => {
    // Mount-time sync: fills in the real countdown now that we're on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemaining(getRemaining(target));
    const id = setInterval(() => setRemaining(getRemaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-5">
      {UNITS.map(({ key, label }) => (
        <div
          key={key}
          className="comic-panel flex flex-col items-center rounded-2xl bg-comic-black px-2 py-4 sm:px-4 sm:py-6"
        >
          <span className="font-display text-4xl text-action-orange sm:text-6xl">
            {remaining ? String(remaining[key]).padStart(2, "0") : "00"}
          </span>
          <span className="mt-1 text-[11px] font-bold tracking-[0.2em] text-white/70 uppercase sm:text-xs">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
