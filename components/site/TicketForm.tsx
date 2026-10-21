"use client";

import { useState, type FormEvent } from "react";
import { PartyPopper, AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import { ComicButton, ComicButtonAsButton } from "@/components/ui/ComicButton";
import { MobileMoneyPayment } from "@/components/site/MobileMoneyPayment";

interface OrderResult {
  confirmationRef: string;
  influencerName: string | null;
  eventTitle: string;
  eventDate: string;
  venue: string;
  unitPrice: string;
  discount: string | null;
  total: string;
  paymentUrl: string | null;
  alreadyPaid: boolean;
  mobileMoneyAvailable: boolean;
}

export function TicketForm() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrderResult | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/tickets/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code || undefined, name, email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setResult(data as OrderResult);
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
        <h2 className="font-display text-4xl">Order started!</h2>
        <p className="mt-2 text-white/90">
          {result.influencerName
            ? `10% off applied — thanks to ${result.influencerName}. `
            : ""}
          See you at {result.eventTitle}.
        </p>

        <div className="comic-panel-sm mx-auto mt-6 max-w-xs rounded-xl bg-white p-4 text-comic-black">
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="opacity-60">Ticket price</dt>
              <dd className="font-semibold">{result.unitPrice}</dd>
            </div>
            {result.discount && (
              <div className="flex justify-between text-hero-green">
                <dt>Discount</dt>
                <dd className="font-semibold">-{result.discount}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-comic-black/15 pt-1">
              <dt className="font-bold">{result.alreadyPaid ? "Total" : "Total due"}</dt>
              <dd className="font-display text-lg text-comic-red">{result.total}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs font-bold tracking-wide text-comic-black/50 uppercase">
            Confirmation reference
          </p>
          <p className="font-display text-2xl tracking-wider text-comic-red">
            {result.confirmationRef}
          </p>
        </div>

        <div className="mx-auto mt-6 max-w-xs">
          {result.alreadyPaid ? (
            <p className="text-sm text-white/85">No payment needed — you&apos;re all set.</p>
          ) : (
            <>
              {result.mobileMoneyAvailable && (
                <MobileMoneyPayment confirmationRef={result.confirmationRef} />
              )}
              {result.paymentUrl && (
                <ComicButton
                  href={result.paymentUrl}
                  variant="black"
                  className={result.mobileMoneyAvailable ? "mt-4 w-full" : "w-full"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {result.mobileMoneyAvailable ? "Pay by card instead" : "Complete payment"}{" "}
                  <ExternalLink size={16} />
                </ComicButton>
              )}
              {!result.mobileMoneyAvailable && !result.paymentUrl && (
                <p className="text-sm text-white/85">
                  We&apos;ll email you the payment link as soon as it&apos;s ready.
                </p>
              )}
            </>
          )}
        </div>

        <p className="mt-6 text-xs text-white/75">
          A copy of this order is on its way to your inbox.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="comic-panel rounded-2xl bg-white p-6 sm:p-8">
      <div className="space-y-5">
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
            Used to send your order confirmation and payment link.
          </p>
        </div>
        <div>
          <label htmlFor="code" className="mb-1 block text-sm font-bold text-comic-black">
            Referral code <span className="font-normal text-comic-black/50">(optional)</span>
          </label>
          <input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. SKC-AMARA7"
            className="w-full rounded-xl border-2 border-comic-black px-4 py-3 font-mono text-lg tracking-widest uppercase focus:ring-4 focus:ring-golden-orange/40 focus:outline-none"
            autoComplete="off"
          />
          <p className="mt-1 text-xs text-comic-black/60">
            Got a code from an SKC influencer? Add it for 10% off your ticket.
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
              <Loader2 className="animate-spin" size={20} /> Starting order...
            </>
          ) : (
            "Get Ticket"
          )}
        </ComicButtonAsButton>
      </div>
    </form>
  );
}
