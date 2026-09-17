"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { adminLogin, adminLogout, isAdminLoggedIn, getAdminName } from "@/lib/admin-auth";

interface AdminAuthContextValue {
  isAdmin: boolean;
  loading: boolean;
  adminName: string;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Hydrates from localStorage after mount — same pattern as the
  // patient/doctor AuthContext, avoids a server/client mismatch.
  useEffect(() => {
    setIsAdmin(isAdminLoggedIn());
    setLoading(false);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const result = adminLogin(email, password);
    if (result.ok) setIsAdmin(true);
    return result;
  }, []);

  const logout = useCallback(() => {
    adminLogout();
    setIsAdmin(false);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ isAdmin, loading, adminName: getAdminName(), login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}