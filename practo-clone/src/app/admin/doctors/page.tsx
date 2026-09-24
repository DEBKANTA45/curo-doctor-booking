"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Stethoscope,
  MapPin,
  IndianRupee,
  CalendarClock,
  Globe2,
  BadgeCheck,
  Power,
  ArrowRight,
} from "lucide-react";
import { getAllDoctors, setDoctorActive } from "@/lib/mock-db";
import type { Doctor } from "@/lib/types";
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

type SortKey = "name" | "experienceYears" | "consultationFee";

const VERIFICATION_FILTER_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

function verificationLabel(status?: string) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

export default function AdminDoctorsPage() {
const { can } = useAdminAuth();
const canEdit = can("doctors", "edit");
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [viewDoctor, setViewDoctor] = useState<Doctor | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Doctor | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  function load() {
    setDoctors(null);
    setError(false);
    // Small artificial delay so the loading state is visible, same as a real fetch would be.
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
  }, [search, statusFilter, verificationFilter]);

  const filtered = useMemo(() => {
    if (!doctors) return [];
    const term = search.trim().toLowerCase();
    return doctors.filter((d) => {
      const matchesSearch =
        !term ||
        d.name.toLowerCase().includes(term) ||
        d.specialty.toLowerCase().includes(term) ||
        d.city.toLowerCase().includes(term);
      const matchesStatus =
        !statusFilter || (statusFilter === "active" ? d.active !== false : d.active === false);
      const matchesVerification = !verificationFilter || d.verificationStatus === verificationFilter;
      return matchesSearch && matchesStatus && matchesVerification;
    });
  }, [doctors, search, statusFilter, verificationFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else cmp = a[sortKey] - b[sortKey];
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDirection]);

  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSortChange(key: string) {
    if (key !== sortKey) {
      setSortKey(key as SortKey);
      setSortDirection("asc");
    } else {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    }
  }

  function handleConfirmToggle() {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    const nextActive = confirmTarget.active === false;
    setTimeout(() => {
      setDoctorActive(confirmTarget.id, nextActive);
      setDoctors((prev) =>
        prev ? prev.map((d) => (d.id === confirmTarget.id ? { ...d, active: nextActive } : d)) : prev
      );
      setViewDoctor((prev) => (prev && prev.id === confirmTarget.id ? { ...prev, active: nextActive } : prev));
      setConfirmLoading(false);
      setConfirmTarget(null);
    }, 300);
  }

  const columns: AdminTableColumn<Doctor>[] = [
    {
      key: "name",
      header: "Doctor",
      sortable: true,
      render: (d) => (
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-line">
            <Image src={d.photo} alt={d.name} fill sizes="36px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="truncate font-medium text-ink">{d.name}</p>
              {d.verified && <BadgeCheck size={13} className="shrink-0 text-primary" />}
            </div>
            <p className="truncate text-xs text-muted">{d.specialty}</p>
          </div>
        </div>
      ),
    },
    {
      key: "city",
      header: "Location",
      render: (d) => (
        <span className="text-sm text-muted">
          {d.city}
          {d.locality ? `, ${d.locality}` : ""}
        </span>
      ),
    },
    {
      key: "experienceYears",
      header: "Experience",
      sortable: true,
      render: (d) => <span className="font-tabular">{d.experienceYears} yrs</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (d) => <StatusBadge label={d.active === false ? "Inactive" : "Active"} />,
    },
    {
      key: "verification",
      header: "Verification",
      render: (d) => <StatusBadge label={verificationLabel(d.verificationStatus)} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (d) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setViewDoctor(d)}
            className="rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-primary/40 hover:bg-primary-light hover:text-primary-dark"
          >
            View
          </button>
          {canEdit && (
  <button
    onClick={() => setConfirmTarget(d)}
    className={`flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
      d.active === false
        ? "border-success/40 text-success hover:bg-success-light"
        : "border-accent/40 text-accent hover:bg-accent-light"
    }`}
  >
    <Power size={12} />
    {d.active === false ? "Activate" : "Deactivate"}
  </button>
)}
        </div>
      ),
    },
  ];

  return (
<div className="mx-auto max-w-6xl p-5 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Doctors</h1>
      <p className="mt-1 text-sm text-muted">Search, review and manage every doctor on Curo.</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchFilter
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name, specialty or city…"
            filterValue={statusFilter}
            onFilterChange={(v) => setStatusFilter(v as "" | "active" | "inactive")}
            filterOptions={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
            filterAllLabel="All statuses"
          />
        </div>
        <select
          value={verificationFilter}
          onChange={(e) => setVerificationFilter(e.target.value)}
          className="field sm:w-52"
        >
          <option value="">All verification states</option>
          {VERIFICATION_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        {error ? (
          <ErrorState description="Couldn't load doctors." onRetry={load} />
        ) : doctors === null ? (
          <LoadingState label="Loading doctors…" />
        ) : sorted.length === 0 ? (
          <EmptyState title="No doctors found" description="Try adjusting your search or filters." />
        ) : (
          <>
            <AdminTable
              columns={columns}
              rows={paged}
              rowKey={(d) => d.id}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
              onRowClick={(d) => setViewDoctor(d)}
            />
            <Pagination page={page} pageSize={PAGE_SIZE} total={sorted.length} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Doctor detail modal */}
      <AdminModal open={!!viewDoctor} onClose={() => setViewDoctor(null)} title="Doctor profile" maxWidth="max-w-lg">
        {viewDoctor && (
          <div>
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-1 ring-line">
                <Image src={viewDoctor.photo} alt={viewDoctor.name} fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-display text-base font-semibold text-ink">{viewDoctor.name}</p>
                  {viewDoctor.verified && <BadgeCheck size={15} className="shrink-0 text-primary" />}
                </div>
                <p className="truncate text-sm text-muted">
                  {viewDoctor.specialty} &middot; {viewDoctor.qualifications}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge label={viewDoctor.active === false ? "Inactive" : "Active"} />
              <StatusBadge label={verificationLabel(viewDoctor.verificationStatus)} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-5 text-sm">
              <div className="flex items-start gap-2">
                <Stethoscope size={15} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="text-xs text-faint">Experience</p>
                  <p className="text-ink">{viewDoctor.experienceYears} years</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-cyan-dark" />
                <div>
                  <p className="text-xs text-faint">Location</p>
                  <p className="text-ink">
                    {viewDoctor.clinicName}
                    {viewDoctor.locality ? `, ${viewDoctor.locality}` : ""}, {viewDoctor.city}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <IndianRupee size={15} className="mt-0.5 shrink-0 text-success" />
                <div>
                  <p className="text-xs text-faint">Consultation fee</p>
                  <p className="text-ink">₹{viewDoctor.consultationFee}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Globe2 size={15} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="text-xs text-faint">Languages</p>
                  <p className="text-ink">{viewDoctor.languages.join(", ")}</p>
                </div>
              </div>
              <div className="col-span-2 flex items-start gap-2">
                <CalendarClock size={15} className="mt-0.5 shrink-0 text-muted" />
                <div>
                  <p className="text-xs text-faint">Available days</p>
                  <p className="text-ink">{viewDoctor.availableDays.join(", ")}</p>
                </div>
              </div>
            </div>

            {viewDoctor.about && (
              <p className="mt-4 border-t border-line pt-4 text-sm text-muted">{viewDoctor.about}</p>
            )}

            {viewDoctor.verificationStatus === "rejected" && viewDoctor.rejectionReason && (
              <div className="mt-4 rounded-lg border border-accent/30 bg-accent-light/40 p-3 text-sm text-accent">
                <p className="font-medium">Rejection reason</p>
                <p className="mt-0.5">{viewDoctor.rejectionReason}</p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <Link
                href="/admin/doctor-verification"
                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark"
              >
                Go to verification review <ArrowRight size={12} />
              </Link>
             {canEdit && (
  <button
    onClick={() => setConfirmTarget(viewDoctor)}
    className={`btn-sm flex items-center gap-1.5 rounded-md border font-medium transition-colors ${
      viewDoctor.active === false
        ? "border-success/40 text-success hover:bg-success-light"
        : "border-accent/40 text-accent hover:bg-accent-light"
    }`}
  >
    <Power size={13} />
    {viewDoctor.active === false ? "Activate doctor" : "Deactivate doctor"}
  </button>
)}
            </div>
          </div>
        )}
      </AdminModal>

      {/* Activate / Deactivate confirmation */}
      <ConfirmActionModal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirmToggle}
        loading={confirmLoading}
        title={confirmTarget?.active === false ? "Activate doctor?" : "Deactivate doctor?"}
        description={
          confirmTarget?.active === false
            ? `${confirmTarget?.name} will be re-enabled and visible to patients again.`
            : `${confirmTarget?.name} will be disabled and hidden from new bookings until reactivated.`
        }
        confirmLabel={confirmTarget?.active === false ? "Activate" : "Deactivate"}
        variant={confirmTarget?.active === false ? "primary" : "danger"}
      />
    </div>
  );
}