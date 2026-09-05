"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CalendarClock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { href: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctor/patients", label: "Patients", icon: Users },
  { href: "/doctor/schedule", label: "Schedule", icon: CalendarClock },
];

export default function DoctorLayout({ children }: { children: ReactNode }) {
  const { account, loading } = useAuth();
  const pathname = usePathname();

  // Home, login, and register are entry pages for doctors — full width,
  // no sidebar. Crucially this must NOT depend on auth state: on
  // /doctor/login, a successful login flips `account` from null to a
  // doctor object while still on this same URL. If the sidebar wrapper
  // appeared at that moment, the whole page subtree (including the
  // in-progress ECG animation) would unmount and remount, resetting
  // state and cancelling the redirect that's supposed to fire when the
  // animation finishes. Keeping these routes sidebar-free unconditionally
  // keeps the tree shape stable through that transition.
  const noSidebar =
    pathname === "/doctor/home" ||
    pathname === "/doctor/login" ||
    pathname === "/doctor/register";

  if (loading || !account || account.role !== "doctor" || noSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto flex max-w-[1440px]">
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-light text-primary-dark"
                    : "text-muted hover:bg-bg hover:text-ink"
                }`}
              >
                <item.icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/doctor/profile"
          className={`flex shrink-0 items-center gap-3 border-t border-line p-4 transition-colors hover:bg-bg ${
            pathname === "/doctor/profile" ? "bg-primary-light" : ""
          }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-medium text-white">
            {account.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{account.name}</p>
            <p className="truncate text-xs text-muted">{account.specialty}</p>
          </div>
        </Link>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}