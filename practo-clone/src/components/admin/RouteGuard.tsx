"use client";

import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { ALWAYS_ACCESSIBLE_MODULES, moduleForPath } from "@/lib/admin-permissions";
import AccessDenied from "./AccessDenied";

// Sits inside AdminShell (so the sidebar/header stay visible) and blocks a
// page whose module the signed-in admin has no "view" permission for.
// AdminGate already guarantees someone is logged in; this decides *what*
// they may open. The blocked page never mounts, so it never loads its data.
export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { can } = useAdminAuth();

  const mod = moduleForPath(pathname);
  if (!mod || ALWAYS_ACCESSIBLE_MODULES.includes(mod.key) || can(mod.key, "view")) {
    return <>{children}</>;
  }
  return <AccessDenied moduleLabel={mod.label} />;
}