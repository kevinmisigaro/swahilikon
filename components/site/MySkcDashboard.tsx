"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthPanel } from "@/components/site/AuthPanel";
import { ProfileSetupForm } from "@/components/site/ProfileSetupForm";
import { ProfileDashboard } from "@/components/site/ProfileDashboard";
import { FanPassPanel } from "@/components/site/FanPassPanel";
import type { MemberRole } from "@/types/database";

interface ProfileData {
  display_name: string;
  role: MemberRole;
  bio: string | null;
  interests: string[];
  details: Record<string, unknown>;
  marketing_opt_in: boolean;
}

type AuthState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; email: string | null; profile: ProfileData | null };

export function MySkcDashboard() {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setState({ status: "signed-out" });
      return;
    }

    const res = await fetch("/api/profile");
    const data = res.ok ? await res.json() : { email: user.email, profile: null };
    setState({ status: "signed-in", email: data.email ?? user.email ?? null, profile: data.profile });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial auth/profile load on mount
    refresh();
  }, [refresh]);

  if (state.status === "loading") {
    return (
      <div className="comic-panel mx-auto flex max-w-md justify-center rounded-2xl bg-white p-8 text-comic-black/50">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (state.status === "signed-out") {
    return (
      <div className="mx-auto max-w-md space-y-8">
        <AuthPanel onSignedIn={refresh} />
        <div>
          <p className="mb-3 text-center text-sm font-bold text-comic-black/50 uppercase tracking-wide">
            Or just start Quest as a guest
          </p>
          <FanPassPanel />
        </div>
      </div>
    );
  }

  if (!state.profile) {
    return (
      <div className="mx-auto max-w-xl">
        <ProfileSetupForm onSaved={() => refresh()} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:items-start lg:gap-8">
      <ProfileDashboard
        email={state.email}
        profile={state.profile}
        onSignedOut={refresh}
        onProfileUpdated={() => refresh()}
      />
      <FanPassPanel signedIn />
    </div>
  );
}
