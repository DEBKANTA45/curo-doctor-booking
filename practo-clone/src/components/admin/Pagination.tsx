"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  /** 1-indexed current page. */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-3 border-t border-line px-1 py-3 text-sm">
      <p className="text-xs text-muted">
        {total === 0 ? "No results" : `${start}–${end} of ${total}`}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-muted transition-colors hover:border-primary hover:text-ink disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="font-tabular text-xs text-ink">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-muted transition-colors hover:border-primary hover:text-ink disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}