"use client";

import { useEffect, useMemo, useState } from "react";
import { Star, Flag, EyeOff, Eye } from "lucide-react";
import { getAllReviewsForAdmin, hideReview, unhideReview, AdminReviewView } from "@/lib/mock-db";
import AdminTable, { AdminTableColumn } from "@/components/admin/AdminTable";
import SearchFilter from "@/components/admin/SearchFilter";
import Pagination from "@/components/admin/Pagination";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminModal from "@/components/admin/AdminModal";
import ConfirmActionModal from "@/components/admin/ConfirmActionModal";
import LoadingState from "@/components/admin/LoadingState";
import EmptyState from "@/components/admin/EmptyState";
import ErrorState from "@/components/admin/ErrorState";
import { useAdminAuth } from "@/context/AdminAuthContext";



const PAGE_SIZE = 8;

const VISIBILITY_FILTER_OPTIONS = [
  { label: "Reported", value: "reported" },
  { label: "Hidden", value: "hidden" },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-accent">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={13} fill={i < rating ? "currentColor" : "none"} className="text-accent" />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
const { can } = useAdminAuth();
const canEdit = can("reviews", "edit");
  const [reviews, setReviews] = useState<AdminReviewView[] | null>(null);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);

  const [viewReview, setViewReview] = useState<AdminReviewView | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AdminReviewView | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  function load() {
    setReviews(null);
    setError(false);
    setTimeout(() => {
      try {
        setReviews(getAllReviewsForAdmin());
      } catch {
        setError(true);
      }
    }, 350);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, visibilityFilter, doctorFilter, ratingFilter, dateFilter]);

  const doctorOptions = useMemo(() => {
    if (!reviews) return [];
    return Array.from(new Set(reviews.map((r) => r.doctorName))).sort();
  }, [reviews]);

  const filtered = useMemo(() => {
    if (!reviews) return [];
    const term = search.trim().toLowerCase();
    return reviews.filter((r) => {
      const matchesSearch =
        !term || r.author.toLowerCase().includes(term) || r.comment.toLowerCase().includes(term);
      const matchesVisibility =
        !visibilityFilter || (visibilityFilter === "reported" ? r.reported : r.hidden);
      const matchesDoctor = !doctorFilter || r.doctorName === doctorFilter;
      const matchesRating = !ratingFilter || r.rating === Number(ratingFilter);
      const matchesDate = !dateFilter || r.date === dateFilter;
      return matchesSearch && matchesVisibility && matchesDoctor && matchesRating && matchesDate;
    });
  }, [reviews, search, visibilityFilter, doctorFilter, ratingFilter, dateFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => b.date.localeCompare(a.date)), [filtered]);
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function updateInState(id: string, patch: Partial<AdminReviewView>) {
    setReviews((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, ...patch } : r)) : prev));
    setViewReview((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  }

  function handleConfirmVisibility() {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    const nextHidden = !confirmTarget.hidden;
    setTimeout(() => {
      if (nextHidden) hideReview(confirmTarget.id);
      else unhideReview(confirmTarget.id);
      updateInState(confirmTarget.id, { hidden: nextHidden });
      setConfirmLoading(false);
      setConfirmTarget(null);
    }, 300);
  }

  const columns: AdminTableColumn<AdminReviewView>[] = [
    {
      key: "doctorName",
      header: "Doctor",
      render: (r) => <span className="text-sm text-ink">{r.doctorName}</span>,
    },
    {
      key: "author",
      header: "Author",
      render: (r) => <span className="text-sm text-muted">{r.author}</span>,
    },
    {
      key: "rating",
      header: "Rating",
      render: (r) => <Stars rating={r.rating} />,
    },
    {
      key: "comment",
      header: "Comment",
      render: (r) => <span className="line-clamp-1 max-w-xs text-sm text-muted">{r.comment}</span>,
    },
    {
      key: "date",
      header: "Date",
      render: (r) => <span className="text-sm text-muted">{r.date}</span>,
    },
    {
      key: "flags",
      header: "Flags",
      render: (r) => (
        <div className="flex flex-wrap gap-1.5">
          {r.reported && <StatusBadge label="Reported" />}
          {r.hidden && <StatusBadge label="Hidden" />}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setViewReview(r)}
            className="rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-primary/40 hover:bg-primary-light hover:text-primary-dark"
          >
            View
          </button>
         {canEdit && (
  <button
    onClick={() => setConfirmTarget(r)}
    className={`flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
      r.hidden
        ? "border-success/40 text-success hover:bg-success-light"
        : "border-accent/40 text-accent hover:bg-accent-light"
    }`}
  >
    {r.hidden ? <Eye size={12} /> : <EyeOff size={12} />}
    {r.hidden ? "Unhide" : "Hide"}
  </button>
)}
        </div>
      ),
    },
  ];

  return (
    <div className="p-5 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Reviews</h1>
      <p className="mt-1 text-sm text-muted">Doctor reviews and ratings across the platform.</p>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <SearchFilter
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by author or comment…"
            filterValue={visibilityFilter}
            onFilterChange={setVisibilityFilter}
            filterOptions={VISIBILITY_FILTER_OPTIONS}
            filterAllLabel="All reviews"
          />
        </div>
        <select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)} className="field lg:w-48">
          <option value="">All doctors</option>
          {doctorOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="field lg:w-36">
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="field lg:w-44"
        />
      </div>

      <div className="mt-5">
        {error ? (
          <ErrorState description="Couldn't load reviews." onRetry={load} />
        ) : reviews === null ? (
          <LoadingState label="Loading reviews…" />
        ) : sorted.length === 0 ? (
          <EmptyState title="No reviews found" description="Try adjusting your search or filters." />
        ) : (
          <>
            <AdminTable columns={columns} rows={paged} rowKey={(r) => r.id} onRowClick={(r) => setViewReview(r)} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={sorted.length} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Review detail modal */}
      <AdminModal open={!!viewReview} onClose={() => setViewReview(null)} title="Review details" maxWidth="max-w-lg">
        {viewReview && (
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{viewReview.author}</p>
                <p className="truncate text-xs text-muted">Reviewed {viewReview.doctorName}</p>
              </div>
              <Stars rating={viewReview.rating} />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {viewReview.reported && <StatusBadge label="Reported" />}
              {viewReview.hidden && <StatusBadge label="Hidden" />}
              <StatusBadge label={viewReview.date} />
            </div>

            <p className="mt-4 rounded-lg border border-line bg-bg p-3 text-sm text-ink">{viewReview.comment}</p>

            {viewReview.reported && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-accent/30 bg-accent-light/40 p-3 text-sm text-accent">
                <Flag size={15} className="mt-0.5 shrink-0" />
                <p>This review has been reported by users and may need moderation.</p>
              </div>
            )}

            <div className="mt-5 flex justify-end border-t border-line pt-5">
              {canEdit && (
  <button
    onClick={() => setConfirmTarget(viewReview)}
    className={`btn-sm flex items-center gap-1.5 rounded-md border font-medium transition-colors ${
      viewReview.hidden
        ? "border-success/40 text-success hover:bg-success-light"
        : "border-accent/40 text-accent hover:bg-accent-light"
    }`}
  >
    {viewReview.hidden ? <Eye size={13} /> : <EyeOff size={13} />}
    {viewReview.hidden ? "Unhide review" : "Hide review"}
  </button>
)}
            </div>
          </div>
        )}
      </AdminModal>

      {/* Hide / Unhide confirmation */}
      <ConfirmActionModal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirmVisibility}
        loading={confirmLoading}
        title={confirmTarget?.hidden ? "Unhide this review?" : "Hide this review?"}
        description={
          confirmTarget?.hidden
            ? "This review will become publicly visible on the doctor's profile again."
            : `This review by ${confirmTarget?.author} will be removed from ${confirmTarget?.doctorName}'s public profile and won't count toward their rating.`
        }
        confirmLabel={confirmTarget?.hidden ? "Unhide" : "Hide review"}
        variant={confirmTarget?.hidden ? "primary" : "danger"}
      />
    </div>
  );
}