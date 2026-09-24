// Mock admin authentication. Accounts now live in admin-users.ts (three
// seeded admins, one per role); this file only owns the *session*: who is
// signed in, when they signed in, and when they were last active.
//
// The session is a small record in localStorage, separate from the
// patient/doctor account system since an admin isn't a patient or doctor.

import { AdminUser, getAdminUserById, recordAdminLogin, verifyAdminCredentials } from "./admin-users";

export const ADMIN_SESSION_KEY = "curo_admin_session_v2";
const LAST_ACTIVE_KEY = "curo_admin_last_active";
// The old version stored the string "true" here. It's cleared on login/logout.
const LEGACY_SESSION_KEY = "curo_admin_session";

// Sign out automatically after this much inactivity.
export const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

interface StoredSession {
  adminId: string;
  loginAt: string;
}

export function adminLogin(email: string, password: string): { ok: boolean; error?: string } {
  const result = verifyAdminCredentials(email, password);
  if (!result.ok || !result.user) return { ok: false, error: result.error };

  if (typeof window !== "undefined") {
    const session: StoredSession = { adminId: result.user.id, loginAt: new Date().toISOString() };
    localStorage.removeItem(LEGACY_SESSION_KEY);
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  }
  recordAdminLogin(result.user.id);
  return { ok: true };
}

export function adminLogout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(LAST_ACTIVE_KEY);
  localStorage.removeItem(LEGACY_SESSION_KEY);
}

// Call on user activity (throttled by the caller) to keep the session alive.
export function touchAdminSession() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(ADMIN_SESSION_KEY)) {
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  }
}

export interface AdminSessionResolution {
  admin: AdminUser | null;
  loginAt?: string;
  /** Why there is no admin, when a session existed but was ended. */
  reason?: "expired" | "deactivated";
}

// The single source of truth for "is someone signed in right now". It also
// enforces the rules that can end a session from the outside: idle timeout,
// the admin being deactivated (or removed) by another admin.
export function resolveAdminSession(): AdminSessionResolution {
  if (typeof window === "undefined") return { admin: null };
  const raw = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return { admin: null };

  let session: StoredSession;
  try {
    session = JSON.parse(raw) as StoredSession;
  } catch {
    adminLogout();
    return { admin: null };
  }

  const lastActive = Number(localStorage.getItem(LAST_ACTIVE_KEY)) || Date.parse(session.loginAt) || 0;
  if (Date.now() - lastActive > ADMIN_IDLE_TIMEOUT_MS) {
    adminLogout();
    return { admin: null, reason: "expired" };
  }

  const user = getAdminUserById(session.adminId);
  if (!user) {
    adminLogout();
    return { admin: null };
  }
  if (!user.active) {
    adminLogout();
    return { admin: null, reason: "deactivated" };
  }
  return { admin: user, loginAt: session.loginAt };
}

export function getCurrentAdmin(): AdminUser | null {
  return resolveAdminSession().admin;
}

export function isAdminLoggedIn(): boolean {
  return getCurrentAdmin() !== null;
}

// mock-db.ts uses these to stamp audit-log entries with the real actor.
export function getAdminName(): string {
  return getCurrentAdmin()?.name ?? "Admin";
}

export function getAdminEmail(): string {
  return getCurrentAdmin()?.email ?? "admin@curo.com";
}