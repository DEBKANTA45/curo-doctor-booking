import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "Something went wrong",
  description = "Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-accent/40 bg-accent-light/40 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-light text-accent">
        <AlertTriangle size={20} />
      </span>
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary btn-sm mt-1">
          Try again
        </button>
      )}
    </div>
  );
}