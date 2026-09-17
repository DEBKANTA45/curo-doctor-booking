"use client";

import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AdminDashboardPage() {
  const { adminName, logout } = useAdminAuth();

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">
        Welcome, {adminName}
      </h1>
      <p className="mt-2 text-sm text-muted">
        Admin authentication is working. The full dashboard (stats, sidebar, etc.) comes next.
      </p>
      <button
        onClick={logout}
        className="mt-6 rounded-md border border-line px-4 py-2.5 text-sm font-medium text-accent hover:border-accent hover:bg-accent-light"
      >
        Log out
      </button>
    </div>
  );
}