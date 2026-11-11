import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { COMIC_SUBMISSIONS_BUCKET, comicSubmissionFolder } from "@/lib/comics/storage";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: submission } = await supabase
    .from("comic_submissions")
    .select("id, owner_id")
    .eq("id", id)
    .maybeSingle();

  if (!submission || submission.owner_id !== user.id) {
    return NextResponse.json({ error: "Comic not found." }, { status: 404 });
  }

  const folder = comicSubmissionFolder(user.id, id);
  const { data: files } = await supabase.storage.from(COMIC_SUBMISSIONS_BUCKET).list(folder);

  if (files && files.length > 0) {
    await supabase.storage
      .from(COMIC_SUBMISSIONS_BUCKET)
      .remove(files.map((file) => `${folder}/${file.name}`));
  }

  const { error } = await supabase.from("comic_submissions").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Couldn't delete this comic." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
