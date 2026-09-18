"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import { adminNavItems } from "./AdminSidebar";

export default function AdminHeader({ onOpenMobileSidebar }: { onOpenMobileSidebar: () => void }) {
  const { adminName, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
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
    router.push("/admin/login");
  };

  return (
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
            <h1 className="truncate font-display text-base font-semibold text-ink">
              {currentPage.label}
            </h1>
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
            <div className="absolute right-0 top-full z-10 mt-1.5 w-44 rounded-md border border-line bg-surface p-1.5 shadow-soft">
              <button
                onClick={handleLogout}
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
  );
}