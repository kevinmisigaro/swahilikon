"use client";

import { useEffect, useRef, useState } from "react";
import { PartyPopper, Loader2, AlertTriangle } from "lucide-react";
import { ComicButton } from "@/components/ui/ComicButton";

interface StatusResult {
  confirmationRef: string;
  status: "pending" | "paid" | "failed" | "cancelled";
  eventTitle: string | null;
  eventDate: string | null;
  venue: string | null;
  total: string;
}

const POLL_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 3000;

export function TicketConfirmStatus({ confirmationRef }: { confirmationRef: string }) {
  const [result, setResult] = useState<StatusResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const attempts = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/payments/dpo/verify?ref=${encodeURIComponent(confirmationRef)}`);
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setError(data.error ?? "We couldn't check your order.");
          return;
        }

        setResult(data as StatusResult);
        attempts.current += 1;

        if (data.status === "pending" && attempts.current < POLL_ATTEMPTS) {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch {
        if (!cancelled) setError("Network error — please refresh this page.");
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [confirmationRef]);

  if (error) {
    return (
      <div className="comic-panel rounded-2xl bg-white p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 text-comic-red" size={40} />
        <p className="text-comic-black/80">{error}</p>
      </div>
    );
  }

  if (!result || result.status === "pending") {
    return (
      <div className="comic-panel rounded-2xl bg-white p-8 text-center">
        <Loader2 className="mx-auto mb-3 animate-spin text-comic-red" size={40} />
        <h2 className="font-display text-2xl text-comic-black">Confirming your payment...</h2>
        <p className="mt-2 text-sm text-comic-black/70">
          This can take a moment. We&apos;ll email you a confirmation either way — feel free
          to leave this page.
        </p>
      </div>
    );
  }

  if (result.status === "paid") {
    return (
      <div className="comic-panel relative overflow-hidden rounded-2xl bg-hero-green p-8 text-center text-white">
        <div className="halftone pointer-events-none absolute inset-0 opacity-10" />
        <PartyPopper className="mx-auto mb-3" size={44} />
        <h2 className="font-display text-4xl">Payment confirmed!</h2>
        <p className="mt-2 text-white/90">
          See you at {result.eventTitle} — {result.eventDate}, {result.venue}.
        </p>
        <div className="comic-panel-sm mx-auto mt-6 max-w-xs rounded-xl bg-white p-4 text-comic-black">
          <p className="text-xs font-bold tracking-wide text-comic-black/50 uppercase">
            Confirmation reference
          </p>
          <p className="font-display text-2xl tracking-wider text-comic-red">
            {result.confirmationRef}
          </p>
          <p className="mt-2 text-sm text-comic-black/70">Paid {result.total}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="comic-panel rounded-2xl bg-white p-8 text-center">
      <AlertTriangle className="mx-auto mb-3 text-comic-red" size={40} />
      <h2 className="font-display text-2xl text-comic-black">
        {result.status === "cancelled" ? "Payment cancelled" : "Payment didn't go through"}
      </h2>
      <p className="mt-2 text-comic-black/70">
        Your order {result.confirmationRef} wasn&apos;t charged. You can try again below.
      </p>
      <ComicButton href="/tickets" variant="red" className="mt-6">
        Try again
      </ComicButton>
    </div>
  );
}
