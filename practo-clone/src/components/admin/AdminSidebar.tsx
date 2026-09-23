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
  History,
  Settings,
  X,
} from "lucide-react";

export const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, ready: true },
  { label: "Analytics Dashboard", href: "/admin/analytics", icon: BarChart3, ready: true }, // ← add this
  { label: "Doctors", href: "/admin/doctors", icon: Stethoscope, ready: true },
  { label: "Doctor Verification", href: "/admin/doctor-verification", icon: BadgeCheck, ready: true },
  { label: "Patients", href: "/admin/patients", icon: Users, ready: true },
  { label: "Appointments", href: "/admin/appointments", icon: CalendarDays, ready: true },
  { label: "Payments", href: "/admin/payments", icon: CreditCard, ready: true },
  { label: "Reviews", href: "/admin/reviews", icon: Star, ready: true },
  { label: "Notifications", href: "/admin/notifications", icon: Bell, ready: true },
  { label: "Reports", href: "/admin/reports", icon: FileBarChart, ready: true }, // ← flip to true
  { label: "Admin Users", href: "/admin/admin-users", icon: ShieldCheck, ready: false },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: History, ready: false },
  { label: "Settings", href: "/admin/settings", icon: Settings, ready: false },
];

interface AdminSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

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
        {adminNavItems.map((item) => {
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
        <p className="text-[11px] text-faint">Curo &middot; Admin</p>
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
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
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