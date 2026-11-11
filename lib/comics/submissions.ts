import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Comic } from "@/lib/comics/types";
import { COMIC_SUBMISSIONS_BUCKET, comicPagePath } from "@/lib/comics/storage";

type SubmissionRow = Database["public"]["Tables"]["comic_submissions"]["Row"];

// Pages are signed fresh on every request (this app opts out of static
// caching for anything live — see next.config.ts), so an hour-long signed
// URL never has to survive past the request that generated it.
const SIGNED_URL_TTL_SECONDS = 60 * 60;

async function signPages(
  supabase: SupabaseClient<Database>,
  ownerId: string | null,
  submissionId: string,
  pageCount: number,
): Promise<string[] | null> {
  const paths = Array.from({ length: pageCount }, (_, i) =>
    comicPagePath(ownerId, submissionId, i + 1),
  );
  const { data, error } = await supabase.storage
    .from(COMIC_SUBMISSIONS_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  if (error || !data || data.some((entry) => !entry.signedUrl)) return null;
  return data.map((entry) => entry.signedUrl as string);
}

function toComic(row: SubmissionRow, pages: string[]): Comic {
  return {
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    creator: row.creator,
    partners: row.partners.length > 0 ? row.partners : undefined,
    language: row.language,
    description: row.description,
    contentNote: row.content_note ?? undefined,
    pageWidth: row.page_width,
    pageHeight: row.page_height,
    pages,
    isCommunitySubmission: !row.is_official,
  };
}

/**
 * Every approved comic for the public /comics listing — the SKC team's own
 * official comics first (oldest first, matching how they were originally
 * curated), then approved member uploads newest first.
 */
export async function getPublishedComics(supabase: SupabaseClient<Database>): Promise<Comic[]> {
  const { data, error } = await supabase.from("comic_submissions").select("*").eq("status", "approved");

  if (error || !data) return [];

  const official = data.filter((row) => row.is_official);
  const community = data
    .filter((row) => !row.is_official)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const comics = await Promise.all(
    [...official, ...community].map(async (row) => {
      const pages = await signPages(supabase, row.owner_id, row.id, row.page_count);
      return pages ? toComic(row, pages) : null;
    }),
  );

  return comics.filter((comic): comic is Comic => comic !== null);
}

/** A single approved comic, for /comics/[slug]. */
export async function getPublishedComicBySlug(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<Comic | null> {
  const { data: row, error } = await supabase
    .from("comic_submissions")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();

  if (error || !row) return null;

  const pages = await signPages(supabase, row.owner_id, row.id, row.page_count);
  return pages ? toComic(row, pages) : null;
}
