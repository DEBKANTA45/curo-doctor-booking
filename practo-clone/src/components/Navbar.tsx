"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Stethoscope, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/doctors", label: "Find Doctors" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { account, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white">
            <Stethoscope size={18} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Curo
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${pathname === link.href
                  ? "text-primary font-medium"
                  : "text-muted hover:text-ink"
                }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!account && (
            <Link
              href="/doctor/login"
              className="text-sm text-muted hover:text-ink"
            >
              For Doctors
            </Link>
          )}

          {account ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm text-ink hover:border-primary"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-light text-xs font-medium text-primary-dark">
                  {account.name.charAt(0).toUpperCase()}
                </span>
                {account.role === "doctor" ? account.name : account.name.split(" ")[0]}
                <ChevronDown size={14} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border border-line bg-surface py-1 shadow-sm">
                  {account.role === "patient" ? (
                    <>
                      <Link
                        href="/appointments"
                        className="block px-4 py-2 text-sm text-ink hover:bg-bg"
                        onClick={() => setMenuOpen(false)}
                      >
                        My Appointments
                      </Link>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-ink hover:bg-bg"
                        onClick={() => setMenuOpen(false)}
                      >
                        My Profile
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/doctor/dashboard"
                        className="block px-4 py-2 text-sm text-ink hover:bg-bg"
                        onClick={() => setMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/doctor/profile"
                        className="block px-4 py-2 text-sm text-ink hover:bg-bg"
                        onClick={() => setMenuOpen(false)}
                      >
                        My Profile
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-sm text-accent hover:bg-bg"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-ink hover:text-primary"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-ink"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 h-px bg-line" />
            {account ? (
              <>
                <Link
                  href={account.role === "patient" ? "/appointments" : "/doctor/dashboard"}
                  className="text-sm text-ink"
                  onClick={() => setOpen(false)}
                >
                  {account.role === "patient" ? "My Appointments" : "Dashboard"}
                </Link>
                {account.role === "patient" && (
                  <Link href="/profile" className="text-sm text-ink" onClick={() => setOpen(false)}>
                    My Profile
                  </Link>
                )}
                {account.role === "doctor" && (
                  <Link href="/doctor/profile" className="text-sm text-ink" onClick={() => setOpen(false)}>
                    My Profile
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-left text-sm text-accent"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-ink" onClick={() => setOpen(false)}>
                  Log in
                </Link>
                <Link href="/register" className="text-sm text-primary" onClick={() => setOpen(false)}>
                  Sign up
                </Link>
                <Link href="/doctor/login" className="text-sm text-muted" onClick={() => setOpen(false)}>
                  For Doctors
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
