"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, AlertTriangle, Loader2, Gift, BarChart3 } from "lucide-react";
import { ComicButtonAsButton } from "@/components/ui/ComicButton";
import { cn } from "@/lib/utils";

interface Checkpoint {
  code: string;
  title: string;
  xp: number;
  is_active: boolean;
}

interface Summary {
  passes_issued: number;
  completions_total: number;
  finishers: number;
  badges_awarded: number;
  redemptions: number;
}

export function StaffQuestConsole() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [passCode, setPassCode] = useState("");
  const [checkpointCode, setCheckpointCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function loadSummary() {
    fetch("/api/staff/quest/summary")
      .then((res) => (res.ok ? res.json() : null))
      .then(setSummary)
      .catch(() => setSummary(null));
  }

  useEffect(() => {
    fetch("/api/staff/quest/checkpoints")
      .then((res) => (res.ok ? res.json() : { checkpoints: [] }))
      .then((data) => {
        setCheckpoints(data.checkpoints ?? []);
        setCheckpointCode(data.checkpoints?.[0]?.code ?? "");
      })
      .catch(() => setCheckpoints([]));
    loadSummary();
  }, []);

  async function handleApprove(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/staff/quest/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passCode, checkpointCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data.error ?? "Approval failed." });
        return;
      }
      if (data.status === "ALREADY_COMPLETED") {
        setResult({ ok: false, message: `Already completed. XP: ${data.xp}` });
      } else {
        setResult({
          ok: true,
          message: `Approved! XP now ${data.xp}${data.badge ? ` — ${data.badge} badge earned!` : ""}`,
        });
      }
      loadSummary();
    } catch {
      setResult({ ok: false, message: "Network error — please try again." });
    } finally {
      setBusy(false);
    }
  }

  async function handleRedeem() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/staff/quest/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data.error ?? "Redemption failed." });
        return;
      }
      setResult({
        ok: data.status === "REDEEMED",
        message: data.status === "REDEEMED" ? "Reward redeemed!" : "This reward was already redeemed.",
      });
      loadSummary();
    } catch {
      setResult({ ok: false, message: "Network error — please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleApprove} className="comic-panel rounded-2xl bg-white p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="pass-code" className="mb-1 block text-sm font-bold text-comic-black">
              Fan Pass code
            </label>
            <input
              id="pass-code"
              required
              value={passCode}
              onChange={(e) => setPassCode(e.target.value.toUpperCase())}
              placeholder="e.g. 7F3C9A2B"
              className="w-full rounded-xl border-2 border-comic-black px-4 py-3 font-mono text-lg tracking-widest uppercase focus:ring-4 focus:ring-golden-orange/40 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="checkpoint" className="mb-1 block text-sm font-bold text-comic-black">
              Checkpoint
            </label>
            <select
              id="checkpoint"
              value={checkpointCode}
              onChange={(e) => setCheckpointCode(e.target.value)}
              className="w-full rounded-xl border-2 border-comic-black px-4 py-3 focus:ring-4 focus:ring-golden-orange/40 focus:outline-none"
            >
              {checkpoints.map((cp) => (
                <option key={cp.code} value={cp.code}>
                  {cp.title} (+{cp.xp} XP)
                </option>
              ))}
            </select>
            {checkpoints.length === 0 && (
              <p className="mt-1 text-xs text-comic-black/50">
                No checkpoints are assigned to your staff account yet.
              </p>
            )}
          </div>

          {result && (
            <div
              className={cn(
                "flex items-start gap-2 rounded-xl border-2 p-3 text-sm",
                result.ok
                  ? "border-hero-green bg-hero-green/10 text-hero-green"
                  : "border-comic-red bg-comic-red/10 text-comic-red",
              )}
            >
              {result.ok ? (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              )}
              <span>{result.message}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <ComicButtonAsButton type="submit" variant="green" disabled={busy || !checkpointCode}>
              {busy ? <Loader2 className="animate-spin" size={20} /> : "Approve checkpoint"}
            </ComicButtonAsButton>
            <ComicButtonAsButton
              type="button"
              variant="orange"
              disabled={busy || !passCode}
              onClick={handleRedeem}
            >
              <Gift size={18} /> Redeem reward
            </ComicButtonAsButton>
          </div>
        </div>
      </form>

      {summary && (
        <div className="comic-panel rounded-2xl bg-white p-6">
          <div className="mb-3 flex items-center gap-2 font-display text-xl text-comic-black">
            <BarChart3 size={22} /> Live operations summary
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <SummaryStat label="Passes issued" value={summary.passes_issued} />
            <SummaryStat label="Completions" value={summary.completions_total} />
            <SummaryStat label="Finishers" value={summary.finishers} />
            <SummaryStat label="Badges awarded" value={summary.badges_awarded} />
            <SummaryStat label="Redemptions" value={summary.redemptions} />
          </dl>
        </div>
      )}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs font-bold tracking-wide text-comic-black/50 uppercase">{label}</dt>
      <dd className="font-display text-2xl text-comic-black">{value}</dd>
    </div>
  );
}
