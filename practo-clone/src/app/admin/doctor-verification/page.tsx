"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  MapPin,
  Stethoscope,
  FileCheck2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { approveDoctorVerification, getAllDoctors, rejectDoctorVerification } from "@/lib/mock-db";
import type { Doctor } from "@/lib/types";
import AdminTable, { AdminTableColumn } from "@/components/admin/AdminTable";
import SearchFilter from "@/components/admin/SearchFilter";
import Pagination from "@/components/admin/Pagination";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminModal from "@/components/admin/AdminModal";
import ConfirmActionModal from "@/components/admin/ConfirmActionModal";
import DocumentPreviewCard from "@/components/admin/DocumentPreviewCard";
import LoadingState from "@/components/admin/LoadingState";
import EmptyState from "@/components/admin/EmptyState";
import ErrorState from "@/components/admin/ErrorState";

const PAGE_SIZE = 8;

const STATUS_FILTER_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

function verificationLabel(status?: string) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminDoctorVerificationPage() {
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  // Defaults to Pending — that's the actionable queue admins land on.
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);

  const [reviewDoctor, setReviewDoctor] = useState<Doctor | null>(null);
  const [approveTarget, setApproveTarget] = useState<Doctor | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Doctor | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  function load() {
    setDoctors(null);
    setError(false);
    setTimeout(() => {
      try {
        setDoctors(getAllDoctors());
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
  }, [search, statusFilter]);

  const filtered = useMemo(() => {
    if (!doctors) return [];
    const term = search.trim().toLowerCase();
    return doctors.filter((d) => {
      const matchesSearch =
        !term || d.name.toLowerCase().includes(term) || d.specialty.toLowerCase().includes(term);
      const matchesStatus = !statusFilter || d.verificationStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [doctors, search, statusFilter]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => (b.registeredAt ?? "").localeCompare(a.registeredAt ?? "")),
    [filtered]
  );
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function updateDoctorInState(updated: Doctor) {
    setDoctors((prev) => (prev ? prev.map((d) => (d.id === updated.id ? updated : d)) : prev));
  }

  function handleApprove() {
    if (!approveTarget) return;
    setActionLoading(true);
    setTimeout(() => {
      const updated = approveDoctorVerification(approveTarget.id);
      if (updated) updateDoctorInState(updated);
      setActionLoading(false);
      setApproveTarget(null);
      setReviewDoctor(null);
    }, 300);
  }

  function handleReject() {
    if (!rejectTarget || !rejectionReason.trim()) return;
    setActionLoading(true);
    setTimeout(() => {
      const updated = rejectDoctorVerification(rejectTarget.id, rejectionReason);
      if (updated) updateDoctorInState(updated);
      setActionLoading(false);
      setRejectTarget(null);
      setRejectionReason("");
      setReviewDoctor(null);
    }, 300);
  }

  const columns: AdminTableColumn<Doctor>[] = [
    {
      key: "name",
      header: "Doctor",
      render: (d) => (
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-line">
            <Image src={d.photo} alt={d.name} fill sizes="36px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{d.name}</p>
            <p className="truncate text-xs text-muted">{d.specialty}</p>
          </div>
        </div>
      ),
    },
    {
      key: "documents",
      header: "Documents",
      render: (d) => (
        <span className="flex items-center gap-1.5 text-sm text-muted">
          <FileCheck2 size={14} className="text-faint" />
          {d.documents?.length ?? 0} submitted
        </span>
      ),
    },
    {
      key: "registeredAt",
      header: "Submitted",
      render: (d) => <span className="text-sm text-muted">{formatDate(d.registeredAt)}</span>,
    },
    {
      key: "verification",
      header: "Status",
      render: (d) => <StatusBadge label={verificationLabel(d.verificationStatus)} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (d) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setReviewDoctor(d)}
            className="rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-primary/40 hover:bg-primary-light hover:text-primary-dark"
          >
            Review
          </button>
        </div>
      ),
    },
  ];

  return (
<div className="mx-auto max-w-6xl p-5 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Doctor Verification</h1>
      <p className="mt-1 text-sm text-muted">
        Review submitted documents and approve or reject doctor verification requests.
      </p>

      <div className="mt-6">
        <SearchFilter
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or specialty…"
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={STATUS_FILTER_OPTIONS}
          filterAllLabel="All statuses"
        />
      </div>

      <div className="mt-5">
        {error ? (
          <ErrorState description="Couldn't load verification requests." onRetry={load} />
        ) : doctors === null ? (
          <LoadingState label="Loading verification requests…" />
        ) : sorted.length === 0 ? (
          <EmptyState
            title="Nothing to review"
            description="No doctors match the current search and filter."
          />
        ) : (
          <>
            <AdminTable
              columns={columns}
              rows={paged}
              rowKey={(d) => d.id}
              onRowClick={(d) => setReviewDoctor(d)}
            />
            <Pagination page={page} pageSize={PAGE_SIZE} total={sorted.length} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Review modal */}
      <AdminModal
        open={!!reviewDoctor}
        onClose={() => setReviewDoctor(null)}
        title="Verification review"
        maxWidth="max-w-xl"
      >
        {reviewDoctor && (
          <div>
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-1 ring-line">
                <Image src={reviewDoctor.photo} alt={reviewDoctor.name} fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-semibold text-ink">{reviewDoctor.name}</p>
                <p className="truncate text-sm text-muted">
                  {reviewDoctor.specialty} &middot; {reviewDoctor.qualifications}
                </p>
              </div>
              <StatusBadge label={verificationLabel(reviewDoctor.verificationStatus)} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
              <div className="flex items-start gap-2">
                <Stethoscope size={14} className="mt-0.5 shrink-0 text-primary" />
                <span className="text-ink">{reviewDoctor.experienceYears} years experience</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0 text-cyan-dark" />
                <span className="text-ink">
                  {reviewDoctor.clinicName}, {reviewDoctor.city}
                </span>
              </div>
            </div>

            {reviewDoctor.verificationStatus === "rejected" && reviewDoctor.rejectionReason && (
              <div className="mt-4 rounded-lg border border-accent/30 bg-accent-light/40 p-3 text-sm text-accent">
                <p className="font-medium">Previous rejection reason</p>
                <p className="mt-0.5">{reviewDoctor.rejectionReason}</p>
              </div>
            )}

            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-2.5 text-sm font-medium text-ink">Submitted documents</p>
              <div className="space-y-2">
                {(reviewDoctor.documents ?? []).map((doc) => (
                  <DocumentPreviewCard key={doc.id} document={doc} />
                ))}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-line pt-5">
              <button
                onClick={() => {
                  setRejectTarget(reviewDoctor);
                  setRejectionReason("");
                }}
                className="btn-danger btn-sm flex items-center gap-1.5"
              >
                <XCircle size={14} />
                Reject
              </button>
              <button
                onClick={() => setApproveTarget(reviewDoctor)}
                className="btn-primary btn-sm flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                Approve
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Approve confirmation */}
      <ConfirmActionModal
        open={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
        loading={actionLoading}
        title="Approve verification?"
        description={`${approveTarget?.name} will be marked as a verified doctor and shown the Verified badge to patients.`}
        confirmLabel="Approve"
        variant="primary"
      />

      {/* Reject — reason required */}
      <AdminModal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject verification">
        <p className="text-sm text-muted">
          Let {rejectTarget?.name} know why their verification was rejected. This reason is required and will
          be shown to the doctor so they can resubmit.
        </p>
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          rows={4}
          placeholder="e.g. The uploaded medical license is unclear — please reupload a legible scan."
          className="field mt-3 resize-none"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setRejectTarget(null)}
            className="btn-secondary btn-sm"
            disabled={actionLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={!rejectionReason.trim() || actionLoading}
            className="btn-danger btn-sm"
          >
            {actionLoading ? "Please wait…" : "Confirm rejection"}
          </button>
        </div>
      </AdminModal>
    </div>
  );
}