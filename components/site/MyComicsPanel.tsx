"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { ComicButtonAsButton } from "@/components/ui/ComicButton";
import { Badge } from "@/components/ui/Badge";
import { ComicUploadForm } from "@/components/site/ComicUploadForm";
import type { ComicSubmissionStatus } from "@/types/database";

interface Submission {
  id: string;
  title: string;
  status: ComicSubmissionStatus;
  rejection_reason: string | null;
  page_count: number;
}

const STATUS_TONE: Record<ComicSubmissionStatus, "upcoming" | "available" | "disabled"> = {
  pending: "upcoming",
  approved: "available",
  rejected: "disabled",
};

const STATUS_LABEL: Record<ComicSubmissionStatus, string> = {
  pending: "Pending review",
  approved: "Live on Comics page",
  rejected: "Not approved",
};

export function MyComicsPanel() {
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    fetch("/api/comics")
      .then((res) => (res.ok ? res.json() : { submissions: [] }))
      .then((data) => setSubmissions(data.submissions ?? []))
      .catch(() => setSubmissions([]));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/comics/${id}`, { method: "DELETE" });
      refresh();
    } finally {
      setBusyId(null);
    }
  }

  function handleUploaded() {
    setShowForm(false);
    refresh();
  }

  return (
    <div className="comic-panel rounded-2xl bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-comic-black">My comics</h2>
        {!showForm && (
          <ComicButtonAsButton variant="blue" onClick={() => setShowForm(true)}>
            <Upload size={18} /> Upload a comic
          </ComicButtonAsButton>
        )}
      </div>

      {showForm && (
        <div className="mt-6">
          <ComicUploadForm onCancel={() => setShowForm(false)} onUploaded={handleUploaded} />
        </div>
      )}

      {!showForm && submissions === null && (
        <div className="mt-6 flex justify-center text-comic-black/50">
          <Loader2 className="animate-spin" size={24} />
        </div>
      )}

      {!showForm && submissions && submissions.length === 0 && (
        <p className="mt-4 text-sm text-comic-black/60">
          You haven&apos;t uploaded a comic yet. Upload a PDF and, once a staff admin approves it,
          it&apos;ll appear for everyone on the Comics page.
        </p>
      )}

      {!showForm && submissions && submissions.length > 0 && (
        <ul className="mt-4 space-y-3">
          {submissions.map((submission) => (
            <li
              key={submission.id}
              className="flex items-start justify-between gap-3 rounded-xl border-2 border-comic-black/15 bg-warm-white p-4"
            >
              <div>
                <p className="font-bold text-comic-black">{submission.title}</p>
                <p className="text-xs text-comic-black/50">{submission.page_count} pages</p>
                <div className="mt-1">
                  <Badge tone={STATUS_TONE[submission.status]}>{STATUS_LABEL[submission.status]}</Badge>
                </div>
                {submission.status === "rejected" && submission.rejection_reason && (
                  <p className="mt-2 text-sm text-comic-red">{submission.rejection_reason}</p>
                )}
              </div>
              <button
                type="button"
                aria-label={`Delete ${submission.title}`}
                disabled={busyId === submission.id}
                onClick={() => handleDelete(submission.id)}
                className="shrink-0 rounded-full p-2 text-comic-black/50 hover:bg-comic-red/10 hover:text-comic-red disabled:opacity-50"
              >
                {busyId === submission.id ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
