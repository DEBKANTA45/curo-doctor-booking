"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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

  const refresh = () => {
    setAccount(getSession());
  };

  useEffect(() => {
    refresh();
    setLoading(false);
  }, []);

  const logout = () => {
    logoutDb();
    setAccount(null);
  };

  return (
    <AuthContext.Provider value={{ account, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
