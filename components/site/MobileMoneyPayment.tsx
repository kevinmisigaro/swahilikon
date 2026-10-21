"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, Smartphone } from "lucide-react";
import { ComicButtonAsButton } from "@/components/ui/ComicButton";

const NETWORKS = [
  { id: "mpesa", label: "M-Pesa" },
  { id: "airtel_money", label: "Airtel Money" },
  { id: "halopesa", label: "HaloPesa" },
  { id: "mixx_by_yas", label: "Mixx by Yas" },
] as const;

type NetworkId = (typeof NETWORKS)[number]["id"];

export function MobileMoneyPayment({ confirmationRef }: { confirmationRef: string }) {
  const router = useRouter();
  const [network, setNetwork] = useState<NetworkId>("mpesa");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/payments/dpo/charge-mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationRef, network, phoneNumber }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? "We couldn't start that payment. Please try again.");
        return;
      }

      router.push(`/tickets/confirm?ref=${encodeURIComponent(confirmationRef)}`);
    } catch {
      setStatus("error");
      setError("Network error — please check your connection and try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="comic-panel-sm mt-4 rounded-xl bg-white p-4 text-left text-comic-black"
    >
      <p className="mb-3 flex items-center gap-2 text-sm font-bold">
        <Smartphone size={16} /> Pay with mobile money
      </p>
      <div className="space-y-3">
        <select
          value={network}
          onChange={(e) => setNetwork(e.target.value as NetworkId)}
          className="w-full rounded-lg border-2 border-comic-black px-3 py-2 text-sm focus:ring-4 focus:ring-golden-orange/40 focus:outline-none"
        >
          {NETWORKS.map((n) => (
            <option key={n.id} value={n.id}>
              {n.label}
            </option>
          ))}
        </select>
        <input
          type="tel"
          required
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="e.g. 0712 345 678"
          className="w-full rounded-lg border-2 border-comic-black px-3 py-2 text-sm focus:ring-4 focus:ring-golden-orange/40 focus:outline-none"
        />

        {error && (
          <div className="flex items-start gap-2 rounded-lg border-2 border-comic-red bg-comic-red/10 p-2 text-xs text-comic-red">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <ComicButtonAsButton
          type="submit"
          variant="green"
          className="w-full text-sm"
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="animate-spin" size={16} /> Sending prompt...
            </>
          ) : (
            "Send payment request"
          )}
        </ComicButtonAsButton>
        <p className="text-xs text-comic-black/60">
          You&apos;ll get a prompt on your phone to enter your PIN and approve the payment.
        </p>
      </div>
    </form>
  );
}
