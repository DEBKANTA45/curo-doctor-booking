"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Stethoscope,
  BadgeCheck,
  Users,
  CalendarDays,
  CreditCard,
  Star,
  Bell,
  FileBarChart,
  ShieldCheck,
  KeyRound,
  History,
  Settings,
  X,
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { ALWAYS_ACCESSIBLE_MODULES, AdminModule } from "@/lib/admin-permissions";

// `module` ties each item to the permission model — an item is only shown
// when the signed-in admin can view that module.
export const adminNavItems: {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  ready: boolean;
  module: AdminModule;
}[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, ready: true, module: "dashboard" },
  { label: "Analytics Dashboard", href: "/admin/analytics", icon: BarChart3, ready: true, module: "analytics" },
  { label: "Doctors", href: "/admin/doctors", icon: Stethoscope, ready: true, module: "doctors" },
  { label: "Doctor Verification", href: "/admin/doctor-verification", icon: BadgeCheck, ready: true, module: "doctor-verification" },
  { label: "Patients", href: "/admin/patients", icon: Users, ready: true, module: "patients" },
  { label: "Appointments", href: "/admin/appointments", icon: CalendarDays, ready: true, module: "appointments" },
  { label: "Payments", href: "/admin/payments", icon: CreditCard, ready: true, module: "payments" },
  { label: "Reviews", href: "/admin/reviews", icon: Star, ready: true, module: "reviews" },
  { label: "Notifications", href: "/admin/notifications", icon: Bell, ready: true, module: "notifications" },
  { label: "Reports", href: "/admin/reports", icon: FileBarChart, ready: true, module: "reports" },
  { label: "Admin Users", href: "/admin/admin-users", icon: ShieldCheck, ready: true, module: "admin-users" },
  { label: "Roles & Permissions", href: "/admin/roles", icon: KeyRound, ready: true, module: "roles" },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: History, ready: true, module: "audit-logs" },
  { label: "Settings", href: "/admin/settings", icon: Settings, ready: true, module: "settings" },
];

interface AdminSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { can, role } = useAdminAuth();

  const visibleItems = adminNavItems.filter(
    (item) => ALWAYS_ACCESSIBLE_MODULES.includes(item.module) || can(item.module, "view")
  );

  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-line px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-gradient text-white shadow-glow">
          <ShieldCheck size={18} />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-base font-semibold text-ink">Curo Admin</p>
          <p className="truncate text-[11px] font-medium text-faint">Admin Portal</p>
        </div>
      </div>

      <nav className="scrollbar-hide flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {visibleItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-primary-light text-primary-dark shadow-sm"
                  : "text-muted hover:translate-x-0.5 hover:bg-bg hover:text-ink"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
                  active ? "bg-brand-gradient text-white shadow-sm" : "text-faint group-hover:text-ink"
                }`}
              >
                <item.icon size={15} />
              </span>
              <span className="flex-1 truncate text-left">{item.label}</span>
              {!item.ready && (
                <span className="shrink-0 rounded-full bg-bg px-1.5 py-0.5 text-[10px] font-medium text-faint">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-line px-5 py-3">
        <p className="text-[11px] text-faint">Curo &middot; {role ? `Signed in as ${role.name}` : "Demo build"}</p>
      </div>
    </>
  );
}

export default function AdminSidebar({ mobileOpen, onCloseMobile }: AdminSidebarProps) {
  return (
    <>
      {/* Desktop — always visible */}
      <aside className="hidden w-64 shrink-0 border-r border-line bg-surface lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile — slide-in drawer with backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={onCloseMobile} aria-hidden="true" />
          <aside className="relative flex h-full w-72 max-w-[80vw] flex-col bg-surface shadow-soft">
            <button
              onClick={onCloseMobile}
              aria-label="Close menu"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-bg hover:text-ink"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={onCloseMobile} />
          </aside>
        </div>
      )}
    </>
  );
}