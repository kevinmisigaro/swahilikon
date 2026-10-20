"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Sparkles, Trophy, Loader2 } from "lucide-react";
import { ComicButtonAsButton } from "@/components/ui/ComicButton";

const STORAGE_KEY = "skc_fan_pass_code";

interface FanPass {
  pass_code: string;
  holder_name: string;
  xp: number;
  badge: string | null;
}

function readSavedPassCode() {
  return typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
}

export function FanPassPanel() {
  const [pass, setPass] = useState<FanPass | null>(null);
  const [loading, setLoading] = useState(() => readSavedPassCode() !== null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = readSavedPassCode();
    if (!saved) return;

    fetch(`/api/fan-pass?code=${encodeURIComponent(saved)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setPass(data))
      .catch(() => setPass(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/fan-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      localStorage.setItem(STORAGE_KEY, data.pass_code);
      setPass(data);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="comic-panel flex justify-center rounded-2xl bg-white p-8 text-comic-black/50">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (pass) {
    const progress = Math.min(pass.xp, 100);
    return (
      <div className="comic-panel rounded-2xl bg-white p-8 text-center">
        <span className="comic-panel-sm mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-hero-green text-white">
          <Sparkles size={28} />
        </span>
        <h2 className="font-display mt-4 text-3xl text-comic-black">
          {pass.holder_name}&apos;s Fan Pass
        </h2>
        <p className="mt-1 font-mono text-sm tracking-widest text-comic-black/60">
          {pass.pass_code}
        </p>

        <div className="mt-6 text-left">
          <div className="mb-1 flex justify-between text-sm font-bold text-comic-black">
            <span>Quest XP</span>
            <span>{pass.xp} / 100</span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full border-2 border-comic-black bg-comic-black/10">
            <div
              className="h-full bg-action-orange transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {pass.badge ? (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border-2 border-golden-orange bg-golden-orange/15 p-3 text-golden-orange">
            <Trophy size={20} />
            <span className="font-bold">{pass.badge} badge earned!</span>
          </div>
        ) : (
          <p className="mt-6 text-sm text-comic-black/60">
            Complete all five Quest checkpoints at the event to earn the Explorer
            badge.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleCreate} className="comic-panel rounded-2xl bg-white p-8">
      <h2 className="font-display text-center text-3xl text-comic-black">
        Create your free Fan Pass
      </h2>
      <p className="mt-2 text-center text-sm text-comic-black/60">
        Just your name — no payment, no commitment. Email is optional.
      </p>
      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="fp-name" className="mb-1 block text-sm font-bold text-comic-black">
            Name
          </label>
          <input
            id="fp-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border-2 border-comic-black px-4 py-3 focus:ring-4 focus:ring-golden-orange/40 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="fp-email" className="mb-1 block text-sm font-bold text-comic-black">
            Email (optional)
          </label>
          <input
            id="fp-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border-2 border-comic-black px-4 py-3 focus:ring-4 focus:ring-golden-orange/40 focus:outline-none"
          />
        </div>
        {error && <p className="text-sm font-semibold text-comic-red">{error}</p>}
        <ComicButtonAsButton type="submit" variant="green" className="w-full" disabled={creating}>
          {creating ? <Loader2 className="animate-spin" size={20} /> : "Get my Fan Pass"}
        </ComicButtonAsButton>
      </div>
    </form>
  );
}
