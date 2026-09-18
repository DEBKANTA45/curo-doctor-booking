"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
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
  { label: "Doctors", href: "/admin/doctors", icon: Stethoscope, ready: false },
  { label: "Doctor Verification", href: "/admin/doctor-verification", icon: BadgeCheck, ready: false },
  { label: "Patients", href: "/admin/patients", icon: Users, ready: false },
  { label: "Appointments", href: "/admin/appointments", icon: CalendarDays, ready: false },
  { label: "Payments", href: "/admin/payments", icon: CreditCard, ready: false },
  { label: "Reviews", href: "/admin/reviews", icon: Star, ready: false },
  { label: "Notifications", href: "/admin/notifications", icon: Bell, ready: false },
  { label: "Reports", href: "/admin/reports", icon: FileBarChart, ready: false },
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
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-gradient text-white shadow-sm">
          <ShieldCheck size={18} />
        </span>
        <span className="font-display text-base font-semibold text-ink">Curo Admin</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {adminNavItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 rounded-md border-l-2 px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                active
                  ? "border-primary bg-primary-light text-primary-dark"
                  : "border-transparent text-muted hover:bg-bg hover:text-ink"
              }`}
            >
              <item.icon size={16} className={active ? "text-primary" : "text-faint"} />
              <span className="flex-1 text-left">{item.label}</span>
              {!item.ready && (
                <span className="rounded-full bg-bg px-1.5 py-0.5 text-[10px] font-medium text-faint">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>
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