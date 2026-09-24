"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, ChevronDown, LogOut, ShieldCheck, Settings as SettingsIcon } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import StatusBadge from "./StatusBadge";
import ConfirmActionModal from "./ConfirmActionModal";
import { adminNavItems } from "./AdminSidebar";

export default function AdminHeader({ onOpenMobileSidebar }: { onOpenMobileSidebar: () => void }) {
  const { admin, adminName, role, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentPage = adminNavItems.find((item) => item.href === pathname);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setConfirmLogout(false);
    router.push("/admin/login");
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            aria-label="Open menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted hover:bg-bg hover:text-ink lg:hidden"
          >
            <Menu size={20} />
          </button>
          {currentPage && (
            <div className="flex min-w-0 items-center gap-2">
              <currentPage.icon size={16} className="hidden shrink-0 text-primary sm:block" />
              <h1 className="truncate font-display text-base font-semibold text-ink">{currentPage.label}</h1>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-primary/40"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-light text-primary-dark">
                <ShieldCheck size={14} />
              </span>
              <span className="hidden sm:inline">{adminName}</span>
              <ChevronDown size={14} className={`text-faint transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-10 mt-1.5 w-56 rounded-md border border-line bg-surface p-1.5 shadow-soft">
                <div className="border-b border-line px-3 pb-2.5 pt-1.5">
                  <p className="truncate text-sm font-medium text-ink">{adminName}</p>
                  <p className="truncate text-xs text-muted">{admin?.email}</p>
                  {role && (
                    <div className="mt-2">
                      <StatusBadge label={role.name} variant="primary" />
                    </div>
                  )}
                </div>
                <Link
                  href="/admin/settings"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1.5 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-bg"
                >
                  <SettingsIcon size={15} className="text-faint" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmLogout(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent-light"
                >
                  <LogOut size={15} />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <ConfirmActionModal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
        title="Log out?"
        description="You'll be signed out of the Admin Portal on this device."
        confirmLabel="Log out"
        variant="danger"
      />
    </>
  );
}