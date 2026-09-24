"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { UserPlus, Pencil, Power, Mail, Phone, Clock, CalendarClock } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  AdminRole,
  AdminUser,
  MIN_PASSWORD_LENGTH,
  createAdminUser,
  getAdminUsers,
  getRoles,
  setAdminActive,
  updateAdminUser,
} from "@/lib/admin-users";
import { MODULES, RoleId } from "@/lib/admin-permissions";
import { logAdminAction } from "@/lib/mock-db";
import AdminTable, { AdminTableColumn } from "@/components/admin/AdminTable";
import SearchFilter from "@/components/admin/SearchFilter";
import Pagination from "@/components/admin/Pagination";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminModal from "@/components/admin/AdminModal";
import ConfirmActionModal from "@/components/admin/ConfirmActionModal";
import LoadingState from "@/components/admin/LoadingState";
import EmptyState from "@/components/admin/EmptyState";
import ErrorState from "@/components/admin/ErrorState";

const PAGE_SIZE = 8;

const STATUS_FILTER_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const ROLE_VARIANT: Record<RoleId, "primary" | "cyan" | "faint"> = {
  "super-admin": "primary",
  admin: "cyan",
  support: "faint",
};

type FormState = { name: string; email: string; phone: string; roleId: RoleId; password: string };

// New admins default to the least-privileged role.
const EMPTY_FORM: FormState = { name: "", email: "", phone: "", roleId: "support", password: "" };

const EMAIL_RE = /^\S+@\S+\.\S+$/;

