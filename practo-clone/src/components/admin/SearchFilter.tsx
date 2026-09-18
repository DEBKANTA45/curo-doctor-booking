"use client";

import { Search } from "lucide-react";

interface FilterOption {
  label: string;
  value: string;
}

interface SearchFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Omit filterOptions/onFilterChange entirely to render just the search box. */
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  /** Label for the "no filter selected" option, e.g. "All statuses". */
  filterAllLabel?: string;
}

export default function SearchFilter({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  filterValue = "",
  onFilterChange,
  filterOptions,
  filterAllLabel = "All",
}: SearchFilterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
        />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="field pl-9"
        />
      </div>
      {filterOptions && onFilterChange && (
        <select
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
          className="field sm:w-48"
        >
          <option value="">{filterAllLabel}</option>
          {filterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}