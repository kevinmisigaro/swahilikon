"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Upload } from "lucide-react";
import { ComicButtonAsButton } from "@/components/ui/ComicButton";
import { createClient } from "@/lib/supabase/client";
import { renderPdfToPages } from "@/lib/pdf/renderPdfToPages";
import { COMIC_SUBMISSIONS_BUCKET, comicPagePath, MAX_COMIC_PAGES } from "@/lib/comics/storage";
import type { ComicSubmissionStatus } from "@/types/database";

// Keep in sync with the limits enforced by /api/comics.
const MAX_PDF_BYTES = 50 * 1024 * 1024;
const DESCRIPTION_MAX_LENGTH = 1000;

export interface SubmissionSummary {
  id: string;
  title: string;
  status: ComicSubmissionStatus;
}

export function ComicUploadForm({
  onUploaded,
  onCancel,
}: {
  onUploaded: (submission: SubmissionSummary) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [creator, setCreator] = useState("");
  const [language, setLanguage] = useState("Kiswahili");
  const [description, setDescription] = useState("");
  const [contentNote, setContentNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a PDF to upload.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError("That PDF is too large — please keep it under 50MB.");
      return;
    }

    setBusy(true);
    setError(null);
    const supabase = createClient();
    const uploadedPaths: string[] = [];

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in to upload a comic.");

      setProgress("Reading your PDF…");
      const pages = await renderPdfToPages(file, (done, total) =>
        setProgress(`Rendering page ${done} of ${total}…`),
      );

      const submissionId = crypto.randomUUID();

      for (let i = 0; i < pages.length; i++) {
        setProgress(`Uploading page ${i + 1} of ${pages.length}…`);
        const path = comicPagePath(user.id, submissionId, i + 1);
        const { error: uploadError } = await supabase.storage
          .from(COMIC_SUBMISSIONS_BUCKET)
          .upload(path, pages[i].blob, { contentType: "image/jpeg" });
        if (uploadError) throw new Error(uploadError.message);
        uploadedPaths.push(path);
      }

      setProgress("Saving…");
      const res = await fetch("/api/comics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: submissionId,
          title,
          subtitle,
          creator,
          language,
          description,
          contentNote,
          pageCount: pages.length,
          pageWidth: pages[0].width,
          pageHeight: pages[0].height,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save your comic.");

      onUploaded(data.submission);
    } catch (err) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(COMIC_SUBMISSIONS_BUCKET).remove(uploadedPaths);
      }
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="comic-title" className="mb-1 block text-sm font-bold text-comic-black">
          Title
        </label>
        <input
          id="comic-title"
          required
          minLength={2}
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border-2 border-comic-black px-4 py-3 focus:ring-4 focus:ring-golden-orange/40 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="comic-subtitle" className="mb-1 block text-sm font-bold text-comic-black">
          Subtitle (optional)
        </label>
        <input
          id="comic-subtitle"
          maxLength={100}
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          className="w-full rounded-xl border-2 border-comic-black px-4 py-3 focus:ring-4 focus:ring-golden-orange/40 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="comic-creator" className="mb-1 block text-sm font-bold text-comic-black">
            Creator / studio
          </label>
          <input
            id="comic-creator"
            required
            minLength={2}
            maxLength={100}
            value={creator}
            onChange={(e) => setCreator(e.target.value)}
            className="w-full rounded-xl border-2 border-comic-black px-4 py-3 focus:ring-4 focus:ring-golden-orange/40 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="comic-language" className="mb-1 block text-sm font-bold text-comic-black">
            Language
          </label>
          <input
            id="comic-language"
            required
            maxLength={40}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-xl border-2 border-comic-black px-4 py-3 focus:ring-4 focus:ring-golden-orange/40 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <label htmlFor="comic-description" className="block text-sm font-bold text-comic-black">
            Description
          </label>
          <span className="text-xs text-comic-black/50">
            {description.length}/{DESCRIPTION_MAX_LENGTH}
          </span>
        </div>
        <textarea
          id="comic-description"
          required
          rows={3}
          minLength={10}
          maxLength={DESCRIPTION_MAX_LENGTH}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this comic about?"
          className="w-full resize-y rounded-xl border-2 border-comic-black px-4 py-3 focus:ring-4 focus:ring-golden-orange/40 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="comic-content-note" className="mb-1 block text-sm font-bold text-comic-black">
          Content note (optional)
        </label>
        <input
          id="comic-content-note"
          maxLength={300}
          value={contentNote}
          onChange={(e) => setContentNote(e.target.value)}
          placeholder="e.g. themes some readers may find difficult"
          className="w-full rounded-xl border-2 border-comic-black px-4 py-3 focus:ring-4 focus:ring-golden-orange/40 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="comic-file" className="mb-1 block text-sm font-bold text-comic-black">
          Comic PDF
        </label>
        <input
          id="comic-file"
          type="file"
          accept="application/pdf"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full rounded-xl border-2 border-comic-black bg-warm-white px-4 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-comic-black file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
        />
        <p className="mt-1 text-xs text-comic-black/50">
          Up to {MAX_COMIC_PAGES} pages, 50MB max. Rendered to page images right in your browser.
        </p>
      </div>

      {progress && (
        <p className="flex items-center gap-2 text-sm font-semibold text-comic-black/70">
          <Loader2 className="animate-spin" size={16} /> {progress}
        </p>
      )}
      {error && <p className="text-sm font-semibold text-comic-red">{error}</p>}

      <p className="text-xs text-comic-black/50">
        A staff admin reviews every upload before it appears on the public Comics page.
      </p>

      <div className="flex flex-wrap gap-3">
        <ComicButtonAsButton type="submit" variant="green" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" size={20} /> : <Upload size={18} />}
          {busy ? "Uploading…" : "Upload comic"}
        </ComicButtonAsButton>
        <ComicButtonAsButton type="button" variant="outline" onClick={onCancel} disabled={busy}>
          Cancel
        </ComicButtonAsButton>
      </div>
    </form>
  );
}