function formatDateTime(iso?: string | null) {
  if (!iso) return "Never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminUsersPage() {
  const { admin, can, refresh } = useAdminAuth();
  const canCreate = can("admin-users", "create");
  const canEdit = can("admin-users", "edit");
  const canDelete = can("admin-users", "delete");

  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");
  const [page, setPage] = useState(1);

  const [viewUser, setViewUser] = useState<AdminUser | null>(null);

  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmRoleChange, setConfirmRoleChange] = useState(false);

  const [toggleTarget, setToggleTarget] = useState<AdminUser | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  function load() {
    setUsers(null);
    setError(false);
    setTimeout(() => {
      try {
        setUsers(getAdminUsers());
        setRoles(getRoles());
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
  }, [search, roleFilter, statusFilter]);

  const roleName = (id: RoleId) => roles.find((r) => r.id === id)?.name ?? id;
  const isSelf = (u: AdminUser) => u.id === admin?.id;

  const filtered = useMemo(() => {
    if (!users) return [];
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch = !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
      const matchesRole = !roleFilter || u.roleId === roleFilter;
      const matchesStatus = !statusFilter || (statusFilter === "active" ? u.active : !u.active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => a.name.localeCompare(b.name)), [filtered]);
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ---------- Add / edit ----------

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormMode("add");
  }

  function openEdit(u: AdminUser) {
    setViewUser(null);
    setEditing(u);
    setForm({ name: u.name, email: u.email, phone: u.phone, roleId: u.roleId, password: "" });
    setFormError("");
    setFormMode("edit");
  }

  function closeForm() {
    if (saving) return;
    setFormMode(null);
    setEditing(null);
    setConfirmRoleChange(false);
  }

  function validate(): string {
    if (!form.name.trim()) return "Enter the admin's name.";
    if (!EMAIL_RE.test(form.email.trim())) return "Enter a valid email address.";
    if (formMode === "add" && form.password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    return "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setFormError(problem);
      return;
    }
    setFormError("");
    // Changing someone's role changes what they can do — always confirm.
    if (formMode === "edit" && editing && form.roleId !== editing.roleId) {
      setConfirmRoleChange(true);
      return;
    }
    persist();
  }

  function persist() {
    setSaving(true);
    setTimeout(() => {
      const isAdd = formMode === "add";
      const result = isAdd
        ? createAdminUser({ ...form })
        : updateAdminUser(editing!.id, {
            name: form.name,
            email: form.email,
            phone: form.phone,
            roleId: form.roleId,
          });

      setSaving(false);
      setConfirmRoleChange(false);
      if (!result.ok || !result.user) {
        setFormError(result.error ?? "Something went wrong.");
        return;
      }

      const saved = result.user;
      if (isAdd) {
        logAdminAction("Added admin user", "admin", `${saved.name} (${roleName(saved.roleId)})`);
      } else if (editing && editing.roleId !== saved.roleId) {
        logAdminAction(
          "Changed admin role",
          "admin",
          `${saved.name}: ${roleName(editing.roleId)} → ${roleName(saved.roleId)}`
        );
      } else {
        logAdminAction("Edited admin user", "admin", saved.name);
      }

      setUsers(getAdminUsers());
      // If you edited yourself, your name/role in the header and sidebar must update too.
      if (saved.id === admin?.id) refresh();
      setFormMode(null);
      setEditing(null);
      toast.success(isAdd ? "Admin added." : "Admin updated.");
    }, 300);
  }

  // ---------- Activate / deactivate ----------

  function handleConfirmToggle() {
    if (!toggleTarget) return;
    setToggleLoading(true);
    const nextActive = !toggleTarget.active;
    setTimeout(() => {
      const result = setAdminActive(toggleTarget.id, nextActive, admin?.id);
      setToggleLoading(false);
      if (!result.ok || !result.user) {
        toast.error(result.error ?? "Couldn't update this admin.");
        setToggleTarget(null);
        return;
      }
      logAdminAction(nextActive ? "Reactivated admin user" : "Deactivated admin user", "admin", toggleTarget.name);
      setUsers(getAdminUsers());
      setViewUser((prev) => (prev && prev.id === result.user!.id ? result.user! : prev));
      setToggleTarget(null);
      toast.success(nextActive ? "Admin reactivated." : "Admin deactivated.");
    }, 300);
  }

  // ---------- Table ----------

  const columns: AdminTableColumn<AdminUser>[] = [
    {
      key: "name",
      header: "Admin",
      render: (u) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-medium text-white">
            {u.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">
              {u.name}
              {isSelf(u) && <span className="ml-1.5 text-xs font-normal text-faint">(you)</span>}
            </p>
            <p className="truncate text-xs text-muted">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (u) => <StatusBadge label={roleName(u.roleId)} variant={ROLE_VARIANT[u.roleId]} />,
    },
    {
      key: "lastLoginAt",
      header: "Last login",
      render: (u) => <span className="text-sm text-muted">{formatDateTime(u.lastLoginAt)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (u) => <StatusBadge label={u.active ? "Active" : "Inactive"} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (u) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setViewUser(u)}
            className="rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-primary/40 hover:bg-primary-light hover:text-primary-dark"
          >
            View
          </button>
          {canEdit && (
            <button
              onClick={() => openEdit(u)}
              className="flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-primary/40 hover:bg-primary-light hover:text-primary-dark"
            >
              <Pencil size={12} /> Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => setToggleTarget(u)}
              disabled={isSelf(u) && u.active}
              title={isSelf(u) && u.active ? "You can't deactivate your own account" : undefined}
              className={`flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                !u.active
                  ? "border-success/40 text-success hover:bg-success-light"
                  : "border-accent/40 text-accent hover:bg-accent-light"
              }`}
            >
              <Power size={12} />
              {!u.active ? "Activate" : "Deactivate"}
            </button>
          )}
        </div>
      ),
    },
  ];

  const viewRole = viewUser ? roles.find((r) => r.id === viewUser.roleId) : undefined;
  const accessibleModules = viewRole ? MODULES.filter((m) => (viewRole.permissions[m.key] ?? []).length > 0) : [];
  const formRole = roles.find((r) => r.id === form.roleId);
  const editingSelf = formMode === "edit" && editing?.id === admin?.id;

  return (
    <div className="mx-auto max-w-6xl p-5 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Admin Users</h1>
          <p className="mt-1 text-sm text-muted">Manage who can sign in to the Admin Portal and what they can do.</p>
        </div>
        {canCreate && (
          <button onClick={openAdd} className="btn-primary btn-md flex items-center gap-1.5">
            <UserPlus size={15} /> Add admin
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchFilter
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name or email…"
            filterValue={roleFilter}
            onFilterChange={setRoleFilter}
            filterOptions={roles.map((r) => ({ label: r.name, value: r.id }))}
            filterAllLabel="All roles"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "" | "active" | "inactive")}
          className="field sm:w-44"
        >
          <option value="">All statuses</option>
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        {error ? (
          <ErrorState description="Couldn't load admin users." onRetry={load} />
        ) : users === null ? (
          <LoadingState label="Loading admin users…" />
        ) : sorted.length === 0 ? (
          <EmptyState
            title="No admins found"
            description="Try adjusting your search or filters."
            action={
              canCreate ? (
                <button onClick={openAdd} className="btn-secondary btn-sm">
                  Add admin
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <AdminTable columns={columns} rows={paged} rowKey={(u) => u.id} onRowClick={(u) => setViewUser(u)} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={sorted.length} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Admin details */}
      <AdminModal open={!!viewUser} onClose={() => setViewUser(null)} title="Admin details" maxWidth="max-w-lg">
        {viewUser && (
          <div>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-lg font-medium text-white">
                {viewUser.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-base font-semibold text-ink">{viewUser.name}</p>
                <p className="flex items-center gap-1.5 truncate text-sm text-muted">
                  <Mail size={13} className="shrink-0" /> {viewUser.email}
                </p>
                <p className="flex items-center gap-1.5 truncate text-sm text-muted">
                  <Phone size={13} className="shrink-0" /> {viewUser.phone || "—"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge label={roleName(viewUser.roleId)} variant={ROLE_VARIANT[viewUser.roleId]} />
              <StatusBadge label={viewUser.active ? "Active" : "Inactive"} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
              <div className="flex items-start gap-2">
                <Clock size={15} className="mt-0.5 shrink-0 text-muted" />
                <div>
                  <p className="text-xs text-faint">Last login</p>
                  <p className="text-ink">{formatDateTime(viewUser.lastLoginAt)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CalendarClock size={15} className="mt-0.5 shrink-0 text-muted" />
                <div>
                  <p className="text-xs text-faint">Added on</p>
                  <p className="text-ink">{formatDate(viewUser.createdAt)}</p>
                </div>
              </div>
            </div>

            {viewRole && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="text-sm font-medium text-ink">Access as {viewRole.name}</p>
                <p className="mt-0.5 text-xs text-muted">{viewRole.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {accessibleModules.map((m) => (
                    <span
                      key={m.key}
                      title={(viewRole.permissions[m.key] ?? []).join(", ")}
                      className="rounded-md border border-line bg-bg px-2 py-1 text-xs font-medium text-muted"
                    >
                      {m.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(canEdit || canDelete) && (
              <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-line pt-5">
                {canEdit && (
                  <button onClick={() => openEdit(viewUser)} className="btn-secondary btn-sm flex items-center gap-1.5">
                    <Pencil size={13} /> Edit admin
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => setToggleTarget(viewUser)}
                    disabled={isSelf(viewUser) && viewUser.active}
                    title={isSelf(viewUser) && viewUser.active ? "You can't deactivate your own account" : undefined}
                    className={`btn-sm flex items-center gap-1.5 rounded-md border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      !viewUser.active
                        ? "border-success/40 text-success hover:bg-success-light"
                        : "border-accent/40 text-accent hover:bg-accent-light"
                    }`}
                  >
                    <Power size={13} />
                    {!viewUser.active ? "Activate admin" : "Deactivate admin"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </AdminModal>

      {/* Add / edit form */}
      <AdminModal
        open={formMode !== null}
        onClose={closeForm}
        title={formMode === "add" ? "Add admin" : "Edit admin"}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="adm-name" className="mb-1.5 block text-xs font-medium text-muted">
                Full name
              </label>
              <input
                id="adm-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="field"
                placeholder="Riya Malhotra"
              />
            </div>
            <div>
              <label htmlFor="adm-phone" className="mb-1.5 block text-xs font-medium text-muted">
                Phone (optional)
              </label>
              <input
                id="adm-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="field"
                placeholder="98765 43210"
              />
            </div>
          </div>

          <div>
            <label htmlFor="adm-email" className="mb-1.5 block text-xs font-medium text-muted">
              Email
            </label>
            <input
              id="adm-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="field"
              placeholder="name@curo.com"
            />
          </div>

          <div>
            <label htmlFor="adm-role" className="mb-1.5 block text-xs font-medium text-muted">
              Role
            </label>
            <select
              id="adm-role"
              value={form.roleId}
              disabled={editingSelf}
              onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value as RoleId }))}
              className="field disabled:cursor-not-allowed disabled:opacity-60"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-faint">
              {editingSelf ? "You can't change your own role." : formRole?.description}
            </p>
          </div>

          {formMode === "add" && (
            <div>
              <label htmlFor="adm-password" className="mb-1.5 block text-xs font-medium text-muted">
                Temporary password
              </label>
              <input
                id="adm-password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="field"
                placeholder="••••••••"
              />
              <p className="mt-1.5 text-xs text-faint">
                At least {MIN_PASSWORD_LENGTH} characters. They can change it from Settings after signing in.
              </p>
            </div>
          )}

          {formError && <p className="text-sm text-accent">{formError}</p>}

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" onClick={closeForm} disabled={saving} className="btn-secondary btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary btn-sm">
              {saving ? "Saving…" : formMode === "add" ? "Add admin" : "Save changes"}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Role change confirmation (rendered after the form so it stacks above it) */}
      <ConfirmActionModal
        open={confirmRoleChange}
        onClose={() => setConfirmRoleChange(false)}
        onConfirm={persist}
        loading={saving}
        title="Change role?"
        description={
          editing
            ? `${editing.name} will go from ${roleName(editing.roleId)} to ${roleName(form.roleId)}. Their access changes immediately.`
            : undefined
        }
        confirmLabel="Change role"
      />

      {/* Activate / deactivate confirmation */}
      <ConfirmActionModal
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleConfirmToggle}
        loading={toggleLoading}
        title={toggleTarget && !toggleTarget.active ? "Activate admin?" : "Deactivate admin?"}
        description={
          toggleTarget && !toggleTarget.active
            ? `${toggleTarget.name} will be able to sign in to the Admin Portal again.`
            : `${toggleTarget?.name} will be signed out and won't be able to log in until reactivated.`
        }
        confirmLabel={toggleTarget && !toggleTarget.active ? "Activate" : "Deactivate"}
        variant={toggleTarget && !toggleTarget.active ? "primary" : "danger"}
      />
    </div>
  );
}