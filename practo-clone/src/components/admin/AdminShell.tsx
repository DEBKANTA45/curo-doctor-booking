"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import RouteGuard from "./RouteGuard";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // The login page is its own full-screen design — no sidebar/header there.
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <AdminSidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminHeader onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <RouteGuard>{children}</RouteGuard>
        </main>
      </div>
    </div>
  );
}