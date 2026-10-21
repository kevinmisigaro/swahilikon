import type { MemberRole } from "@/types/database";

export interface RoleConfig {
  value: MemberRole;
  label: string;
  description: string;
  restriction: string;
  detailLabel: string;
  detailPlaceholder: string;
}

/** Mirrors PRD §4 "Users, roles and permissions" — capability + restriction copy shown during signup. */
export const MEMBER_ROLES: RoleConfig[] = [
  {
    value: "fan",
    label: "Fan member",
    description: "Manage your profile, interests, achievements and eligible applications.",
    restriction: "No access to other members' records.",
    detailLabel: "Favourite fandoms (optional)",
    detailPlaceholder: "e.g. Manga, cosplay, retro gaming",
  },
  {
    value: "parent_guardian",
    label: "Parent / Guardian",
    description: "Submit approved participation on behalf of your child.",
    restriction: "No self-registered child forum account.",
    detailLabel: "Child's first name / age group (optional)",
    detailPlaceholder: "e.g. Amani, age 9",
  },
  {
    value: "creator",
    label: "Creator",
    description: "Propose and update your own moderated portfolio.",
    restriction: "Cannot self-approve or edit other creators' pages.",
    detailLabel: "Portfolio link (optional)",
    detailPlaceholder: "https://...",
  },
  {
    value: "competitor",
    label: "Competitor",
    description: "Create and review your own competition applications.",
    restriction: "Submissions stay private until explicitly published.",
    detailLabel: "Competition category (optional)",
    detailPlaceholder: "e.g. Cosplay, fan art",
  },
  {
    value: "vendor",
    label: "Vendor",
    description: "Maintain your authorised catalogue and requests.",
    restriction: "Cannot access other vendors' customers.",
    detailLabel: "Business / stall name (optional)",
    detailPlaceholder: "e.g. Zanzibar Comics Co.",
  },
  {
    value: "instructor",
    label: "Instructor",
    description: "Manage assigned class attendance within your approved scope.",
    restriction: "No unrestricted participant export.",
    detailLabel: "Subject taught (optional)",
    detailPlaceholder: "e.g. Comic illustration",
  },
  {
    value: "influencer",
    label: "Influencer",
    description: "View your own codes, verified sales and earnings.",
    restriction: "No access to another promoter's financial data.",
    detailLabel: "Social handle (optional)",
    detailPlaceholder: "@yourhandle",
  },
];

export function getRoleConfig(role: MemberRole) {
  return MEMBER_ROLES.find((r) => r.value === role) ?? MEMBER_ROLES[0];
}
