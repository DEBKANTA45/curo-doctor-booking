"use client";

import AdminModal from "./AdminModal";

interface ConfirmActionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" for destructive actions (deactivate/reject), "primary" otherwise. */
  variant?: "primary" | "danger";
  loading?: boolean;
}

export default function ConfirmActionModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  loading = false,
}: ConfirmActionModalProps) {
  return (
    <AdminModal open={open} onClose={onClose} title={title}>
      {description && <div className="text-sm text-muted">{description}</div>}
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="btn-secondary btn-sm" disabled={loading}>
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={variant === "danger" ? "btn-danger btn-sm" : "btn-primary btn-sm"}
        >
          {loading ? "Please wait…" : confirmLabel}
        </button>
      </div>
    </AdminModal>
  );
}