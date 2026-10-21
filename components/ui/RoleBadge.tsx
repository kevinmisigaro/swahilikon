import type { MemberRole } from "@/types/database";
import { getRoleConfig } from "@/lib/data/roles";

export function RoleBadge({ role }: { role: MemberRole }) {
  return (
    <span className="comic-panel-sm inline-flex items-center rounded-full bg-sky-blue px-4 py-1 font-display text-sm tracking-wide text-white">
      {getRoleConfig(role).label}
    </span>
  );
}
