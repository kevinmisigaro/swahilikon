"use client";

import { useState, type FormEvent } from "react";
import { PartyPopper, AlertTriangle, Loader2 } from "lucide-react";
import { ComicButtonAsButton } from "@/components/ui/ComicButton";

interface SuccessResult {
  confirmationRef: string;
  influencerName: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
}

export function ReferralForm() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SuccessResult | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/referral/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setResult(data as SuccessResult);
      setStatus("idle");
    } catch {
      setStatus("error");
      setError("Network error — please check your connection and try again.");
    }
  }

  if (result) {
    return (
      <div className="comic-panel relative overflow-hidden rounded-2xl bg-hero-green p-8 text-center text-white sm:p-10">
        <div className="halftone pointer-events-none absolute inset-0 opacity-10" />
        <PartyPopper className="mx-auto mb-3" size={44} />
        <h2 className="font-display text-4xl">You&apos;re confirmed!</h2>
        <p className="mt-2 text-white/90">
          Welcome, {result.influencerName ? `friend of ${result.influencerName} — ` : ""}
          see you at {result.eventTitle}.
        </p>
        <div className="comic-panel-sm mx-auto mt-6 max-w-xs rounded-xl bg-white p-4 text-comic-black">
          <p className="text-xs font-bold tracking-wide text-comic-black/50 uppercase">
            Confirmation reference
          </p>
          <p className="font-display text-3xl tracking-wider text-comic-red">
            {result.confirmationRef}
          </p>
        </div>
        <dl className="mx-auto mt-6 max-w-xs space-y-1 text-left text-sm text-white/90">
          <div className="flex justify-between">
            <dt className="opacity-75">Date</dt>
            <dd className="font-semibold">{result.eventDate}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="opacity-75">Venue</dt>
            <dd className="font-semibold">{result.venue}</dd>
          </div>
        </dl>
        <p className="mt-6 text-xs text-white/75">
          A confirmation email is on its way to your inbox.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="comic-panel rounded-2xl bg-white p-6 sm:p-8">
      <div className="space-y-5">
        <div>
          <label htmlFor="code" className="mb-1 block text-sm font-bold text-comic-black">
            Referral code
          </label>
          <input
            id="code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. SKC-AMARA7"
            className="w-full rounded-xl border-2 border-comic-black px-4 py-3 font-mono text-lg tracking-widest uppercase focus:ring-4 focus:ring-golden-orange/40 focus:outline-none"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-bold text-comic-black">
            Your name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full rounded-xl border-2 border-comic-black px-4 py-3 focus:ring-4 focus:ring-golden-orange/40 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-bold text-comic-black">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border-2 border-comic-black px-4 py-3 focus:ring-4 focus:ring-golden-orange/40 focus:outline-none"
          />
          <p className="mt-1 text-xs text-comic-black/60">
            Used only to send your confirmation. No payment or ticket purchase is required.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border-2 border-comic-red bg-comic-red/10 p-3 text-sm text-comic-red">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <ComicButtonAsButton
          type="submit"
          variant="red"
          className="w-full"
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="animate-spin" size={20} /> Checking code...
            </>
          ) : (
            "Redeem code"
          )}
        </ComicButtonAsButton>
      </div>
    </form>
  );
}
