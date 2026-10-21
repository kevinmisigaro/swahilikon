"use client";

import { useEffect, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import { Sparkles, Trophy, Loader2, CheckCircle2, Circle, Link2 } from "lucide-react";
import { ComicButtonAsButton } from "@/components/ui/ComicButton";

const STORAGE_KEY = "skc_fan_pass_code";

interface Checkpoint {
  code: string;
  title: string;
  mission_text: string;
  xp: number;
}

interface QuestPass {
  pass_code: string;
  holder_name: string;
  xp: number;
  badge: string | null;
  completed_checkpoints?: string[];
  redeemed?: boolean;
}

function readSavedPassCode() {
  return typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
}

/** Free SKC Fan Pass + live Quest progress (PRD §5 and §6). */
export function FanPassPanel({ signedIn = false }: { signedIn?: boolean }) {
  const [pass, setPass] = useState<QuestPass | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(() => readSavedPassCode() !== null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [linkStatus, setLinkStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/quest/checkpoints")
      .then((res) => (res.ok ? res.json() : { checkpoints: [] }))
      .then((data) => setCheckpoints(data.checkpoints ?? []))
      .catch(() => setCheckpoints([]));
  }, []);

  useEffect(() => {
    const saved = readSavedPassCode();
    if (!saved) return;

    fetch(`/api/quest/pass?code=${encodeURIComponent(saved)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setPass(data))
      .catch(() => setPass(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!pass) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears stale QR immediately when the pass is reset
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(pass.pass_code, { margin: 1, width: 180 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [pass]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/quest/pass", {
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

  async function handleLinkToProfile() {
    if (!pass) return;
    setLinkStatus("saving");
    try {
      const res = await fetch("/api/quest/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passCode: pass.pass_code }),
      });
      const data = await res.json();
      setLinkStatus(res.ok ? "linked" : (data.error ?? "error"));
    } catch {
      setLinkStatus("error");
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
    const completed = new Set(pass.completed_checkpoints ?? []);
    const doneCount = checkpoints.filter((cp) => completed.has(cp.code)).length;
    return (
      <div className="comic-panel rounded-2xl bg-white p-6 sm:p-8">
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <span className="comic-panel-sm flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-hero-green text-white">
              <Sparkles size={28} />
            </span>
            <div>
              <h2 className="font-display text-3xl text-comic-black">
                {pass.holder_name}&apos;s Fan Pass
              </h2>
              <p className="font-mono text-sm tracking-widest text-comic-black/60">
                {pass.pass_code}
              </p>
            </div>
          </div>
          {qrDataUrl && (
            <div className="mt-4 flex flex-col items-center gap-1 sm:mt-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="Quest pass QR code for staff scanning"
                className="comic-panel-sm rounded-xl bg-white p-2"
                width={110}
                height={110}
              />
              <p className="text-xs text-comic-black/50">Show staff this code</p>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="comic-panel-sm rounded-xl bg-action-orange/10 p-3">
            <p className="text-xs font-bold tracking-wide text-comic-black/50 uppercase">XP</p>
            <p className="font-display text-2xl text-action-orange">{pass.xp}</p>
          </div>
          <div className="comic-panel-sm rounded-xl bg-sky-blue/10 p-3">
            <p className="text-xs font-bold tracking-wide text-comic-black/50 uppercase">
              Checkpoints
            </p>
            <p className="font-display text-2xl text-sky-blue">
              {doneCount}/{checkpoints.length || 5}
            </p>
          </div>
          <div className="comic-panel-sm rounded-xl bg-golden-orange/10 p-3">
            <p className="text-xs font-bold tracking-wide text-comic-black/50 uppercase">Badge</p>
            <p className="font-display text-2xl text-golden-orange">{pass.badge ?? "—"}</p>
          </div>
        </div>

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

        {checkpoints.length > 0 && (
          <ul className="mt-5 grid gap-2 text-left sm:grid-cols-2">
            {checkpoints.map((cp) => {
              const done = completed.has(cp.code);
              return (
                <li
                  key={cp.code}
                  className="flex items-center gap-2 rounded-xl border-2 border-comic-black/15 px-3 py-2 text-sm"
                >
                  {done ? (
                    <CheckCircle2 className="shrink-0 text-hero-green" size={18} />
                  ) : (
                    <Circle className="shrink-0 text-comic-black/30" size={18} />
                  )}
                  <span className={done ? "text-comic-black" : "text-comic-black/60"}>
                    {cp.title}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

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

        {signedIn && (
          <div className="mt-6">
            {linkStatus === "linked" ? (
              <p className="text-sm font-semibold text-hero-green">
                Linked to your SKC profile — your progress is saved.
              </p>
            ) : (
              <ComicButtonAsButton variant="outline" className="w-full" onClick={handleLinkToProfile}>
                <Link2 size={18} />
                {linkStatus === "saving" ? "Linking..." : "Save this pass to my profile"}
              </ComicButtonAsButton>
            )}
            {linkStatus && linkStatus !== "linked" && linkStatus !== "saving" && (
              <p className="mt-2 text-sm font-semibold text-comic-red">{linkStatus}</p>
            )}
          </div>
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
