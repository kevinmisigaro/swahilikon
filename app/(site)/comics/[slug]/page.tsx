import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ComicReader } from "@/components/site/ComicReader";
import { getPublishedComicBySlug } from "@/lib/comics/submissions";
import { createClient } from "@/lib/supabase/server";

async function resolveComic(slug: string) {
  const supabase = await createClient();
  return getPublishedComicBySlug(supabase, slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const comic = await resolveComic(slug);
  if (!comic) return { title: "Comic" };
  return {
    title: comic.subtitle ? `${comic.title}: ${comic.subtitle}` : comic.title,
    description: comic.description,
  };
}

export default async function ComicReaderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const comic = await resolveComic(slug);
  if (!comic) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link
        href="/comics"
        className="inline-flex items-center gap-1 text-sm font-bold text-comic-black/70 hover:text-comic-red"
      >
        <ArrowLeft size={16} /> All comics
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone="upcoming">{comic.language}</Badge>
          <Badge>{comic.pages.length} pages</Badge>
          {comic.isCommunitySubmission && <Badge tone="neutral">Community</Badge>}
        </div>
        <h1 className="font-display mt-3 text-5xl text-comic-black sm:text-6xl">{comic.title}</h1>
        {comic.subtitle && (
          <p className="font-display text-2xl text-comic-red">{comic.subtitle}</p>
        )}
        <p className="mt-2 text-sm font-semibold text-comic-black/60">
          By {comic.creator}
          {comic.partners?.length ? ` · with ${comic.partners.join(", ")}` : ""}
        </p>
        <p className="mt-4 max-w-2xl text-comic-black/80">{comic.description}</p>
        {comic.contentNote && (
          <p className="mt-4 max-w-2xl rounded-xl border-2 border-golden-orange bg-golden-orange/15 px-4 py-3 text-sm font-semibold text-comic-black">
            Content note: {comic.contentNote}
          </p>
        )}
      </header>

      <div className="mt-10">
        <ComicReader comic={comic} />
      </div>
    </div>
  );
}
