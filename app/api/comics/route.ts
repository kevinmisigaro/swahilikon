import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { COMIC_SUBMISSIONS_BUCKET, MAX_COMIC_PAGES, comicSubmissionFolder } from "@/lib/comics/storage";

const createSubmissionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(2).max(100),
  subtitle: z.string().trim().max(100).optional().or(z.literal("")),
  creator: z.string().trim().min(2).max(100),
  language: z.string().trim().min(2).max(40).optional().or(z.literal("")),
  description: z.string().trim().min(10).max(1000),
  contentNote: z.string().trim().max(300).optional().or(z.literal("")),
  pageCount: z.number().int().min(1).max(MAX_COMIC_PAGES),
  pageWidth: z.number().int().positive(),
  pageHeight: z.number().int().positive(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("comic_submissions")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Couldn't load your comics." }, { status: 500 });
  }

  return NextResponse.json({ submissions: data });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = createSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id, title, subtitle, creator, language, description, contentNote, pageCount, pageWidth, pageHeight } =
    parsed.data;

  // The client already uploaded the page images to this folder — confirm
  // the count actually there matches what it's claiming before we publish
  // a row that the reader will try to build `pageCount` signed URLs from.
  const { data: files, error: listError } = await supabase.storage
    .from(COMIC_SUBMISSIONS_BUCKET)
    .list(comicSubmissionFolder(user.id, id));

  if (listError || !files || files.length !== pageCount) {
    return NextResponse.json(
      { error: "Uploaded pages don't match — please try uploading again." },
      { status: 400 },
    );
  }

  const slug = `${slugify(title) || "comic"}-${id.slice(0, 8)}`;

  const { data, error } = await supabase
    .from("comic_submissions")
    .insert({
      id,
      owner_id: user.id,
      slug,
      title,
      subtitle: subtitle || null,
      creator,
      language: language || "Kiswahili",
      description,
      content_note: contentNote || null,
      page_count: pageCount,
      page_width: pageWidth,
      page_height: pageHeight,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Couldn't save your comic." }, { status: 500 });
  }

  return NextResponse.json({ submission: data });
}
