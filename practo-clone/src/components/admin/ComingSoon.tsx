import { Construction } from "lucide-react";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
        <Construction size={24} />
      </span>
      <div>
        <p className="font-display text-lg font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm text-muted">This module is coming soon.</p>
      </div>
    </div>
  );
}