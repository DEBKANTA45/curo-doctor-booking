"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileBarChart,
  Download,
  FileSpreadsheet,
  FileText as FileTextIcon,
  IndianRupee,
  CalendarCheck2,
  Search,
} from "lucide-react";
import { getAppointments } from "@/lib/mock-db";
import {
  getConsultationType,
  getAdminAppointmentStatus,
  getPaymentStatus,
  getPaymentMethodLabel,
  AdminAppointmentStatus,
  PaymentStatus,
} from "@/lib/consultation";
import {
  filterAppointmentsForReport,
  filterAppointmentsForPaymentReport,
  downloadCsv,
  downloadExcel,
  downloadPdfTable,
  ReportColumn,
} from "@/lib/admin-reports";
import type { Appointment } from "@/lib/types";
import AdminTable, { AdminTableColumn } from "@/components/admin/AdminTable";
import Pagination from "@/components/admin/Pagination";
import StatusBadge from "@/components/admin/StatusBadge";
import LoadingState from "@/components/admin/LoadingState";
import EmptyState from "@/components/admin/EmptyState";
import ErrorState from "@/components/admin/ErrorState";
import { useAdminAuth } from "@/context/AdminAuthContext";



const PAGE_SIZE = 8;

type Category = "appointments" | "payments";

