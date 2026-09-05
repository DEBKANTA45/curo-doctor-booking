"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Account } from "@/lib/types";
import { getSession, logout as logoutDb } from "@/lib/mock-db";

interface AuthContextValue {
  account: Account | null;
  loading: boolean;
  refresh: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  account: null,
  loading: true,
  refresh: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setAccount(getSession());
  }, []);

  useEffect(() => {
    refresh();
    setLoading(false);
  }, [refresh]);

  const logout = useCallback(() => {
    logoutDb();
    setAccount(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ account, loading, refresh, logout }),
    [account, loading, refresh, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}