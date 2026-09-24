"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, Phone, CalendarClock, Power, Stethoscope } from "lucide-react";
import { getAllPatientsForAdmin, setPatientActive, getAppointmentsForPatient, AdminPatientView } from "@/lib/mock-db";
import { getConsultationType } from "@/lib/consultation";
import type { Appointment } from "@/lib/types";
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

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminPatientsPage() {
const { can } = useAdminAuth();
const canEdit = can("patients", "edit");
  const [patients, setPatients] = useState<AdminPatientView[] | null>(null);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");
  const [page, setPage] = useState(1);

  const [viewPatient, setViewPatient] = useState<AdminPatientView | null>(null);
  const [history, setHistory] = useState<Appointment[]>([]);
  const [confirmTarget, setConfirmTarget] = useState<AdminPatientView | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  function load() {
    setPatients(null);
    setError(false);
    setTimeout(() => {
      try {
        setPatients(getAllPatientsForAdmin());
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
    if (!patients) return [];
    const term = search.trim().toLowerCase();
    return patients.filter((p) => {
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        p.phone.toLowerCase().includes(term);
      const matchesStatus = !statusFilter || (statusFilter === "active" ? p.active : !p.active);
      return matchesSearch && matchesStatus;
    });
  }, [patients, search, statusFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => a.name.localeCompare(b.name)), [filtered]);
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openPatient(p: AdminPatientView) {
    setViewPatient(p);
    setHistory(getAppointmentsForPatient(p.email));
  }

  function handleConfirmToggle() {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    const nextActive = !confirmTarget.active;
    setTimeout(() => {
      setPatientActive(confirmTarget.email, nextActive);
      setPatients((prev) =>
        prev ? prev.map((p) => (p.email === confirmTarget.email ? { ...p, active: nextActive } : p)) : prev
      );
      setViewPatient((prev) => (prev && prev.email === confirmTarget.email ? { ...prev, active: nextActive } : prev));
      setConfirmLoading(false);
      setConfirmTarget(null);
    }, 300);
  }

  const columns: AdminTableColumn<AdminPatientView>[] = [
    {
      key: "name",
      header: "Patient",
      render: (p) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-medium text-white">
            {p.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{p.name}</p>
            <p className="truncate text-xs text-muted">{p.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (p) => <span className="text-sm text-muted">{p.phone || "—"}</span>,
    },
    {
      key: "appointmentCount",
      header: "Appointments",
      render: (p) => <span className="font-tabular">{p.appointmentCount}</span>,
    },
    {
      key: "lastVisitAt",
      header: "Last visit",
      render: (p) => <span className="text-sm text-muted">{formatDate(p.lastVisitAt)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <StatusBadge label={p.active ? "Active" : "Inactive"} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (p) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openPatient(p)}
            className="rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-primary/40 hover:bg-primary-light hover:text-primary-dark"
          >
            View
          </button>
         {canEdit && (
  <button
    onClick={() => setConfirmTarget(p)}
    className={`flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
      !p.active
        ? "border-success/40 text-success hover:bg-success-light"
        : "border-accent/40 text-accent hover:bg-accent-light"
    }`}
  >
    <Power size={12} />
    {!p.active ? "Activate" : "Deactivate"}
  </button>
)}
        </div>
      ),
    },
  ];

  return (
    <div className="p-5 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Patients</h1>
      <p className="mt-1 text-sm text-muted">Search, review and manage every patient account on Curo.</p>

      <div className="mt-6">
        <SearchFilter
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, email or phone…"
          filterValue={statusFilter}
          onFilterChange={(v) => setStatusFilter(v as "" | "active" | "inactive")}
          filterOptions={[
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ]}
          filterAllLabel="All statuses"
        />
      </div>

      <div className="mt-5">
        {error ? (
          <ErrorState description="Couldn't load patients." onRetry={load} />
        ) : patients === null ? (
          <LoadingState label="Loading patients…" />
        ) : sorted.length === 0 ? (
          <EmptyState title="No patients found" description="Try adjusting your search or filters." />
        ) : (
          <>
            <AdminTable columns={columns} rows={paged} rowKey={(p) => p.email} onRowClick={openPatient} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={sorted.length} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Patient detail modal */}
      <AdminModal open={!!viewPatient} onClose={() => setViewPatient(null)} title="Patient profile" maxWidth="max-w-lg">
        {viewPatient && (
          <div>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-lg font-medium text-white">
                {viewPatient.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-base font-semibold text-ink">{viewPatient.name}</p>
                <p className="flex items-center gap-1.5 truncate text-sm text-muted">
                  <Mail size={13} className="shrink-0" /> {viewPatient.email}
                </p>
                <p className="flex items-center gap-1.5 truncate text-sm text-muted">
                  <Phone size={13} className="shrink-0" /> {viewPatient.phone || "—"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <StatusBadge label={viewPatient.active ? "Active" : "Inactive"} />
            </div>

            <div className="mt-5 border-t border-line pt-4">
              <p className="mb-2.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                <CalendarClock size={15} className="text-primary" /> Appointment history ({history.length})
              </p>
              {history.length === 0 ? (
                <p className="text-sm text-muted">No appointments yet.</p>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {history.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg p-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink">
                          <Stethoscope size={13} className="shrink-0 text-primary" /> {a.doctorName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {a.date} · {a.time} · {getConsultationType(a) === "online" ? "Online" : "In-clinic"}
                        </p>
                      </div>
                      <StatusBadge
                        label={a.status === "upcoming" ? "Confirmed" : a.status === "completed" ? "Completed" : "Cancelled"}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end border-t border-line pt-5">
             {canEdit && (
  <button
    onClick={() => setConfirmTarget(viewPatient)}
    className={`btn-sm flex items-center gap-1.5 rounded-md border font-medium transition-colors ${
      !viewPatient.active
        ? "border-success/40 text-success hover:bg-success-light"
        : "border-accent/40 text-accent hover:bg-accent-light"
    }`}
  >
    <Power size={13} />
    {!viewPatient.active ? "Activate patient" : "Deactivate patient"}
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
        title={!confirmTarget?.active ? "Activate patient?" : "Deactivate patient?"}
        description={
          !confirmTarget?.active
            ? `${confirmTarget?.name} will be re-enabled and able to log in and book appointments again.`
            : `${confirmTarget?.name} will be disabled and won't be able to log in or book new appointments.`
        }
        confirmLabel={!confirmTarget?.active ? "Activate" : "Deactivate"}
        variant={!confirmTarget?.active ? "primary" : "danger"}
      />
    </div>
  );
}