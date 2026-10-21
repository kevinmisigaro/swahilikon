"use client";

import { useState } from "react";
import { LogOut, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { Badge } from "@/components/ui/Badge";
import { ComicButtonAsButton } from "@/components/ui/ComicButton";
import { ProfileSetupForm } from "@/components/site/ProfileSetupForm";
import { getRoleConfig } from "@/lib/data/roles";
import type { MemberRole } from "@/types/database";

interface ProfileData {
  display_name: string;
  role: MemberRole;
  bio: string | null;
  interests: string[];
  details: Record<string, unknown>;
  marketing_opt_in: boolean;
}

export function ProfileDashboard({
  email,
  profile,
  onSignedOut,
  onProfileUpdated,
}: {
  email: string | null;
  profile: ProfileData;
  onSignedOut: () => void;
  onProfileUpdated: (profile: ProfileData) => void;
}) {
  const [editing, setEditing] = useState(false);
  const config = getRoleConfig(profile.role);
  const note = typeof profile.details?.note === "string" ? profile.details.note : null;
  const initials = profile.display_name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    onSignedOut();
  }

  if (editing) {
    return (
      <ProfileSetupForm
        initial={profile}
        onSaved={(p) => {
          onProfileUpdated(p);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <div className="comic-panel halftone rounded-2xl bg-white p-6 text-center">
      <span className="comic-panel-sm mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sky-blue font-display text-2xl text-white">
        {initials || "SKC"}
      </span>
      <h2 className="font-display mt-3 text-2xl text-comic-black">{profile.display_name}</h2>
      {email && <p className="text-xs text-comic-black/50">{email}</p>}
      <div className="mt-3 flex justify-center">
        <RoleBadge role={profile.role} />
      </div>

      <div className="mt-5 rounded-xl border-2 border-comic-black/15 bg-warm-white p-4 text-left text-sm text-comic-black/80">
        <p>{config.description}</p>
        {note && (
          <p className="mt-2">
            <span className="font-bold">{config.detailLabel.replace(" (optional)", "")}:</span>{" "}
            {note}
          </p>
        )}
      </div>

      {profile.interests.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {profile.interests.map((interest) => (
            <Badge key={interest} tone="neutral">
              {interest}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <ComicButtonAsButton variant="outline" className="w-full" onClick={() => setEditing(true)}>
          <Pencil size={18} /> Edit profile
        </ComicButtonAsButton>
        <ComicButtonAsButton variant="black" className="w-full" onClick={handleSignOut}>
          <LogOut size={18} /> Sign out
        </ComicButtonAsButton>
      </div>
    </div>
  );
}
