"use client";

import { useState } from "react";
import { FileText, IdCard, GraduationCap, Eye, X } from "lucide-react";
import type { DoctorDocument } from "@/lib/types";

const TYPE_ICON: Record<string, React.ElementType> = {
  License: FileText,
  Degree: GraduationCap,
  Identity: IdCard,
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function DocumentPreviewCard({ document }: { document: DoctorDocument }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const Icon = TYPE_ICON[document.type] ?? FileText;

  return (
    <>
      <div className="flex items-center gap-3 rounded-lg border border-line bg-bg p-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary-dark">
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{document.name}</p>
          <p className="text-xs text-muted">
            {document.type} &middot; Submitted {formatDate(document.uploadedAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-primary/40 hover:bg-primary-light hover:text-primary-dark"
        >
          <Eye size={13} />
          View
        </button>
      </div>

      {previewOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl border border-line bg-surface p-5 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-semibold text-ink">{document.name}</p>
              <button
                onClick={() => setPreviewOpen(false)}
                aria-label="Close preview"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-bg hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            {/* Stylized mock document preview — no real file storage in this demo. */}
            <div className="mt-4 flex aspect-[3/4] flex-col gap-2.5 rounded-lg border border-dashed border-line bg-bg p-5">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <Icon size={22} className="text-primary" />
                <div className="h-2.5 w-24 rounded-full bg-line" />
              </div>
              {[90, 75, 85, 60, 80, 40].map((w, i) => (
                <div key={i} className="h-2 rounded-full bg-line/70" style={{ width: `${w}%` }} />
              ))}
              <div className="mt-auto flex justify-end">
                <div className="h-8 w-16 rounded border border-line" />
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-faint">
              Mock preview for demo purposes — {document.type} &middot; Submitted {formatDate(document.uploadedAt)}
            </p>
          </div>
        </div>
      )}
    </>
  );
}