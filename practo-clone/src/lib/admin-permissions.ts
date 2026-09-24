// Pure permission model for the Admin Portal — no localStorage, no React.
// The store (admin-users.ts), session (admin-auth.ts), context, sidebar and
// route guard all build on the definitions in this file.

export type AdminModule =
  | "dashboard"
  | "analytics"
  | "doctors"
  | "doctor-verification"
  | "patients"
  | "appointments"
  | "payments"
  | "reviews"
  | "notifications"
  | "reports"
  | "admin-users"
  | "roles"
  | "audit-logs"
  | "settings";

export type PermissionAction = "view" | "create" | "edit" | "delete" | "approve";

// A role's permissions: for each module, the list of actions it may perform.
// A module that is missing (or has an empty list) is completely hidden.
export type PermissionMap = Partial<Record<AdminModule, PermissionAction[]>>;

export type RoleId = "super-admin" | "admin" | "support";

export const ACTION_ORDER: PermissionAction[] = ["view", "create", "edit", "delete", "approve"];

export const ACTION_LABELS: Record<PermissionAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  approve: "Approve / Reject",
};

export interface ModuleDef {
  key: AdminModule;
  label: string;
  href: string;
  /** Which actions make sense for this module — the roles matrix only offers these. */
  actions: PermissionAction[];
  /** What an action means in this module, shown as a tooltip in the roles matrix. */
  hints?: Partial<Record<PermissionAction, string>>;
}

export const MODULES: ModuleDef[] = [
  { key: "dashboard", label: "Dashboard", href: "/admin", actions: ["view"] },
  { key: "analytics", label: "Analytics Dashboard", href: "/admin/analytics", actions: ["view"] },
  {
    key: "doctors",
    label: "Doctors",
    href: "/admin/doctors",
    actions: ["view", "edit"],
    hints: { edit: "Activate or deactivate doctors" },
  },
  {
    key: "doctor-verification",
    label: "Doctor Verification",
    href: "/admin/doctor-verification",
    actions: ["view", "approve"],
    hints: { approve: "Approve or reject verification requests" },
  },
  {
    key: "patients",
    label: "Patients",
    href: "/admin/patients",
    actions: ["view", "edit"],
    hints: { edit: "Activate or deactivate patients" },
  },
  { key: "appointments", label: "Appointments", href: "/admin/appointments", actions: ["view"] },
  { key: "payments", label: "Payments", href: "/admin/payments", actions: ["view"] },
  {
    key: "reviews",
    label: "Reviews",
    href: "/admin/reviews",
    actions: ["view", "edit"],
    hints: { edit: "Hide or unhide reviews" },
  },
  {
    key: "notifications",
    label: "Notifications",
    href: "/admin/notifications",
    actions: ["view", "create"],
    hints: { create: "Send notifications to patients and doctors" },
  },
  {
    key: "reports",
    label: "Reports",
    href: "/admin/reports",
    actions: ["view", "create"],
    hints: { create: "Generate and export reports (CSV, Excel, PDF)" },
  },
  {
    key: "admin-users",
    label: "Admin Users",
    href: "/admin/admin-users",
    actions: ["view", "create", "edit", "delete"],
    hints: {
      create: "Add new admin users",
      edit: "Edit admin details and change their role",
      delete: "Deactivate or reactivate admin users",
    },
  },
  {
    key: "roles",
    label: "Roles & Permissions",
    href: "/admin/roles",
    actions: ["view", "edit"],
    hints: { edit: "Change what Admin and Support roles can do" },
  },
  { key: "audit-logs", label: "Audit Logs", href: "/admin/audit-logs", actions: ["view"] },
  {
    key: "settings",
    label: "Settings",
    href: "/admin/settings",
    actions: ["view", "edit"],
    hints: { view: "See platform settings", edit: "Change platform settings" },
  },
];

// Every admin can open Settings — the Profile, Password and Notification
// tabs are personal. Only the "Platform" tab is checked against the
// `settings` permissions.
export const ALWAYS_ACCESSIBLE_MODULES: AdminModule[] = ["settings"];

export function getModule(key: AdminModule): ModuleDef {
  return MODULES.find((m) => m.key === key)!;
}

// Longest-href match, so "/admin/doctor-verification" never resolves to
// "/admin/doctors" and "/admin" only matches the dashboard exactly.
export function moduleForPath(pathname: string | null | undefined): ModuleDef | undefined {
  if (!pathname) return undefined;
  const clean = pathname.replace(/\/+$/, "") || "/";
  return [...MODULES]
    .sort((a, b) => b.href.length - a.href.length)
    .find((m) => (m.href === "/admin" ? clean === "/admin" : clean === m.href || clean.startsWith(`${m.href}/`)));
}

export function hasPermission(
  perms: PermissionMap | undefined | null,
  module: AdminModule,
  action: PermissionAction = "view"
): boolean {
  return !!perms?.[module]?.includes(action);
}

export function fullPermissions(): PermissionMap {
  const out: PermissionMap = {};
  MODULES.forEach((m) => {
    out[m.key] = [...m.actions];
  });
  return out;
}

// Drops actions a module doesn't support and guarantees the rule "you can't
// create/edit/delete/approve something you can't view": any module with an
// action always includes "view".
export function sanitizePermissions(perms: PermissionMap | undefined | null): PermissionMap {
  const out: PermissionMap = {};
  MODULES.forEach((m) => {
    const wanted = new Set((perms?.[m.key] ?? []).filter((a) => m.actions.includes(a)));
    if (wanted.size === 0) return;
    wanted.add("view");
    out[m.key] = ACTION_ORDER.filter((a) => wanted.has(a));
  });
  return out;
}

// Where to send someone who lands on a page they can't open.
export function getFirstAllowedHref(perms: PermissionMap | undefined | null): string {
  const first = MODULES.find((m) => m.key !== "settings" && hasPermission(perms, m.key, "view"));
  return first?.href ?? "/admin/settings";
}

// ---------- Predefined roles ----------

export interface RoleDef {
  id: RoleId;
  name: string;
  description: string;
}

export const ROLE_DEFS: RoleDef[] = [
  {
    id: "super-admin",
    name: "Super Admin",
    description: "Full access to every module, including admin users, roles and platform settings.",
  },
  {
    id: "admin",
    name: "Admin",
    description: "Runs day-to-day operations: doctors, patients, verification, reviews, notifications and reports.",
  },
  {
    id: "support",
    name: "Support",
    description: "Read-mostly access to help users, plus review moderation. Cannot approve doctors or send broadcasts.",
  },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<RoleId, PermissionMap> = {
  "super-admin": fullPermissions(),
  admin: {
    dashboard: ["view"],
    analytics: ["view"],
    doctors: ["view", "edit"],
    "doctor-verification": ["view", "approve"],
    patients: ["view", "edit"],
    appointments: ["view"],
    payments: ["view"],
    reviews: ["view", "edit"],
    notifications: ["view", "create"],
    reports: ["view", "create"],
    "admin-users": ["view"],
    roles: ["view"],
    "audit-logs": ["view"],
    settings: ["view"],
  },
  support: {
    dashboard: ["view"],
    doctors: ["view"],
    "doctor-verification": ["view"],
    patients: ["view"],
    appointments: ["view"],
    payments: ["view"],
    reviews: ["view", "edit"],
    notifications: ["view"],
  },
};