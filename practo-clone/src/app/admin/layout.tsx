"use client";

import { AdminAuthProvider } from "@/context/AdminAuthContext";
import AdminGate from "@/components/admin/AdminGate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminGate>{children}</AdminGate>
    </AdminAuthProvider>
  );
}