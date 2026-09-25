// Mock data layer for the Admin Portal's own users, roles and settings.
// Same approach as mock-db.ts: localStorage is the persistence layer, and
// every screen goes through these functions instead of touching storage.
//
// NOTE: this file must NOT import mock-db.ts (mock-db imports admin-auth,
// which imports this file) — audit logging is done by the calling pages.

import {
  DEFAULT_ROLE_PERMISSIONS,
  PermissionMap,
  ROLE_DEFS,
  RoleDef,
  RoleId,
  fullPermissions,
  sanitizePermissions,
} from "./admin-permissions";

const USERS_KEY = "curo_admin_users";
const ROLE_OVERRIDES_KEY = "curo_admin_role_permissions";
const PLATFORM_SETTINGS_KEY = "curo_platform_settings";
const NOTIFICATION_PREFS_KEY = "curo_admin_notification_prefs";

// Keys other tabs may change — the auth context re-syncs when they do.
export const ADMIN_STORE_KEYS = [USERS_KEY, ROLE_OVERRIDES_KEY];

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export interface Outcome {
  ok: boolean;
  error?: string;
}

const EMAIL_RE = /^\S+@\S+\.\S+$/;
export const MIN_PASSWORD_LENGTH = 6;

// ---------- Admin users ----------

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId: RoleId;
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

// Passwords never leave this file inside an AdminUser — only the stored
// record carries one. (Still plaintext in localStorage: it's a mock.)
interface StoredAdminUser extends AdminUser {
  password: string;
}

// The original single hardcoded admin (admin@curo.com) is now the seeded
// Super Admin, so existing demo logins keep working.
const SEED_USERS: StoredAdminUser[] = [
  {
    id: "adm_super",
    name: "Admin",
    email: "admin@curo.com",
    password: "admin@curo1",
    phone: "",
    roleId: "super-admin",
    active: true,
    createdAt: "2026-01-05T09:00:00.000Z",
    lastLoginAt: null,
  },
  {
    id: "adm_manager",
    name: "Manager",
    email: "manager@curo.com",
    password: "manager@curo2",
    phone: "98765 11122",
    roleId: "admin",
    active: true,
    createdAt: "2026-02-12T10:30:00.000Z",
    lastLoginAt: null,
  },
  {
    id: "adm_support",
    name: "Admin Support",
    email: "support@curo.com",
    password: "support@curo3",
    phone: "98765 33344",
    roleId: "support",
    active: true,
    createdAt: "2026-03-20T11:15:00.000Z",
    lastLoginAt: null,
  },
];

function readStoredUsers(): StoredAdminUser[] {
  const existing = read<StoredAdminUser[] | null>(USERS_KEY, null);
  if (existing && existing.length > 0) return existing;
  write(USERS_KEY, SEED_USERS);
  return SEED_USERS;
}

function publicUser(u: StoredAdminUser): AdminUser {

  const { password, ...rest } = u;
  return rest;
}

function isValidRole(id: string): id is RoleId {
  return ROLE_DEFS.some((r) => r.id === id);
}

function otherActiveSuperAdmins(users: StoredAdminUser[], excludeId: string) {
  return users.filter((u) => u.id !== excludeId && u.roleId === "super-admin" && u.active).length;
}

export function getAdminUsers(): AdminUser[] {
  return readStoredUsers().map(publicUser);
}

export function getAdminUserById(id: string): AdminUser | undefined {
  const u = readStoredUsers().find((x) => x.id === id);
  return u ? publicUser(u) : undefined;
}

export function verifyAdminCredentials(
  email: string,
  password: string
): { ok: boolean; error?: string; user?: AdminUser } {
  const target = email.trim().toLowerCase();
  const u = readStoredUsers().find((x) => x.email.trim().toLowerCase() === target);
  if (!u || u.password !== password) return { ok: false, error: "Invalid admin email or password." };
  if (!u.active) {
    return { ok: false, error: "This admin account has been deactivated. Contact a Super Admin." };
  }
  return { ok: true, user: publicUser(u) };
}

