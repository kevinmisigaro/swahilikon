"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { ComicButtonAsButton } from "@/components/ui/ComicButton";
import { MEMBER_ROLES, getRoleConfig } from "@/lib/data/roles";
import type { MemberRole } from "@/types/database";
import { cn } from "@/lib/utils";

// Must match the bio limit enforced by /api/profile.
const BIO_MAX_LENGTH = 500;

interface ProfileData {
  display_name: string;
  role: MemberRole;
  bio: string | null;
  interests: string[];
  details: Record<string, unknown>;
  marketing_opt_in: boolean;
}

export function ProfileSetupForm({
  initial,
  onSaved,
}: {
  initial?: ProfileData | null;
  onSaved: (profile: ProfileData) => void;
}) {
  const [role, setRole] = useState<MemberRole>(initial?.role ?? "fan");
  const [displayName, setDisplayName] = useState(initial?.display_name ?? "");
  const [detail, setDetail] = useState(
    typeof initial?.details?.note === "string" ? (initial.details.note as string) : "",
  );
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [marketingOptIn, setMarketingOptIn] = useState(initial?.marketing_opt_in ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = getRoleConfig(role);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          role,
          bio: bio.trim(),
          // The form has no interests editor yet; keep whatever is saved so
          // editing the profile doesn't wipe them.
          interests: initial?.interests ?? [],
          details: detail ? { note: detail } : {},
          marketingOptIn,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't save your profile.");
        return;
      }
      onSaved(data.profile);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="comic-panel rounded-2xl bg-white p-8">
      <h2 className="font-display text-center text-3xl text-comic-black">
        {initial ? "Update your SKC profile" : "Set up your free SKC profile"}
      </h2>
      <p className="mt-2 text-center text-sm text-comic-black/60">
        Always free. Pick the role that best describes you — you can change it later.
      </p>

      <div className="mt-6">
        <label htmlFor="display-name" className="mb-1 block text-sm font-bold text-comic-black">
          Display name
        </label>
        <input
          id="display-name"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-xl border-2 border-comic-black px-4 py-3 focus:ring-4 focus:ring-golden-orange/40 focus:outline-none"
        />
      </div>

      <fieldset className="mt-6">
        <legend className="mb-2 block text-sm font-bold text-comic-black">I am a...</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MEMBER_ROLES.map((r) => (
            <button
              type="button"
              key={r.value}
              onClick={() => setRole(r.value)}
              className={cn(
                "comic-panel-sm rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors",
                role === r.value ? "bg-action-orange text-white" : "bg-white text-comic-black",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-comic-black/60">
          {config.description} <span className="italic">{config.restriction}</span>
        </p>
      </fieldset>

      <div className="mt-6">
        <label htmlFor="role-detail" className="mb-1 block text-sm font-bold text-comic-black">
          {config.detailLabel}
        </label>
        <input
          id="role-detail"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder={config.detailPlaceholder}
          className="w-full rounded-xl border-2 border-comic-black px-4 py-3 focus:ring-4 focus:ring-golden-orange/40 focus:outline-none"
        />
      </div>

      <div className="mt-6">
        <div className="mb-1 flex items-baseline justify-between">
          <label htmlFor="bio" className="block text-sm font-bold text-comic-black">
            About you (optional)
          </label>
          <span className="text-xs text-comic-black/50">
            {bio.length}/{BIO_MAX_LENGTH}
          </span>
        </div>
        <textarea
          id="bio"
          rows={4}
          maxLength={BIO_MAX_LENGTH}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Favourite comics, anime, characters you cosplay — tell the SKC community about yourself."
          className="w-full resize-y rounded-xl border-2 border-comic-black px-4 py-3 focus:ring-4 focus:ring-golden-orange/40 focus:outline-none"
        />
      </div>

      <label className="mt-6 flex items-start gap-2 text-sm text-comic-black/80">
        <input
          type="checkbox"
          checked={marketingOptIn}
          onChange={(e) => setMarketingOptIn(e.target.checked)}
          className="mt-1 h-4 w-4"
        />
        Send me occasional SKC news and event updates (optional, off by default).
      </label>

      {error && <p className="mt-4 text-sm font-semibold text-comic-red">{error}</p>}

      <ComicButtonAsButton type="submit" variant="green" className="mt-6 w-full" disabled={saving}>
        {saving ? <Loader2 className="animate-spin" size={20} /> : "Save my profile"}
      </ComicButtonAsButton>
    </form>
  );
}
