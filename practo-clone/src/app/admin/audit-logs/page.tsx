"use client";

import { useEffect, useMemo, useState } from "react";
import { Stethoscope, UserRound, Star, Bell, Clock, ShieldCheck, KeyRound, Settings } from "lucide-react";
import { getAuditLogs, AuditLogEntry, AuditEntityType } from "@/lib/mock-db";
import AdminTable, { AdminTableColumn } from "@/components/admin/AdminTable";
// import SearchFilter from "@/components/admin/SearchFilter";
import Pagination from "@/components/admin/Pagination";
import LoadingState from "@/components/admin/LoadingState";
import EmptyState from "@/components/admin/EmptyState";
import ErrorState from "@/components/admin/ErrorState";

const PAGE_SIZE = 10;

const ENTITY_FILTER_OPTIONS = [
  { label: "Doctors", value: "doctor" },
  { label: "Patients", value: "patient" },
  { label: "Reviews", value: "review" },
  { label: "Notifications", value: "notification" },
   { label: "Admin users", value: "admin" },
  { label: "Roles", value: "role" },
  { label: "Settings", value: "settings" },
];

const ENTITY_ICON: Record<AuditEntityType, typeof Stethoscope> = {
  doctor: Stethoscope,
  patient: UserRound,
  review: Star,
  notification: Bell,
  admin: ShieldCheck,
  role: KeyRound,
  settings: Settings,
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[] | null>(null);
  const [error, setError] = useState(false);

const [search, setSearch] = useState("");
const [entityFilter, setEntityFilter] = useState("");
const [actionFilter, setActionFilter] = useState("");
const [userFilter, setUserFilter] = useState("");
const [dateFilter, setDateFilter] = useState("");
const [page, setPage] = useState(1);

  function load() {
    setLogs(null);
    setError(false);
    setTimeout(() => {
      try {
        setLogs(getAuditLogs());
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
}, [search, entityFilter, actionFilter, userFilter, dateFilter]);

  const userFilterOptions = useMemo(() => {
  if (!logs) return [];

  const users = new Map<string, string>();

  logs.forEach((log) => {
    users.set(log.actorEmail, log.actorName);
  });

  return Array.from(users.entries())
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([email, name]) => ({
      label: `${name} (${email})`,
      value: email,
    }));
}, [logs]);

const actionFilterOptions = useMemo(() => {
  if (!logs) return [];

  return Array.from(new Set(logs.map((log) => log.action))).sort(
    (a, b) => a.localeCompare(b)
  );
}, [logs]);

  const filtered = useMemo(() => {
  if (!logs) return [];

  const term = search.trim().toLowerCase();

  return logs.filter((l) => {
    const matchesSearch =
      !term ||
      l.action.toLowerCase().includes(term) ||
      l.entityLabel.toLowerCase().includes(term) ||
      l.actorName.toLowerCase().includes(term) ||
      l.actorEmail.toLowerCase().includes(term);

    const matchesEntity =
      !entityFilter || l.entityType === entityFilter;

    const matchesAction =
      !actionFilter || l.action === actionFilter;

    const matchesUser =
      !userFilter || l.actorEmail === userFilter;

    const matchesDate =
      !dateFilter || l.createdAt.slice(0, 10) === dateFilter;

    return (
      matchesSearch &&
      matchesEntity &&
      matchesAction &&
      matchesUser &&
      matchesDate
    );
  });
}, [
  logs,
  search,
  entityFilter,
  actionFilter,
  userFilter,
  dateFilter,
]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: AdminTableColumn<AuditLogEntry>[] = [
    {
      key: "actorName",
      header: "Admin / User",
      render: (l) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-medium text-white">
            {l.actorName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{l.actorName}</p>
            <p className="truncate text-xs text-muted">{l.actorEmail}</p>
          </div>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action performed",
      render: (l) => <span className="text-sm text-ink">{l.action}</span>,
    },
    {
      key: "entityLabel",
      header: "Affected entity",
      render: (l) => {
        const Icon = ENTITY_ICON[l.entityType];
        return (
          <span className="flex items-center gap-1.5 text-sm text-muted">
            <Icon size={13} className="shrink-0 text-faint" />
            <span className="truncate">{l.entityLabel}</span>
          </span>
        );
      },
    },
    {
      key: "createdAt",
      header: "Date & time",
      render: (l) => (
        <span className="flex items-center gap-1.5 text-sm text-muted">
          <Clock size={13} className="shrink-0 text-faint" />
          {formatDateTime(l.createdAt)}
        </span>
      ),
    },
  ];

  return (
  <div className="p-5 sm:p-8">
    <h1 className="font-display text-2xl font-semibold text-ink">
      Audit Logs
    </h1>

    <p className="mt-1 text-sm text-muted">
      Every important action taken in the Admin Portal, in order.
    </p>

    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      {/* Search */}
      <div className="sm:col-span-2 lg:col-span-2">
        <label className="mb-1 block text-xs font-medium text-muted">
          Search
        </label>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search action, entity, admin or email…"
          className="field w-full"
        />
      </div>

      {/* User */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">
          User
        </label>

        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="field w-full"
        >
          <option value="">All users</option>

          {userFilterOptions.map((user) => (
            <option key={user.value} value={user.value}>
              {user.label}
            </option>
          ))}
        </select>
      </div>

      {/* Action */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">
          Action
        </label>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="field w-full"
        >
          <option value="">All actions</option>

          {actionFilterOptions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">
          Date
        </label>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="field w-full"
        />
      </div>

      {/* Entity */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">
          Entity
        </label>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="field w-full"
        >
          <option value="">All entities</option>

          {ENTITY_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="mt-5">
      {error ? (
        <ErrorState
          description="Couldn't load audit logs."
          onRetry={load}
        />
      ) : logs === null ? (
        <LoadingState label="Loading audit logs…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description="Admin actions like approving doctors or deactivating accounts will show up here."
        />
      ) : (
        <>
          <AdminTable
            columns={columns}
            rows={paged}
            rowKey={(l) => l.id}
          />

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  </div>
);
}