export function recordAdminLogin(id: string) {
  const all = readStoredUsers().map((u) => (u.id === id ? { ...u, lastLoginAt: new Date().toISOString() } : u));
  write(USERS_KEY, all);
}

export interface AdminInput {
  name: string;
  email: string;
  phone: string;
  roleId: RoleId;
}

function validateInput(input: AdminInput): string | null {
  if (!input.name.trim()) return "Enter the admin's name.";
  if (!EMAIL_RE.test(input.email.trim())) return "Enter a valid email address.";
  if (!isValidRole(input.roleId)) return "Choose a role.";
  return null;
}

export function createAdminUser(
  input: AdminInput & { password: string }
): { ok: boolean; error?: string; user?: AdminUser } {
  const invalid = validateInput(input);
  if (invalid) return { ok: false, error: invalid };
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  const users = readStoredUsers();
  const email = input.email.trim();
  if (users.some((u) => u.email.trim().toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: "An admin with this email already exists." };
  }
  const user: StoredAdminUser = {
    id: `adm_${Date.now()}`,
    name: input.name.trim(),
    email,
    password: input.password,
    phone: input.phone.trim(),
    roleId: input.roleId,
    active: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  };
  write(USERS_KEY, [...users, user]);
  return { ok: true, user: publicUser(user) };
}

export function updateAdminUser(
  id: string,
  input: AdminInput
): { ok: boolean; error?: string; user?: AdminUser } {
  const invalid = validateInput(input);
  if (invalid) return { ok: false, error: invalid };
  const users = readStoredUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return { ok: false, error: "Admin not found." };
  const current = users[index];
  const email = input.email.trim();
  if (users.some((u) => u.id !== id && u.email.trim().toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: "An admin with this email already exists." };
  }
  if (
    current.roleId === "super-admin" &&
    input.roleId !== "super-admin" &&
    current.active &&
    otherActiveSuperAdmins(users, id) === 0
  ) {
    return { ok: false, error: "At least one active Super Admin is required." };
  }
  const updated: StoredAdminUser = {
    ...current,
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    roleId: input.roleId,
  };
  users[index] = updated;
  write(USERS_KEY, users);
  return { ok: true, user: publicUser(updated) };
}

export function setAdminActive(
  id: string,
  active: boolean,
  actorId?: string
): { ok: boolean; error?: string; user?: AdminUser } {
  const users = readStoredUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return { ok: false, error: "Admin not found." };
  const current = users[index];
  if (!active) {
    if (id === actorId) return { ok: false, error: "You can't deactivate your own account." };
    if (current.roleId === "super-admin" && otherActiveSuperAdmins(users, id) === 0) {
      return { ok: false, error: "At least one active Super Admin is required." };
    }
  }
  users[index] = { ...current, active };
  write(USERS_KEY, users);
  return { ok: true, user: publicUser(users[index]) };
}

// Own-profile edits: name and phone only. Email and role are managed from
// Admin Users, so an admin can't promote themselves.
export function updateAdminProfile(
  id: string,
  data: { name: string; phone: string }
): { ok: boolean; error?: string; user?: AdminUser } {
  if (!data.name.trim()) return { ok: false, error: "Enter your name." };
  const users = readStoredUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return { ok: false, error: "Admin not found." };
  users[index] = { ...users[index], name: data.name.trim(), phone: data.phone.trim() };
  write(USERS_KEY, users);
  return { ok: true, user: publicUser(users[index]) };
}

export function changeAdminPassword(id: string, currentPassword: string, newPassword: string): Outcome {
  const users = readStoredUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return { ok: false, error: "Admin not found." };
  if (users[index].password !== currentPassword) return { ok: false, error: "Current password is incorrect." };
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (newPassword === currentPassword) {
    return { ok: false, error: "New password must be different from the current one." };
  }
  users[index] = { ...users[index], password: newPassword };
  write(USERS_KEY, users);
  return { ok: true };
}

// ---------- Roles ----------

