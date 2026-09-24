"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Lock, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  AdminRole,
  countAdminsByRole,
  getRoles,
  resetRolePermissions,
  saveRolePermissions,
} from "@/lib/admin-users";
import {
  ACTION_LABELS,
  ACTION_ORDER,
  MODULES,
  ModuleDef,
  PermissionAction,
  PermissionMap,
  RoleId,
  sanitizePermissions,
} from "@/lib/admin-permissions";
import { logAdminAction } from "@/lib/mock-db";
import AdminTable, { AdminTableColumn } from "@/components/admin/AdminTable";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmActionModal from "@/components/admin/ConfirmActionModal";
import LoadingState from "@/components/admin/LoadingState";
import ErrorState from "@/components/admin/ErrorState";

function clonePermissions(p: PermissionMap): PermissionMap {
  const out: PermissionMap = {};
  MODULES.forEach((m) => {
    if (p[m.key]) out[m.key] = [...(p[m.key] as PermissionAction[])];
  });
  return out;
}

export default function AdminRolesPage() {
  const { admin, can, refresh } = useAdminAuth();
  const canEditRoles = can("roles", "edit");

  const [roles, setRoles] = useState<AdminRole[] | null>(null);
  const [counts, setCounts] = useState<Record<RoleId, number>>({ "super-admin": 0, admin: 0, support: 0 });
  const [error, setError] = useState(false);

  const [selectedId, setSelectedId] = useState<RoleId>("admin");
  const [draft, setDraft] = useState<PermissionMap>({});

  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  function load() {
    setRoles(null);
    setError(false);
    setTimeout(() => {
      try {
        setRoles(getRoles());
        setCounts(countAdminsByRole());
      } catch {
        setError(true);
      }
    }, 300);
  }

  useEffect(() => {
    load();
  }, []);

  const role = roles?.find((r) => r.id === selectedId);

  // Reset the draft whenever the selected role (or its saved permissions) changes.
  useEffect(() => {
    if (role) setDraft(clonePermissions(role.permissions));
  }, [role]);

  const readOnlyReason = !role
    ? null
    : role.locked
    ? "Super Admin always has full access and can't be changed."
    : !canEditRoles
    ? "You have view-only access to roles."
    : admin?.roleId === role.id
    ? "You can't change the permissions of your own role."
    : null;
  const editable = !!role && readOnlyReason === null;

  const dirty = useMemo(
    () => !!role && JSON.stringify(sanitizePermissions(draft)) !== JSON.stringify(role.permissions),
    [draft, role]
  );

  function toggle(moduleKey: ModuleDef["key"], action: PermissionAction, checked: boolean) {
    setDraft((prev) => {
      const current = new Set(prev[moduleKey] ?? []);
      if (checked) {
        current.add(action);
        current.add("view"); // can't act on what you can't see
      } else if (action === "view") {
        current.clear(); // removing view removes everything for that module
      } else {
        current.delete(action);
      }
      return { ...prev, [moduleKey]: ACTION_ORDER.filter((a) => current.has(a)) };
    });
  }

  function handleSave() {
    if (!role) return;
    setBusy(true);
    setTimeout(() => {
      const result = saveRolePermissions(role.id, draft);
      setBusy(false);
      setConfirmSave(false);
      if (!result.ok) {
        toast.error(result.error ?? "Couldn't save permissions.");
        return;
      }
      logAdminAction("Updated role permissions", "role", role.name);
      setRoles(getRoles());
      refresh();
      toast.success(`${role.name} permissions saved.`);
    }, 300);
  }

  function handleReset() {
    if (!role) return;
    setBusy(true);
    setTimeout(() => {
      const result = resetRolePermissions(role.id);
      setBusy(false);
      setConfirmReset(false);
      if (!result.ok) {
        toast.error(result.error ?? "Couldn't reset permissions.");
        return;
      }
      logAdminAction("Reset role permissions to default", "role", role.name);
      setRoles(getRoles());
      refresh();
      toast.success(`${role.name} permissions reset.`);
    }, 300);
  }

  const columns: AdminTableColumn<ModuleDef>[] = [
    {
      key: "module",
      header: "Module",
      render: (m) => <span className="text-sm font-medium text-ink">{m.label}</span>,
    },
    ...ACTION_ORDER.map<AdminTableColumn<ModuleDef>>((action) => ({
      key: action,
      header: ACTION_LABELS[action],
      className: "text-center",
      render: (m) =>
        m.actions.includes(action) ? (
          <input
            type="checkbox"
            checked={(draft[m.key] ?? []).includes(action)}
            disabled={!editable}
            onChange={(e) => toggle(m.key, action, e.target.checked)}
            title={m.hints?.[action]}
            aria-label={`${ACTION_LABELS[action]} ${m.label}`}
            className="h-4 w-4 rounded border-line accent-primary disabled:cursor-not-allowed disabled:opacity-50"
          />
        ) : (
          <span className="text-faint">—</span>
        ),
    })),
  ];

  return (
    <div className="mx-auto max-w-6xl p-5 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Roles &amp; Permissions</h1>
      <p className="mt-1 text-sm text-muted">
        Every admin has one role. A role decides which modules they see and what they can do in each.
      </p>

      {error ? (
        <div className="mt-6">
          <ErrorState description="Couldn't load roles." onRetry={load} />
        </div>
      ) : roles === null ? (
        <div className="mt-6">
          <LoadingState label="Loading roles…" />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {roles.map((r) => {
              const active = r.id === selectedId;
              const moduleCount = MODULES.filter((m) => (r.permissions[m.key] ?? []).length > 0).length;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  aria-pressed={active}
                  className={`card p-5 text-left transition-colors ${
                    active ? "border-primary/50 bg-primary-light/40" : "hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <ShieldCheck size={15} className="text-primary" /> {r.name}
                    </span>
                    {r.locked && <Lock size={13} className="text-faint" aria-label="Locked" />}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{r.description}</p>
                  <p className="mt-3 text-xs text-faint">
                    {counts[r.id]} active admin{counts[r.id] === 1 ? "" : "s"} &middot; {moduleCount} of{" "}
                    {MODULES.length} modules
                  </p>
                </button>
              );
            })}
          </div>

          {role && (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-ink">Permissions for {role.name}</p>
                  <StatusBadge label="System role" variant="faint" />
                </div>
                {editable && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmReset(true)}
                      className="btn-secondary btn-sm flex items-center gap-1.5"
                    >
                      <RotateCcw size={13} /> Reset to default
                    </button>
                    <button
                      onClick={() => setConfirmSave(true)}
                      disabled={!dirty}
                      className="btn-primary btn-sm flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save size={13} /> Save changes
                    </button>
                  </div>
                )}
              </div>

              {readOnlyReason && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                  <Lock size={12} className="shrink-0" /> {readOnlyReason}
                </p>
              )}

              <div className="mt-3">
                <AdminTable columns={columns} rows={MODULES} rowKey={(m) => m.key} />
              </div>
              <p className="mt-3 text-xs text-faint">
                Hover a checkbox to see what it allows. Turning on any action also turns on View; turning off View
                hides the module completely.
              </p>
            </div>
          )}
        </>
      )}

      <ConfirmActionModal
        open={confirmSave}
        onClose={() => setConfirmSave(false)}
        onConfirm={handleSave}
        loading={busy}
        title="Save permissions?"
        description={
          role
            ? `This applies immediately to ${counts[role.id]} active ${role.name} admin${
                counts[role.id] === 1 ? "" : "s"
              }. Anything you removed will disappear from their sidebar.`
            : undefined
        }
        confirmLabel="Save changes"
      />

      <ConfirmActionModal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleReset}
        loading={busy}
        title="Reset to default?"
        description={role ? `${role.name} will go back to its default permissions. Unsaved changes are lost.` : undefined}
        confirmLabel="Reset"
        variant="danger"
      />
    </div>
  );
}