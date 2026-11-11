// Client-only: turns an uploaded comic PDF into one JPEG per page, entirely
// in the browser (pdf.js renders to a <canvas>). Nothing here touches the
// server, so uploading never requires a server-side PDF/image dependency.

import { MAX_COMIC_PAGES } from "@/lib/comics/storage";

export interface RenderedComicPage {
  blob: Blob;
  width: number;
  height: number;
}

const TARGET_PAGE_WIDTH = 1400;
const JPEG_QUALITY = 0.85;

let workerConfigured = false;

async function loadPdfjs() {
  const pdfjsLib = await import("pdfjs-dist");
  if (!workerConfigured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    workerConfigured = true;
  }
  return pdfjsLib;
}

/** Renders every page of `file` to a JPEG at a fixed 1400px width. */
export async function renderPdfToPages(
  file: File,
  onProgress?: (done: number, total: number) => void,
): Promise<RenderedComicPage[]> {
  const pdfjsLib = await loadPdfjs();
  const data = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;

  if (pdf.numPages < 1 || pdf.numPages > MAX_COMIC_PAGES) {
    await loadingTask.destroy();
    throw new Error(`Comics must be between 1 and ${MAX_COMIC_PAGES} pages (this PDF has ${pdf.numPages}).`);
  }

  const pages: RenderedComicPage[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: TARGET_PAGE_WIDTH / baseViewport.width });

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      if (!canvas.getContext("2d")) throw new Error("Couldn't create a canvas to render this PDF.");

      await page.render({ canvas, viewport }).promise;
      page.cleanup();

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
      );
      if (!blob) throw new Error("Couldn't convert a rendered page to an image.");

      pages.push({ blob, width: canvas.width, height: canvas.height });
      onProgress?.(pageNumber, pdf.numPages);
    }
  } finally {
    await loadingTask.destroy();
  }

  return pages;
}