export interface AdminRole extends RoleDef {
  permissions: PermissionMap;
  /** Super Admin is locked: always full access, can't be edited. */
  locked: boolean;
}

function readRoleOverrides(): Partial<Record<RoleId, PermissionMap>> {
  return read<Partial<Record<RoleId, PermissionMap>>>(ROLE_OVERRIDES_KEY, {});
}

export function getRoles(): AdminRole[] {
  const overrides = readRoleOverrides();
  return ROLE_DEFS.map((def) => {
    const locked = def.id === "super-admin";
    const permissions = locked
      ? fullPermissions()
      : sanitizePermissions(overrides[def.id] ?? DEFAULT_ROLE_PERMISSIONS[def.id]);
    return { ...def, permissions, locked };
  });
}

export function getRoleById(id: string): AdminRole | undefined {
  return getRoles().find((r) => r.id === id);
}

export function saveRolePermissions(id: RoleId, permissions: PermissionMap): Outcome {
  if (id === "super-admin") return { ok: false, error: "Super Admin permissions can't be changed." };
  if (!isValidRole(id)) return { ok: false, error: "Role not found." };
  const overrides = readRoleOverrides();
  overrides[id] = sanitizePermissions(permissions);
  write(ROLE_OVERRIDES_KEY, overrides);
  return { ok: true };
}

export function resetRolePermissions(id: RoleId): Outcome {
  if (id === "super-admin") return { ok: false, error: "Super Admin permissions can't be changed." };
  const overrides = readRoleOverrides();
  delete overrides[id];
  write(ROLE_OVERRIDES_KEY, overrides);
  return { ok: true };
}

// Active admins per role — shown on the role cards and in save confirmations.
export function countAdminsByRole(): Record<RoleId, number> {
  const counts: Record<RoleId, number> = { "super-admin": 0, admin: 0, support: 0 };
  readStoredUsers().forEach((u) => {
    if (u.active && counts[u.roleId] !== undefined) counts[u.roleId] += 1;
  });
  return counts;
}

// ---------- Platform settings ----------

export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  cancellationWindowHours: number;
  maxAdvanceBookingDays: number;
  allowDoctorRegistrations: boolean;
  maintenanceMode: boolean;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  platformName: "Curo",
  supportEmail: "support@curo.com",
  supportPhone: "+91 98765 43210",
  cancellationWindowHours: 4,
  maxAdvanceBookingDays: 90,
  allowDoctorRegistrations: true,
  maintenanceMode: false,
};

export function getPlatformSettings(): PlatformSettings {
  return { ...DEFAULT_PLATFORM_SETTINGS, ...read<Partial<PlatformSettings>>(PLATFORM_SETTINGS_KEY, {}) };
}

export function savePlatformSettings(settings: PlatformSettings) {
  write(PLATFORM_SETTINGS_KEY, settings);
}

// ---------- Notification preferences (per admin) ----------

export interface AdminNotificationPrefs {
  newDoctorRegistrations: boolean;
  pendingVerifications: boolean;
  failedPayments: boolean;
  reportedReviews: boolean;
  digest: "off" | "daily" | "weekly";
}

export const DEFAULT_NOTIFICATION_PREFS: AdminNotificationPrefs = {
  newDoctorRegistrations: true,
  pendingVerifications: true,
  failedPayments: true,
  reportedReviews: true,
  digest: "weekly",
};

export function getNotificationPrefs(adminId: string): AdminNotificationPrefs {
  const all = read<Record<string, Partial<AdminNotificationPrefs>>>(NOTIFICATION_PREFS_KEY, {});
  return { ...DEFAULT_NOTIFICATION_PREFS, ...all[adminId] };
}

export function saveNotificationPrefs(adminId: string, prefs: AdminNotificationPrefs) {
  const all = read<Record<string, AdminNotificationPrefs>>(NOTIFICATION_PREFS_KEY, {});
  all[adminId] = prefs;
  write(NOTIFICATION_PREFS_KEY, all);
}