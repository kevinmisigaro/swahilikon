export interface Comic {
  slug: string;
  title: string;
  subtitle?: string;
  creator: string;
  partners?: string[];
  language: string;
  description: string;
  /** Shown before reading when the story covers difficult themes. */
  contentNote?: string;
  /** Intrinsic size of every page image, used for layout without shift. */
  pageWidth: number;
  pageHeight: number;
  pages: string[];
  /** True for a member-uploaded comic, as opposed to an official SKC one. */
  isCommunitySubmission?: boolean;
}
