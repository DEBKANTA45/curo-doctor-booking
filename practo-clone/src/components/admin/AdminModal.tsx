"use client";

import { X } from "lucide-react";

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Tailwind max-width class for the dialog, e.g. "max-w-md" (default), "max-w-lg", "max-w-2xl". */
  maxWidth?: string;
}

export default function AdminModal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
}: AdminModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidth} max-h-[85vh] overflow-y-auto rounded-xl border border-line bg-surface p-6 shadow-soft`}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-bg hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}