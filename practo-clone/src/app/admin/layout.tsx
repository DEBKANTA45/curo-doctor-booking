"use client";

import { AdminAuthProvider } from "@/context/AdminAuthContext";
import AdminGate from "@/components/admin/AdminGate";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminGate>
        <AdminShell>{children}</AdminShell>
      </AdminGate>
    </AdminAuthProvider>
  );
}