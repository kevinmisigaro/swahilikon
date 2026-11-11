// Shared by the browser upload flow, the API routes and the server-side
// signed-URL lookup, so the storage path convention only lives in one place.
// Objects live at `{owner_id}/{submission_id}/page-001.jpg` — RLS policies
// (0006_comic_submissions.sql) key off exactly this shape via
// storage.foldername(name).

export const COMIC_SUBMISSIONS_BUCKET = "comic-submissions";
// Must match the `page_count` check constraint in 0006_comic_submissions.sql.
export const MAX_COMIC_PAGES = 80;
// The first path segment for an official SKC-team comic (one with no
// member owner_id) — see 0006_comic_submissions.sql.
export const OFFICIAL_COMIC_OWNER_SLUG = "official";

export function comicPageFilename(pageNumber: number) {
  return `page-${String(pageNumber).padStart(3, "0")}.jpg`;
}

export function comicSubmissionFolder(ownerId: string | null, submissionId: string) {
  return `${ownerId ?? OFFICIAL_COMIC_OWNER_SLUG}/${submissionId}`;
}

export function comicPagePath(ownerId: string | null, submissionId: string, pageNumber: number) {
  return `${comicSubmissionFolder(ownerId, submissionId)}/${comicPageFilename(pageNumber)}`;
}
