"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";

// The only /admin/* route that must stay reachable without being logged
// in — everything else redirects here.
const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicPath = PUBLIC_ADMIN_PATHS.includes(pathname);

  useEffect(() => {
    if (loading) return;
    if (!isAdmin && !isPublicPath) {
      router.replace("/admin/login");
    }
    if (isAdmin && isPublicPath) {
      // Already logged in — no reason to sit on the login page.
      router.replace("/admin");
    }
  }, [loading, isAdmin, isPublicPath, router]);

  // While hydrating, or right before a redirect fires, render nothing
  // rather than flashing protected content or the login form.
  if (loading) return null;
  if (!isAdmin && !isPublicPath) return null;
  if (isAdmin && isPublicPath) return null;

  return <>{children}</>;
}