"use client";

import { Loader2 } from "lucide-react";

export default function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Loader2 size={22} className="animate-spin text-primary" />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}