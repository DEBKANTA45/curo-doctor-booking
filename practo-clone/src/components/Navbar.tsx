"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Stethoscope, ChevronDown, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUnreadNotificationCount } from "@/lib/mock-db";
import EcgOverlay from "@/components/EcgOverlay";

const patientLinks = [
  { href: "/", label: "Home" },
  { href: "/doctors", label: "Find Doctors" },
];

const signedInPatientLinks = [
  ...patientLinks,
  { href: "/appointments", label: "Appointments" },
];

// On /doctor/home there is no sidebar, so the navbar carries the full set of links.
const doctorHomeLinks = [
  { href: "/doctor/dashboard", label: "Dashboard" },
  { href: "/doctor/feedback", label: "Feedback" },
  { href: "/doctor/analytics", label: "Analytics" },
];


// Everywhere else, Dashboard/Patients/Schedule already live in the dashboard
// sidebar, so the navbar only needs the links the sidebar doesn't have.
const doctorLinks = [
  { href: "/doctor/dashboard", label: "Dashboard" },
  { href: "/doctor/feedback", label: "Feedback" },
  { href: "/doctor/analytics", label: "Analytics" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { account, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [showLogoutEcg, setShowLogoutEcg] = useState(false);

 const isDoctor = account?.role === "doctor";
const navLinks = isDoctor
  ? doctorLinks
  : account?.role === "patient"
  ? signedInPatientLinks
  : patientLinks;
  const logoHref = isDoctor ? "/doctor/home" : "/";

  useEffect(() => {
    if (account?.role === "patient") {
      setUnread(getUnreadNotificationCount(account.email));
    } else {
      setUnread(0);
    }
  }, [account, pathname]);

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
    // Don't clear the account yet — just close menus and start the
    // animation. Clearing it now would flip the current (still-mounted)
    // page into its "logged out" fallback state while the overlay is
    // still playing, so the actual logout + redirect happen together
    // once the animation completes (see onDone below).
    setMenuOpen(false);
    setOpen(false);
    setShowLogoutEcg(true);
  };

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/90 shadow-nav backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-5">
        <Link href={logoHref} className="group flex items-center gap-2.5" aria-label="Curo home">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-gradient text-white shadow-glow transition-transform duration-150 ease-out group-hover:-translate-y-0.5 group-active:scale-[0.97]">
            <Stethoscope size={19} />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            Curo
          </span>
          {isDoctor && (
            <span className="badge-primary">For doctors</span>
          )}
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center rounded-full border border-line bg-bg p-1 md:flex" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-150 ease-out ${
                pathname === link.href
                  ? "bg-surface text-primary shadow-card"
                  : "text-muted hover:bg-surface hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {account ? (
            <div className="flex items-center gap-2">
              {account.role === "patient" && (
                <Link
                  href="/appointments"
                  className="relative flex h-10 w-10 items-center justify-center rounded-md border border-line text-muted transition-[border-color,color,background-color,transform] duration-150 ease-out hover:border-primary hover:bg-primary-light hover:text-primary-dark active:scale-[0.97]"
                  aria-label="Notifications"
                >
                  <Bell size={16} />
                  {unread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-white">
                      {unread}
                    </span>
                  )}
                </Link>
              )}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm font-medium text-ink transition-[border-color,background-color,transform] duration-150 ease-out hover:border-primary hover:bg-bg active:scale-[0.97]"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-gradient text-xs font-medium text-white">
                    {account.name.charAt(0).toUpperCase()}
                  </span>
                  {account.role === "doctor" ? account.name : account.name.split(" ")[0]}
                  <ChevronDown size={14} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-md border border-line bg-surface p-1 shadow-soft">
                    {account.role === "patient" ? (
                      <>
                        <Link
                          href="/appointments"
                          className="block rounded-sm px-3 py-2 text-sm text-ink hover:bg-bg"
                          onClick={() => setMenuOpen(false)}
                        >
                          My Appointments
                        </Link>
                        <Link
                          href="/profile"
                          className="block rounded-sm px-3 py-2 text-sm text-ink hover:bg-bg"
                          onClick={() => setMenuOpen(false)}
                        >
                          My Profile
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/doctor/patients"
                          className="block rounded-sm px-3 py-2 text-sm text-ink hover:bg-bg"
                          onClick={() => setMenuOpen(false)}
                        >
                          Patients
                        </Link>
                        <Link
                          href="/doctor/profile"
                          className="block rounded-sm px-3 py-2 text-sm text-ink hover:bg-bg"
                          onClick={() => setMenuOpen(false)}
                        >
                          Profile
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full rounded-sm px-3 py-2 text-left text-sm font-medium text-accent hover:bg-accent-light"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-sm px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-bg hover:text-primary"
              >
                Log in
              </Link>
              <Link href="/register" className="btn-primary btn-md">
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-md border border-line text-ink transition-[background-color,transform] duration-150 ease-out hover:bg-bg active:scale-[0.97] md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-surface px-5 py-4 md:hidden">
          <nav className="mx-auto flex max-w-content flex-col gap-1" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-sm px-3 py-2.5 text-sm font-medium ${pathname === link.href ? "bg-primary-light text-primary-dark" : "text-ink hover:bg-bg"}`}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 h-px bg-line" />
            {account ? (
              <>
                {account.role === "patient" ? (
                  <>
                    <Link href="/appointments" className="text-sm text-ink" onClick={() => setOpen(false)}>
                      My Appointments{unread > 0 ? ` (${unread} new)` : ""}
                    </Link>
                    <Link href="/profile" className="text-sm text-ink" onClick={() => setOpen(false)}>
                      My Profile
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/doctor/patients" className="text-sm text-ink" onClick={() => setOpen(false)}>
                      Patients
                    </Link>
                    <Link href="/doctor/profile" className="text-sm text-ink" onClick={() => setOpen(false)}>
                      Profile
                    </Link>
                  </>
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

    <EcgOverlay
      show={showLogoutEcg}
      onDone={() => {
        // Reset the overlay's own visibility first — it never gets another
        // `show` transition to react to once we're on the destination page,
        // so if we skip this the ecg-draw keyframes (which loop `infinite`)
        // stay mounted and painted over the page forever instead of the
        // home page ever becoming visible.
        setShowLogoutEcg(false);
        logout();
        router.push("/");
      }}
    />
    </>
  );
}