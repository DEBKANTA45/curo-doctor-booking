import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
}

export default function EmptyState({
  title = "Nothing here yet",
  description,
  icon: Icon = Inbox,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-bg text-faint">
        <Icon size={20} />
      </span>
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}