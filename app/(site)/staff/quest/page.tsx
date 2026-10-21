import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StaffQuestConsole } from "@/components/site/StaffQuestConsole";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Staff — Quest Console" };

export default async function StaffQuestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = user
    ? (
        await supabase.from("admin_profiles").select("full_name, role").eq("id", user.id).maybeSingle()
      ).data
    : null;

  if (!user || !admin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
        <ShieldAlert className="mx-auto text-comic-red" size={40} />
        <h1 className="font-display mt-3 text-3xl text-comic-black">Staff access only</h1>
        <p className="mt-2 text-comic-black/70">
          Sign in to My SKC with an authorised staff account to open the Quest
          verification console.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <SectionHeading eyebrow={`Signed in as ${admin.full_name}`} title="Quest Staff Console" />
      <p className="mt-4 text-comic-black/70">
        Look up a visitor&apos;s Fan Pass code and approve the checkpoint
        they&apos;ve just completed. Each pass can only be approved once per
        checkpoint.
      </p>
      <div className="mt-8">
        <StaffQuestConsole />
      </div>
    </div>
  );
}
