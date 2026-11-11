#!/usr/bin/env node
// One-off data migration: uploads the SKC team's existing comics (currently
// static JPEGs under public/comics/<slug>/) into the `comic-submissions`
// Storage bucket, and records each as an "official" (is_official = true,
// status = 'approved', no owner_id) row in `comic_submissions`.
//
// Requires `supabase/migrations/0006_comic_submissions.sql` to already be
// applied (creates the table + bucket). Uses the service-role key, which
// bypasses RLS entirely — this is exactly the kind of trusted, one-off
// server-side write lib/supabase/service.ts's own comment describes.
//
// Usage:
//   node --env-file=.env.local scripts/migrate-static-comics-to-storage.mjs
//
// Safe to re-run: each comic has a fixed id below, so uploads overwrite
// (not duplicate) and the DB row is upserted by slug.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "comic-submissions";
const PUBLIC_COMICS_DIR = path.join(import.meta.dirname, "..", "public", "comics");

// Mirrors the now-removed lib/data/comics.ts — the canonical metadata for
// the SKC team's own comics, plus a fixed submission id per comic so
// re-running this script is idempotent instead of creating duplicates.
const OFFICIAL_COMICS = [
  {
    id: "bcfd3f4b-6283-46ba-af3f-b1e72ec04ee3",
    folder: "bonde",
    slug: "bonde",
    title: "Bonde",
    subtitle: "Harakati za Ngeti",
    creator: "Tai Studio",
    partners: ["UNFPA", "United Nations Tanzania"],
    language: "Kiswahili",
    description:
      "In the village of Imani lives Magde — gentle, orderly and bright in class, but carrying deep sorrow. Made for adolescents, Bonde follows her story to help young readers understand the harm of gender-based violence and child marriage, and how to protect themselves.",
    contentNote: "This story deals with gender-based violence and child marriage.",
    pageWidth: 1400,
    pageHeight: 1986,
  },
  {
    id: "882e4be1-2354-42aa-a662-9956067afa9a",
    folder: "heri",
    slug: "heri",
    title: "Heri",
    subtitle: "Mbabe wa Magonjwa",
    creator: "Tai Plus",
    partners: ["ADD International"],
    language: "Kiswahili",
    description:
      "Heri, a young superhero with the power to fight disease, takes on the germs hiding in Maha, the world of dangerous diseases. Made for children to learn how illnesses spread and how to protect themselves and stay safe.",
    contentNote: null,
    pageWidth: 1400,
    pageHeight: 1921,
  },
  {
    id: "5d5ea9c3-4e66-4361-b7bf-35ffb71e30b2",
    folder: "mashujaa-wa-uviko-19",
    slug: "mashujaa-wa-uviko-19",
    title: "Mashujaa wa UVIKO-19",
    subtitle: "Heroes of COVID-19",
    creator: "Tai Plus",
    partners: ["Wizara ya Afya", "USAID", "CDC", "WRAIR", "Peace Corps"],
    language: "Kiswahili",
    description:
      "The true-life story of ten Tanzanian doctors and nurses who faced the COVID-19 pandemic head-on and without fear. A tribute to the courage, unity and persistence of health workers on the front line of science and health.",
    contentNote: null,
    pageWidth: 1400,
    pageHeight: 1986,
  },
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name} — run with: node --env-file=.env.local ${path.basename(import.meta.url)}`);
    process.exit(1);
  }
  return value;
}

const supabase = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function migrateComic(comic) {
  const sourceDir = path.join(PUBLIC_COMICS_DIR, comic.folder);
  const files = (await readdir(sourceDir)).filter((f) => f.endsWith(".jpg")).sort();

  if (files.length === 0) {
    console.warn(`⚠ ${comic.slug}: no page images found in ${sourceDir}, skipping.`);
    return;
  }

  console.log(`→ ${comic.slug}: uploading ${files.length} pages...`);
  for (const [i, filename] of files.entries()) {
    const buffer = await readFile(path.join(sourceDir, filename));
    const storagePath = `official/${comic.id}/${filename}`;
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (error) throw new Error(`${comic.slug} page ${i + 1} upload failed: ${error.message}`);
  }

  const { error: upsertError } = await supabase.from("comic_submissions").upsert(
    {
      id: comic.id,
      owner_id: null,
      is_official: true,
      slug: comic.slug,
      title: comic.title,
      subtitle: comic.subtitle,
      creator: comic.creator,
      partners: comic.partners,
      language: comic.language,
      description: comic.description,
      content_note: comic.contentNote,
      page_count: files.length,
      page_width: comic.pageWidth,
      page_height: comic.pageHeight,
      status: "approved",
    },
    { onConflict: "slug" },
  );

  if (upsertError) throw new Error(`${comic.slug} row upsert failed: ${upsertError.message}`);
  console.log(`✓ ${comic.slug}: live.`);
}

for (const comic of OFFICIAL_COMICS) {
  await migrateComic(comic);
}

console.log("Done.");
