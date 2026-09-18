type StatusVariant = "success" | "accent" | "primary" | "cyan" | "faint";

interface StatusBadgeProps {
  /** The text shown in the pill, e.g. "Completed", "Paid", "Verified". */
  label: string;
  /**
   * Force a specific color. If omitted, the label is lowercased and matched
   * against a default map of common statuses (see below) — good enough for
   * most modules without needing to pass a variant every time.
   */
  variant?: StatusVariant;
}

// Common status words across appointments, payments, doctor verification,
// reviews, etc. Extend this map as new modules introduce new status words —
// or just pass an explicit `variant` prop for anything not covered here.
const DEFAULT_VARIANT_MAP: Record<string, StatusVariant> = {
  completed: "success",
  paid: "success",
  verified: "success",
  active: "success",
  approved: "success",
  resolved: "success",
  cancelled: "accent",
  failed: "accent",
  rejected: "accent",
  inactive: "accent",
  suspended: "accent",
  refunded: "accent",
  upcoming: "primary",
  pending: "primary",
  "in review": "primary",
  scheduled: "primary",
  online: "cyan",
  unread: "cyan",
  draft: "faint",
  unverified: "faint",
};

const VARIANT_CLASS: Record<StatusVariant, string> = {
  success: "badge-success",
  accent: "badge-accent",
  primary: "badge-primary",
  cyan: "badge-cyan",
  faint: "badge bg-bg text-faint",
};

export default function StatusBadge({ label, variant }: StatusBadgeProps) {
  const resolved = variant ?? DEFAULT_VARIANT_MAP[label.trim().toLowerCase()] ?? "faint";
  return <span className={VARIANT_CLASS[resolved]}>{label}</span>;
}