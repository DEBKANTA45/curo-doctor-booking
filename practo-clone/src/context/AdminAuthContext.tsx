"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";
import toast from "react-hot-toast";
import {
  ADMIN_SESSION_KEY,
  adminLogin,
  adminLogout,
  resolveAdminSession,
  touchAdminSession,
} from "@/lib/admin-auth";
import { ADMIN_STORE_KEYS, AdminRole, AdminUser, getRoleById } from "@/lib/admin-users";
import { AdminModule, PermissionAction, PermissionMap, hasPermission } from "@/lib/admin-permissions";

interface AdminAuthContextValue {
  /** The signed-in admin, or null. */
  admin: AdminUser | null;
  role: AdminRole | null;
  permissions: PermissionMap;
  isAdmin: boolean;
  loading: boolean;
  /** Kept for existing screens (e.g. "Welcome, {adminName}"). */
  adminName: string;
  sessionStartedAt: string | null;
  /** can("doctors", "edit") — action defaults to "view". */
  can: (module: AdminModule, action?: PermissionAction) => boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  /** Re-read the admin + role from storage (after editing a profile or a role). */
  refresh: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"] as const;
const ACTIVITY_THROTTLE_MS = 15_000;
const SESSION_CHECK_INTERVAL_MS = 30_000;

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Re-reads the session. `announce` shows a toast when a session was ended
  // from the outside (idle timeout / account deactivated).
  const sync = useCallback((announce = false) => {
    const { admin: current, reason, loginAt } = resolveAdminSession();
    setAdmin(current);
    setRole(current ? getRoleById(current.roleId) ?? null : null);
    setSessionStartedAt(loginAt ?? null);
    if (announce && !current) {
      if (reason === "expired") toast.error("You were signed out after 30 minutes of inactivity.");
      if (reason === "deactivated") toast.error("Your admin account has been deactivated.");
    }
  }, []);

  // Hydrates from localStorage after mount — same pattern as the
  // patient/doctor auth, avoids a server/client mismatch.
  useEffect(() => {
    sync(true);
    setLoading(false);
  }, [sync]);

  const signedIn = admin !== null;

  useEffect(() => {
    if (!signedIn) return;

    // 1. Keep the session alive while the admin is actually using the portal.
    let lastTouch = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastTouch > ACTIVITY_THROTTLE_MS) {
        lastTouch = now;
        touchAdminSession();
      }
    };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    // 2. Periodically enforce idle timeout / deactivation.
    const timer = setInterval(() => {
      const { admin: current, reason } = resolveAdminSession();
      if (!current) {
        setAdmin(null);
        setRole(null);
        setSessionStartedAt(null);
        if (reason === "expired") toast.error("You were signed out after 30 minutes of inactivity.");
        if (reason === "deactivated") toast.error("Your admin account has been deactivated.");
      }
    }, SESSION_CHECK_INTERVAL_MS);

    // 3. Another tab logged out, or a role / user changed.
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === ADMIN_SESSION_KEY || ADMIN_STORE_KEYS.includes(e.key)) {
        sync(true);
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      clearInterval(timer);
      window.removeEventListener("storage", onStorage);
    };
  }, [signedIn, sync]);

  const login = useCallback(
    (email: string, password: string) => {
      const result = adminLogin(email, password);
      if (result.ok) sync();
      return result;
    },
    [sync]
  );

  const logout = useCallback(() => {
    adminLogout();
    setAdmin(null);
    setRole(null);
    setSessionStartedAt(null);
  }, []);

  const refresh = useCallback(() => sync(), [sync]);

  const value = useMemo<AdminAuthContextValue>(() => {
    const permissions = role?.permissions ?? {};
    return {
      admin,
      role,
      permissions,
      isAdmin: admin !== null,
      loading,
      adminName: admin?.name ?? "Admin",
      sessionStartedAt,
      can: (module, action = "view") => hasPermission(permissions, module, action),
      login,
      logout,
      refresh,
    };
  }, [admin, role, loading, sessionStartedAt, login, logout, refresh]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}