const APPOINTMENT_STATUS_OPTIONS = [
  { label: "Confirmed", value: "confirmed" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Rescheduled", value: "rescheduled" },
];

const PAYMENT_STATUS_OPTIONS = [
  { label: "Paid", value: "paid" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
];

const TYPE_OPTIONS = [
  { label: "Online", value: "online" },
  { label: "In-person", value: "in-person" },
];

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatINR(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function firstOfThisMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

const QUICK_RANGES: { label: string; getStart: () => string }[] = [
  { label: "Today", getStart: todayIso },
  { label: "Last 7 days", getStart: () => isoDaysAgo(7) },
  { label: "Last 30 days", getStart: () => isoDaysAgo(30) },
  { label: "This month", getStart: firstOfThisMonth },
];

export default function AdminReportsPage() {
const { can } = useAdminAuth();
const canExport = can("reports", "create");
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [error, setError] = useState(false);
  const [now] = useState(() => new Date());

  const [category, setCategory] = useState<Category>("appointments");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [dateError, setDateError] = useState("");
  const [page, setPage] = useState(1);

  function load() {
    setAppointments(null);
    setError(false);
    setTimeout(() => {
      try {
        setAppointments(getAppointments());
      } catch {
        setError(true);
      }
    }, 300);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [category, search, startDate, endDate, status, type]);

  useEffect(() => {
    setStatus("");
  }, [category]);

  useEffect(() => {
    setDateError(startDate && endDate && startDate > endDate ? "\"From\" date is after \"To\" date." : "");
  }, [startDate, endDate]);

  const applyQuickRange = (getStart: () => string) => {
    setStartDate(getStart());
    setEndDate(todayIso());
  };

  const clearRange = () => {
    setStartDate("");
    setEndDate("");
  };

  const filteredByCategory = useMemo(() => {
    if (!appointments || dateError) return [];
    if (category === "appointments") {
      return filterAppointmentsForReport(
        appointments,
        {
          startDate,
          endDate,
          status: status as AdminAppointmentStatus | "",
          type: type as "online" | "in-person" | "",
        },
        now
      );
    }
    return filterAppointmentsForPaymentReport(appointments, {
      startDate,
      endDate,
      status: status as PaymentStatus | "",
    });
  }, [appointments, category, startDate, endDate, status, type, now, dateError]);

  const filteredReportRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return filteredByCategory;
    return filteredByCategory.filter(
      (a) => a.patientName.toLowerCase().includes(term) || a.doctorName.toLowerCase().includes(term)
    );
  }, [filteredByCategory, search]);

  const sorted = useMemo(
    () => [...filteredReportRows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [filteredReportRows]
  );
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const summary = useMemo(() => {
    if (category === "appointments") {
    const completed = filteredReportRows.filter(
  (a) => getAdminAppointmentStatus(a, now) === "completed"
).length;
     const cancelled = filteredReportRows.filter(
  (a) => getAdminAppointmentStatus(a, now) === "cancelled"
).length;
      const online = filteredReportRows.filter((a) => getConsultationType(a) === "online").length;
      return [
        { label: "Total appointments", value: filteredReportRows.length },
        { label: "Completed", value: completed },
        { label: "Cancelled", value: cancelled },
        { label: "Online", value: online },
      ];
    }
    const total = filteredReportRows.reduce((sum, a) => sum + a.fee, 0);
    const paid = filteredReportRows.filter((a) => getPaymentStatus(a) === "paid");
    const paidAmount = paid.reduce((sum, a) => sum + a.fee, 0);
    return [
      { label: "Transactions", value: filteredReportRows.length },
      { label: "Total amount", value: formatINR(total) },
      { label: "Paid transactions", value: paid.length },
      { label: "Amount collected", value: formatINR(paidAmount) },
    ];
 }, [filteredReportRows, category, now]);

  const appointmentColumns: AdminTableColumn<Appointment>[] = [
    { key: "patientName", header: "Patient", render: (a) => <span className="text-sm text-ink">{a.patientName}</span> },
    { key: "doctorName", header: "Doctor", render: (a) => <span className="text-sm text-ink">{a.doctorName}</span> },
    { key: "date", header: "Date & time", render: (a) => <span className="text-sm text-muted">{a.date} · {a.time}</span> },
    { key: "type", header: "Type", render: (a) => <StatusBadge label={getConsultationType(a) === "online" ? "Online" : "In-person"} /> },
    { key: "status", header: "Status", render: (a) => <StatusBadge label={statusLabel(getAdminAppointmentStatus(a, now))} /> },
    { key: "fee", header: "Fee", render: (a) => <span className="font-tabular text-ink">{formatINR(a.fee)}</span> },
  ];

  const paymentColumns: AdminTableColumn<Appointment>[] = [
    { key: "patientName", header: "Patient", render: (a) => <span className="text-sm text-ink">{a.patientName}</span> },
    { key: "doctorName", header: "Doctor", render: (a) => <span className="text-sm text-ink">{a.doctorName}</span> },
    { key: "date", header: "Date", render: (a) => <span className="text-sm text-muted">{a.date}</span> },
    { key: "fee", header: "Amount", render: (a) => <span className="font-tabular text-ink">{formatINR(a.fee)}</span> },
    { key: "method", header: "Method", render: (a) => <span className="text-sm text-muted">{getPaymentMethodLabel(a) ?? "—"}</span> },
    { key: "status", header: "Status", render: (a) => <StatusBadge label={statusLabel(getPaymentStatus(a))} /> },
  ];

  const exportColumns: ReportColumn[] =
    category === "appointments"
      ? [
          { header: "Patient", value: (a: Appointment) => a.patientName },
          { header: "Doctor", value: (a: Appointment) => a.doctorName },
          { header: "Date", value: (a: Appointment) => a.date },
          { header: "Time", value: (a: Appointment) => a.time },
          { header: "Type", value: (a: Appointment) => (getConsultationType(a) === "online" ? "Online" : "In-person") },
          { header: "Status", value: (a: Appointment) => statusLabel(getAdminAppointmentStatus(a, now)) },
          { header: "Fee", value: (a: Appointment) => String(a.fee) },
        ]
      : [
          { header: "Patient", value: (a: Appointment) => a.patientName },
          { header: "Doctor", value: (a: Appointment) => a.doctorName },
          { header: "Date", value: (a: Appointment) => a.date },
          { header: "Amount", value: (a: Appointment) => String(a.fee) },
          { header: "Method", value: (a: Appointment) => getPaymentMethodLabel(a) ?? "—" },
          { header: "Status", value: (a: Appointment) => statusLabel(getPaymentStatus(a)) },
        ];

  const filenameBase = `curo-${category}-report-${new Date().toISOString().slice(0, 10)}`;

  const handleExportCsv = () => downloadCsv(`${filenameBase}.csv`, exportColumns, sorted);
  const handleExportExcel = () =>
    downloadExcel(`${filenameBase}.xlsx`, category === "appointments" ? "Appointments" : "Payments", exportColumns, sorted);
  const handleExportPdf = () =>
    downloadPdfTable(
      category === "appointments" ? "Appointments report" : "Payments report",
      `${startDate || "All time"} — ${endDate || "Present"}`,
      exportColumns,
      sorted,
      `${filenameBase}.pdf`
    );

  return (
    <div className="p-5 sm:p-8">
       <h1 className="font-display text-2xl font-semibold text-ink">
      Generate reports
    </h1>
      <p className="mt-1 text-sm text-muted">Filter platform data by date, type, and status, then export it.</p>

      <div className="mt-3 inline-flex items-center gap-1 rounded-md border border-line bg-bg p-1">
        <button
          onClick={() => setCategory("appointments")}
          className={`flex items-center gap-1.5 rounded-[6px] px-3.5 py-1.5 text-sm font-medium transition-colors ${
            category === "appointments" ? "bg-blue-500 text-white shadow-card" : "text-muted hover:text-ink"
          }`}
        >
          <CalendarCheck2 size={14} /> Appointments
        </button>
        <button
          onClick={() => setCategory("payments")}
          className={`flex items-center gap-1.5 rounded-[6px] px-3.5 py-1.5 text-sm font-medium transition-colors ${
            category === "payments" ? "bg-blue-500 text-white shadow-card" : "text-muted hover:text-ink"
          }`}
        >
          <IndianRupee size={14} /> Payments
        </button>
      </div>

            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end">
        {/* Search */}
        <div className="w-full lg:w-72 xl:w-80">
          <label className="mb-1 block text-xs font-medium text-muted lg:sr-only">
            Search
          </label>
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient or doctor…"
              className="field w-full pl-9"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:flex-1 lg:flex-wrap">
          {/* From */}
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium text-muted">
              From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="field w-full sm:w-40"
            />
          </div>

          {/* To */}
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium text-muted">
              To
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="field w-full sm:w-40"
            />
          </div>

          {/* Status */}
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium text-muted">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="field w-full sm:w-44"
            >
              <option value="">All statuses</option>
              {(category === "appointments"
                ? APPOINTMENT_STATUS_OPTIONS
                : PAYMENT_STATUS_OPTIONS
              ).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          {category === "appointments" && (
            <div className="min-w-0">
              <label className="mb-1 block text-xs font-medium text-muted">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="field w-full sm:w-40"
              >
                <option value="">Online & In-person</option>
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Quick date ranges */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {QUICK_RANGES.map((r) => (
          <button
            key={r.label}
            onClick={() => applyQuickRange(r.getStart)}
            className="rounded-full border border-line px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-primary/40 hover:bg-primary-light hover:text-primary-dark"
          >
            {r.label}
          </button>
        ))}

        {(startDate || endDate) && (
          <button
            onClick={clearRange}
            className="rounded-full border border-line px-3 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent-light"
          >
            Clear range
          </button>
        )}
      </div>

      {dateError && <p className="mt-2 text-xs font-medium text-accent">{dateError}</p>}

      {error ? (
        <div className="mt-6">
          <ErrorState description="Couldn't load report data." onRetry={load} />
        </div>
      ) : appointments === null ? (
        <div className="mt-6">
          <LoadingState label="Loading report data…" />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summary.map((s) => (
              <div key={s.label} className="card card-hover p-5">
                <p className="text-xs font-semibold text-muted">{s.label}</p>
                <p className="mt-1.5 font-tabular text-2xl font-semibold text-ink">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {sorted.length} record{sorted.length !== 1 ? "s" : ""} match these filters
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleExportCsv}
                disabled={sorted.length === 0 || !canExport}
                title={!canExport ? "You don't have permission to export reports" : undefined}
                className="btn-secondary btn-sm flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={13} /> CSV
              </button>
              <button
                onClick={handleExportExcel}
                disabled={sorted.length === 0 || !canExport}
                title={!canExport ? "You don't have permission to export reports" : undefined}
                className="btn-secondary btn-sm flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileSpreadsheet size={13} /> Excel
              </button>
              <button
                onClick={handleExportPdf}
                disabled={sorted.length === 0 || !canExport}
                title={!canExport ? "You don't have permission to export reports" : undefined}
                className="btn-secondary btn-sm flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileTextIcon size={13} /> PDF
              </button>
            </div>
          </div>

          <div className="mt-3">
            {sorted.length === 0 ? (
              <EmptyState title="No records found" description="Try adjusting your filters." />
            ) : (
              <>
                <AdminTable
                  columns={category === "appointments" ? appointmentColumns : paymentColumns}
                  rows={paged}
                  rowKey={(a) => a.id}
                />
                <Pagination page={page} pageSize={PAGE_SIZE} total={sorted.length} onPageChange={setPage} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}