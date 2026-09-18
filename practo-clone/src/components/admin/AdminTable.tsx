"use client";

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface AdminTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
  /** Applied to both the <th> and every <td> in this column, e.g. "text-right w-32". */
  className?: string;
}

interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Pass these three together to make a column's header clickable/sortable. */
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSortChange?: (key: string) => void;
  onRowClick?: (row: T) => void;
}

export default function AdminTable<T>({
  columns,
  rows,
  rowKey,
  sortKey,
  sortDirection,
  onSortChange,
  onRowClick,
}: AdminTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-bg">
          <tr>
            {columns.map((col) => {
              const isSorted = sortKey === col.key;
              return (
                <th
                  key={col.key}
                  className={`whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-faint ${
                    col.className ?? ""
                  }`}
                >
                  {col.sortable && onSortChange ? (
                    <button
                      onClick={() => onSortChange(col.key)}
                      className="flex items-center gap-1 transition-colors hover:text-ink"
                    >
                      {col.header}
                      {isSorted ? (
                        sortDirection === "asc" ? (
                          <ArrowUp size={12} />
                        ) : (
                          <ArrowDown size={12} />
                        )
                      ) : (
                        <ArrowUpDown size={12} className="opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={`transition-colors ${onRowClick ? "cursor-pointer hover:bg-bg" : ""}`}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 text-ink ${col.className ?? ""}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}