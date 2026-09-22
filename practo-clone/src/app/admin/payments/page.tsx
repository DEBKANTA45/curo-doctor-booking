"use client";

import { useEffect, useMemo, useState } from "react";
import { UserRound, Stethoscope, Clock, CreditCard, History } from "lucide-react";
import { getAppointments } from "@/lib/mock-db";
import { getConsultationType, getPaymentMethodLabel, getPaymentStatus, PaymentStatus } from "@/lib/consultation";
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
  { label: "Paid", value: "paid" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
];

function statusLabel(status: PaymentStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function AdminPaymentsPage() {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
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
  }, [search, statusFilter, doctorFilter, dateFilter]);

  const doctorOptions = useMemo(() => {
    if (!appointments) return [];
    return Array.from(new Set(appointments.map((a) => a.doctorName))).sort();
  }, [appointments]);

  const filtered = useMemo(() => {
    if (!appointments) return [];
    const term = search.trim().toLowerCase();
    return appointments.filter((a) => {
      const matchesSearch =
        !term || a.doctorName.toLowerCase().includes(term) || a.patientName.toLowerCase().includes(term);
      const matchesStatus = !statusFilter || getPaymentStatus(a) === statusFilter;
      const matchesDoctor = !doctorFilter || a.doctorName === doctorFilter;
      const matchesDate = !dateFilter || a.date === dateFilter;
      return matchesSearch && matchesStatus && matchesDoctor && matchesDate;
    });
  }, [appointments, search, statusFilter, doctorFilter, dateFilter]);

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
      render: (a) => <span className="text-sm text-ink">{a.doctorName}</span>,
    },
    {
      key: "date",
      header: "Date",
      render: (a) => <span className="text-sm text-muted">{a.date}</span>,
    },
    {
      key: "fee",
      header: "Amount",
      render: (a) => <span className="font-tabular text-ink">₹{a.fee}</span>,
    },
    {
      key: "method",
      header: "Method",
      render: (a) => <span className="text-sm text-muted">{getPaymentMethodLabel(a) ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (a) => <StatusBadge label={statusLabel(getPaymentStatus(a))} />,
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
      <h1 className="font-display text-2xl font-semibold text-ink">Payments</h1>
      <p className="mt-1 text-sm text-muted">Every transaction collected at booking, across the platform.</p>

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
        <select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)} className="field lg:w-52">
          <option value="">All doctors</option>
          {doctorOptions.map((name) => (
            <option key={name} value={name}>
              {name}
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
          <ErrorState description="Couldn't load payments." onRetry={load} />
        ) : appointments === null ? (
          <LoadingState label="Loading payments…" />
        ) : sorted.length === 0 ? (
          <EmptyState title="No payments found" description="Try adjusting your search or filters." />
        ) : (
          <>
            <AdminTable columns={columns} rows={paged} rowKey={(a) => a.id} onRowClick={(a) => setViewAppt(a)} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={sorted.length} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Transaction detail modal */}
      <AdminModal open={!!viewAppt} onClose={() => setViewAppt(null)} title="Transaction details" maxWidth="max-w-lg">
        {viewAppt && (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={statusLabel(getPaymentStatus(viewAppt))} />
              <StatusBadge label={getConsultationType(viewAppt) === "online" ? "Online" : "In-person"} />
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
                  <p className="text-xs text-faint">Appointment date</p>
                  <p className="text-ink">
                    {viewAppt.date} · {viewAppt.time}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CreditCard size={15} className="mt-0.5 shrink-0 text-success" />
                <div>
                  <p className="text-xs text-faint">Amount &amp; method</p>
                  <p className="text-ink">
                    ₹{viewAppt.fee} {getPaymentMethodLabel(viewAppt) ? `· ${getPaymentMethodLabel(viewAppt)}` : ""}
                  </p>
                </div>
              </div>
            </div>

            {getPaymentStatus(viewAppt) === "refunded" && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-accent/30 bg-accent-light/40 p-3 text-sm text-accent">
                <History size={15} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Refund information</p>
                  <p className="mt-0.5">
                    ₹{viewAppt.fee} refunded following cancellation
                    {viewAppt.cancelledBy ? ` by the ${viewAppt.cancelledBy}` : ""}.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  );
}