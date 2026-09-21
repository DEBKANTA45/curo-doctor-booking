"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Stethoscope,
  UserRound,
  Clock,
  IndianRupee,
  CreditCard,
  FileText,
  History,
  XCircle,
} from "lucide-react";
import { getAppointments } from "@/lib/mock-db";
import { getConsultationType, getPaymentMethodLabel, getAdminAppointmentStatus, AdminAppointmentStatus } from "@/lib/consultation";
import type { Appointment } from "@/lib/types";
import AdminTable, { AdminTableColumn } from "@/components/admin/AdminTable";
import SearchFilter from "@/components/admin/SearchFilter";
import Pagination from "@/components/admin/Pagination";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminModal from "@/components/admin/AdminModal";
import LoadingState from "@/components/admin/LoadingState";
import EmptyState from "@/components/admin/EmptyState";
import ErrorState from "@/components/admin/ErrorState";

const PAGE_SIZE = 8;

const STATUS_FILTER_OPTIONS = [
  { label: "Confirmed", value: "confirmed" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Rescheduled", value: "rescheduled" },
];

const TYPE_FILTER_OPTIONS = [
  { label: "Online", value: "online" },
  { label: "In-person", value: "in-person" },
];

function statusLabel(status: AdminAppointmentStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [error, setError] = useState(false);
  const [now] = useState(() => new Date());

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);

  const [viewAppt, setViewAppt] = useState<Appointment | null>(null);

  function load() {
    setAppointments(null);
    setError(false);
    setTimeout(() => {
      try {
        setAppointments(getAppointments());
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
  }, [search, statusFilter, typeFilter, dateFilter]);

  const filtered = useMemo(() => {
    if (!appointments) return [];
    const term = search.trim().toLowerCase();
    return appointments.filter((a) => {
      const matchesSearch =
        !term || a.doctorName.toLowerCase().includes(term) || a.patientName.toLowerCase().includes(term);
      const matchesStatus = !statusFilter || getAdminAppointmentStatus(a, now) === statusFilter;
      const matchesType = !typeFilter || getConsultationType(a) === typeFilter;
      const matchesDate = !dateFilter || a.date === dateFilter;
      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });
  }, [appointments, search, statusFilter, typeFilter, dateFilter, now]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [filtered]
  );
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: AdminTableColumn<Appointment>[] = [
    {
      key: "patientName",
      header: "Patient",
      render: (a) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{a.patientName}</p>
          <p className="truncate text-xs text-muted">{a.patientEmail}</p>
        </div>
      ),
    },
    {
      key: "doctorName",
      header: "Doctor",
      render: (a) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-ink">{a.doctorName}</p>
          <p className="truncate text-xs text-muted">{a.doctorSpecialty}</p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date & time",
      render: (a) => (
        <span className="text-sm text-muted">
          {a.date} · {a.time}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (a) => <StatusBadge label={getConsultationType(a) === "online" ? "Online" : "In-person"} />,
    },
    {
      key: "status",
      header: "Status",
      render: (a) => <StatusBadge label={statusLabel(getAdminAppointmentStatus(a, now))} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (a) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setViewAppt(a)}
            className="rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-primary/40 hover:bg-primary-light hover:text-primary-dark"
          >
            View
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-5 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Appointments</h1>
      <p className="mt-1 text-sm text-muted">Every appointment booked on Curo, across every doctor and patient.</p>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <SearchFilter
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by doctor or patient name…"
            filterValue={statusFilter}
            onFilterChange={setStatusFilter}
            filterOptions={STATUS_FILTER_OPTIONS}
            filterAllLabel="All statuses"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="field lg:w-44">
          <option value="">Online & In-person</option>
          {TYPE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
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
          <ErrorState description="Couldn't load appointments." onRetry={load} />
        ) : appointments === null ? (
          <LoadingState label="Loading appointments…" />
        ) : sorted.length === 0 ? (
          <EmptyState title="No appointments found" description="Try adjusting your search or filters." />
        ) : (
          <>
            <AdminTable columns={columns} rows={paged} rowKey={(a) => a.id} onRowClick={(a) => setViewAppt(a)} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={sorted.length} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Appointment detail modal */}
      <AdminModal open={!!viewAppt} onClose={() => setViewAppt(null)} title="Appointment details" maxWidth="max-w-lg">
        {viewAppt && (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={getConsultationType(viewAppt) === "online" ? "Online" : "In-person"} />
              <StatusBadge label={statusLabel(getAdminAppointmentStatus(viewAppt, now))} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
              <div className="flex items-start gap-2">
                <UserRound size={15} className="mt-0.5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs text-faint">Patient</p>
                  <p className="truncate text-ink">{viewAppt.patientName}</p>
                  <p className="truncate text-xs text-muted">{viewAppt.patientEmail}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Stethoscope size={15} className="mt-0.5 shrink-0 text-cyan-dark" />
                <div className="min-w-0">
                  <p className="text-xs text-faint">Doctor</p>
                  <p className="truncate text-ink">{viewAppt.doctorName}</p>
                  <p className="truncate text-xs text-muted">{viewAppt.doctorSpecialty}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock size={15} className="mt-0.5 shrink-0 text-muted" />
                <div>
                  <p className="text-xs text-faint">Date & time</p>
                  <p className="text-ink">
                    {viewAppt.date} · {viewAppt.time}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <IndianRupee size={15} className="mt-0.5 shrink-0 text-success" />
                <div>
                  <p className="text-xs text-faint">Fee</p>
                  <p className="text-ink">₹{viewAppt.fee}</p>
                </div>
              </div>
              {getPaymentMethodLabel(viewAppt) && (
                <div className="flex items-start gap-2">
                  <CreditCard size={15} className="mt-0.5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-faint">Payment method</p>
                    <p className="text-ink">{getPaymentMethodLabel(viewAppt)}</p>
                  </div>
                </div>
              )}
              {viewAppt.reason && (
                <div className="col-span-2 flex items-start gap-2">
                  <FileText size={15} className="mt-0.5 shrink-0 text-muted" />
                  <div>
                    <p className="text-xs text-faint">Reason for visit</p>
                    <p className="text-ink">{viewAppt.reason}</p>
                  </div>
                </div>
              )}
            </div>

            {viewAppt.rescheduledFrom && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-cyan/30 bg-cyan-light/40 p-3 text-sm text-cyan-dark">
                <History size={15} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Rescheduled</p>
                  <p className="mt-0.5">
                    Moved from {viewAppt.rescheduledFrom} to {viewAppt.date}.
                  </p>
                </div>
              </div>
            )}

            {viewAppt.status === "cancelled" && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-accent/30 bg-accent-light/40 p-3 text-sm text-accent">
                <XCircle size={15} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Cancelled</p>
                  <p className="mt-0.5">
                    {viewAppt.cancelledBy
                      ? `Cancelled by the ${viewAppt.cancelledBy}.`
                      : "Cancellation source not recorded."}
                  </p>
                </div>
              </div>
            )}

            {viewAppt.status === "completed" && (viewAppt.diagnosis || viewAppt.report || viewAppt.medicines) && (
              <div className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">Consultation notes</p>
                {viewAppt.diagnosis && (
                  <p className="text-muted">
                    <span className="text-faint">Diagnosis:</span> {viewAppt.diagnosis}
                  </p>
                )}
                {viewAppt.report && (
                  <p className="text-muted">
                    <span className="text-faint">Notes:</span> {viewAppt.report}
                  </p>
                )}
                {viewAppt.medicines && (
                  <p className="text-muted">
                    <span className="text-faint">Prescribed:</span> {viewAppt.medicines}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  );
}