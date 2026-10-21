/**
 * Hand-written types mirroring supabase/migrations/0001_init.sql.
 * Regenerate with `supabase gen types typescript` once the project is linked,
 * and keep this file in sync if you edit the schema by hand in the meantime.
 */

export type InfluencerStatus = "active" | "inactive";
export type ReferralCodeStatus = "available" | "used" | "disabled";
export type EmailStatus = "pending" | "sent" | "failed";
export type EventStatus = "upcoming" | "past";
export type AdminRole = "platform_admin" | "event_manager" | "moderator" | "quest_staff";
export type MemberRole =
  | "fan"
  | "parent_guardian"
  | "creator"
  | "competitor"
  | "vendor"
  | "instructor"
  | "influencer";

export interface Database {
  public: {
    Tables: {
      influencers: {
        Row: {
          id: string;
          display_name: string;
          contact: string | null;
          status: InfluencerStatus;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          display_name: string;
          contact?: string | null;
          status?: InfluencerStatus;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["influencers"]["Insert"]>;
        Relationships: [];
      };
      referral_codes: {
        Row: {
          id: string;
          code: string;
          influencer_id: string;
          status: ReferralCodeStatus;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          influencer_id: string;
          status?: ReferralCodeStatus;
          created_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["referral_codes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "referral_codes_influencer_id_fkey";
            columns: ["influencer_id"];
            isOneToOne: false;
            referencedRelation: "influencers";
            referencedColumns: ["id"];
          },
        ];
      };
      redemptions: {
        Row: {
          id: string;
          referral_code_id: string;
          visitor_name: string;
          visitor_email: string;
          confirmation_ref: string;
          email_status: EmailStatus;
          redeemed_at: string;
        };
        Insert: {
          id?: string;
          referral_code_id: string;
          visitor_name: string;
          visitor_email: string;
          confirmation_ref?: string;
          email_status?: EmailStatus;
          redeemed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["redemptions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "redemptions_referral_code_id_fkey";
            columns: ["referral_code_id"];
            isOneToOne: true;
            referencedRelation: "referral_codes";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string;
          event_date: string;
          venue: string;
          schedule: unknown;
          ticket_url: string | null;
          status: EventStatus;
          is_published: boolean;
          cover_image: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description: string;
          event_date: string;
          venue: string;
          schedule?: unknown;
          ticket_url?: string | null;
          status?: EventStatus;
          is_published?: boolean;
          cover_image?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      fan_passes: {
        Row: {
          id: string;
          pass_code: string;
          holder_name: string;
          holder_email: string | null;
          xp: number;
          badge: string | null;
          profile_id: string | null;
          linked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pass_code?: string;
          holder_name: string;
          holder_email?: string | null;
          xp?: number;
          badge?: string | null;
          profile_id?: string | null;
          linked_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["fan_passes"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          role: MemberRole;
          bio: string | null;
          interests: string[];
          details: Record<string, unknown>;
          marketing_opt_in: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          role?: MemberRole;
          bio?: string | null;
          interests?: string[];
          details?: Record<string, unknown>;
          marketing_opt_in?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      quest_checkpoints: {
        Row: {
          id: string;
          code: string;
          title: string;
          mission_text: string;
          xp: number;
          sort_order: number;
          is_active: boolean;
          opens_at: string | null;
          closes_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          title: string;
          mission_text: string;
          xp?: number;
          sort_order?: number;
          is_active?: boolean;
          opens_at?: string | null;
          closes_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quest_checkpoints"]["Insert"]>;
        Relationships: [];
      };
      staff_checkpoint_assignments: {
        Row: {
          admin_profile_id: string;
          checkpoint_id: string;
          created_at: string;
        };
        Insert: {
          admin_profile_id: string;
          checkpoint_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff_checkpoint_assignments"]["Insert"]>;
        Relationships: [];
      };
      quest_completions: {
        Row: {
          id: string;
          fan_pass_id: string;
          checkpoint_id: string;
          approved_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          fan_pass_id: string;
          checkpoint_id: string;
          approved_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quest_completions"]["Insert"]>;
        Relationships: [];
      };
      quest_redemptions: {
        Row: {
          id: string;
          fan_pass_id: string;
          redeemed_by: string;
          redeemed_at: string;
        };
        Insert: {
          id?: string;
          fan_pass_id: string;
          redeemed_by: string;
          redeemed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quest_redemptions"]["Insert"]>;
        Relationships: [];
      };
      admin_profiles: {
        Row: {
          id: string;
          full_name: string;
          role: AdminRole;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: AdminRole;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_profiles"]["Insert"]>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          details: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          details?: unknown;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      redeem_referral_code: {
        Args: { p_code: string; p_visitor_name: string; p_visitor_email: string };
        Returns: {
          redemption_id: string;
          confirmation_ref: string;
          influencer_name: string;
        }[];
      };
      mark_redemption_email_status: {
        Args: { p_redemption_id: string; p_status: EmailStatus };
        Returns: void;
      };
      get_fan_pass: {
        Args: { p_pass_code: string };
        Returns: {
          pass_code: string;
          holder_name: string;
          xp: number;
          badge: string | null;
          created_at: string;
        }[];
      };
      get_quest_status: {
        Args: { p_pass_code: string };
        Returns: {
          pass_code: string;
          holder_name: string;
          xp: number;
          badge: string | null;
          completed_checkpoints: string[];
          redeemed: boolean;
        }[];
      };
      approve_quest_checkpoint: {
        Args: { p_pass_code: string; p_checkpoint_code: string };
        Returns: { status: string; xp: number; badge: string | null }[];
      };
      redeem_quest_reward: {
        Args: { p_pass_code: string };
        Returns: { status: string }[];
      };
      link_fan_pass_to_profile: {
        Args: { p_pass_code: string };
        Returns: { status: string }[];
      };
      quest_staff_summary: {
        Args: Record<string, never>;
        Returns: {
          passes_issued: number;
          completions_total: number;
          finishers: number;
          badges_awarded: number;
          redemptions: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
