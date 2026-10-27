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

const UNITS: {
  key: keyof ReturnType<typeof getRemaining>;
  label: string;
  color: string;
  rotate: string;
}[] = [
  { key: "days", label: "Days", color: "bg-comic-red text-white", rotate: "-rotate-2" },
  { key: "hours", label: "Hours", color: "bg-sky-blue text-comic-black", rotate: "rotate-2" },
  { key: "mins", label: "Mins", color: "bg-golden-orange text-comic-black", rotate: "-rotate-2" },
  { key: "secs", label: "Secs", color: "bg-hero-green text-white", rotate: "rotate-2" },
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
    <div className="grid grid-cols-4 gap-3 md:gap-6">
      {UNITS.map(({ key, label, color, rotate }) => (
        <div
          key={key}
          className={`comic-panel p-3 text-center md:p-6 ${color} ${rotate}`}
        >
          <div className="font-display text-4xl md:text-7xl">
            {remaining ? String(remaining[key]).padStart(2, "0") : "00"}
          </div>
          <div className="font-bold uppercase">{label}</div>
        </div>
      ))}
    </div>
  );
}
