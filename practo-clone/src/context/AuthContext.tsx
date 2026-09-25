"use client";

import { useCallback, useEffect } from "react";
import { Account } from "@/lib/types";
import { getSession, logout as logoutDb, seedDemoAccounts } from "@/lib/mock-db";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAccount, setLoading } from "@/store/authSlice";

/**
 * Every existing page/component in this app already calls useAuth() and
 * expects { account, loading, refresh, logout }. This is now backed by
 * Redux (src/store/authSlice.ts) instead of React Context, but the public
 * API is kept identical on purpose — so migrating to Redux didn't require
 * touching the 20+ files that already call useAuth().
 */
export function useAuth() {
  const dispatch = useAppDispatch();
  const account = useAppSelector((state) => state.auth.account);
  const loading = useAppSelector((state) => state.auth.loading);

  const refresh = useCallback(() => {
    dispatch(setAccount(getSession()));
  }, [dispatch]);

  const logout = useCallback(() => {
    logoutDb();
    dispatch(setAccount(null));
  }, [dispatch]);

  return { account, loading, refresh, logout };
}

/**
 * Renders nothing — just hydrates the Redux auth state from localStorage
 * once on mount. Replaces what AuthProvider's effect used to do. Must be
 * rendered once, inside <StoreProvider>, near the root of the app.
 */
export function AuthHydrator() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    seedDemoAccounts();
    dispatch(setAccount(getSession()));
    dispatch(setLoading(false));
  }, [dispatch]);

  return null;
}