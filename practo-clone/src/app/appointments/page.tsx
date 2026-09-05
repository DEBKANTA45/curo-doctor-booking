"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarX2,
  CalendarClock,
  CheckCircle2,
  XCircle,
  Clock,
  Stethoscope,
  Download,
  Bell,
  X,
  Star,
  UserRound,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Appointment, Notification } from "@/lib/types";
import {
  cancelAppointment,
  getAppointmentsForPatient,
  getNotifications,
  markAllNotificationsRead,
  dismissNotification,
  hasReviewedAppointment,
  addReview,
} from "@/lib/mock-db";
import { downloadPrescription } from "@/lib/utils";
import StarPicker from "@/components/StarPicker";

type Tab = "upcoming" | "completed" | "cancelled";

export default function AppointmentsPage() {
  const { account, loading, logout } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [openReviewId, setOpenReviewId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    if (account?.role === "patient") {
      const list = getAppointmentsForPatient(account.email);
      setAppointments(list);
      setNotifications(getNotifications(account.email));
      markAllNotificationsRead(account.email);
      setReviewedIds(
        new Set(list.filter((a) => hasReviewedAppointment(a.id)).map((a) => a.id))
      );
    }
  }, [account]);

  const handleDismissNotification = (id: string) => {
    dismissNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const openReviewForm = (id: string) => {
    setOpenReviewId(openReviewId === id ? null : id);
    setReviewRating(0);
    setReviewComment("");
  };

  const submitReview = (a: Appointment) => {
    if (!account || reviewRating === 0) return;
    addReview({
      doctorId: a.doctorId,
      author: account.name,
      rating: reviewRating,
      comment: reviewComment.trim(),
      date: new Date().toISOString().slice(0, 10),
      appointmentId: a.id,
    });
    setReviewedIds((prev) => new Set(prev).add(a.id));
    setOpenReviewId(null);
  };

  const handleCancel = (id: string) => {
    cancelAppointment(id);
    if (account?.role === "patient") {
      setAppointments(getAppointmentsForPatient(account.email));
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const upcoming = useMemo(() => appointments.filter((a) => a.status === "upcoming"), [appointments]);
  const completed = useMemo(() => appointments.filter((a) => a.status === "completed"), [appointments]);
  const cancelled = useMemo(() => appointments.filter((a) => a.status === "cancelled"), [appointments]);

  if (loading) return null;

  if (!account || account.role !== "patient") {
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-ink">
          Log in to see your appointments
        </h1>
        <p className="mt-2 text-sm text-muted">
          Create a patient account or log in to view and manage your bookings.
        </p>
        <Link
          href="/login?redirect=/appointments"
          className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Log in
        </Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count: number; icon: typeof CalendarClock }[] = [
    { key: "upcoming", label: "Upcoming", count: upcoming.length, icon: CalendarClock },
    { key: "completed", label: "Completed", count: completed.length, icon: CheckCircle2 },
    { key: "cancelled", label: "Cancelled", count: cancelled.length, icon: XCircle },
  ];

  return (
    <div className="flex lg:min-h-[calc(100vh-4rem)]">
            {/* Sidebar — background spans the full row height (flush with the
          navbar above and the footer below); only the content inside
          it is sticky, so the nav/logout stay visible while the list
          scrolls without the sidebar itself looking cut off partway
          down the page. */}
      <aside className="hidden shrink-0 border-r border-line bg-surface lg:block lg:w-64">
        <div className="lg:sticky lg:top-16 lg:flex lg:h-[calc(100vh-4rem)] lg:flex-col">
          <div className="flex items-center gap-3 border-b border-line px-5 py-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-medium text-white shadow-sm">
              {account.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{account.name}</p>
              <p className="truncate text-xs text-muted">{account.email}</p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
            <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-faint">
              Appointments
            </p>
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex w-full items-center gap-2.5 rounded-md border-l-2 px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                    active
                      ? "border-primary bg-primary-light text-primary-dark"
                      : "border-transparent text-muted hover:bg-bg hover:text-ink"
                  }`}
                >
                  <Icon size={16} className={active ? "text-primary" : "text-faint"} />
                  <span className="flex-1 text-left">{t.label}</span>
                  <span
                    className={`font-tabular text-xs ${active ? "text-primary-dark" : "text-faint"}`}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Bottom-pinned account actions */}
          <div className="border-t border-line px-3 py-3">
            <Link
              href="/profile"
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-bg"
            >
              <UserRound size={16} className="text-faint" />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm font-medium text-accent transition-colors hover:bg-accent-light"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        {/* Mobile tab bar (sidebar collapses to this below lg) */}
        <nav className="flex gap-1 overflow-x-auto border-b border-line bg-surface p-2 lg:hidden">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                  active
                    ? "bg-primary-light text-primary-dark"
                    : "text-muted hover:bg-bg hover:text-ink"
                }`}
              >
                <Icon size={15} className={active ? "text-primary" : "text-faint"} />
                {t.label}
                <span className={`font-tabular text-xs ${active ? "text-primary-dark" : "text-faint"}`}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mx-auto max-w-3xl px-5 py-6 lg:px-8">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
              My appointments
            </h1>
            <p className="mt-1 text-sm text-muted">
              Welcome back, {account.name.split(" ")[0]}.
            </p>
          </div>

          {notifications.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {notifications.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-2.5 rounded-md border border-line bg-primary-light px-4 py-2.5"
                >
                  <Bell size={15} className="mt-0.5 shrink-0 text-primary-dark" />
                  <p className="flex-1 text-sm text-primary-dark">{n.message}</p>
                  <button
                    onClick={() => handleDismissNotification(n.id)}
                    aria-label="Dismiss"
                    className="shrink-0 text-primary-dark/60 hover:text-primary-dark"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5">
          {tab === "upcoming" && (
            <>
              {upcoming.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line py-12 text-center">
                  <CalendarX2 className="text-faint" size={26} />
                  <p className="text-sm text-muted">No upcoming appointments yet.</p>
                  <Link href="/doctors" className="text-sm font-medium text-primary">
                    Find a doctor to book
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {upcoming.map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Stethoscope size={15} className="text-primary" />
                          <p className="text-sm font-medium text-ink">{a.doctorName}</p>
                        </div>
                        <p className="mt-1 text-xs text-muted">{a.doctorSpecialty}</p>
                        <p className="mt-2 flex items-center gap-1.5 text-sm text-ink">
                          <Clock size={14} className="text-muted" />
                          {a.date} &middot; {a.time}
                        </p>
                        <p className="mt-1 text-xs text-faint">{a.reason}</p>
                      </div>
                      <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
                        <span className="font-tabular text-sm font-medium text-ink">₹{a.fee}</span>
                        <button
                          onClick={() => handleCancel(a.id)}
                          className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:border-accent hover:bg-accent-light"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "completed" && (
            <>
              {completed.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line py-12 text-center">
                  <CalendarX2 className="text-faint" size={26} />
                  <p className="text-sm text-muted">No completed visits yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {completed.map((a) => (
                    <div key={a.id} className="rounded-lg border border-line bg-surface p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-ink">{a.doctorName}</p>
                          <p className="mt-1 text-xs text-muted">
                            {a.date} &middot; {a.time}
                          </p>
                        </div>
                        <span className="w-fit rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary-dark">
                          completed
                        </span>
                      </div>
                      {(a.diagnosis || a.report || a.medicines) && (
                        <div className="mt-2 flex flex-col gap-1 border-t border-line pt-2 text-xs text-muted">
                          {a.diagnosis && <p><span className="text-faint">Diagnosis:</span> {a.diagnosis}</p>}
                          {a.report && <p><span className="text-faint">Notes:</span> {a.report}</p>}
                          {a.medicines && <p><span className="text-faint">Prescribed:</span> {a.medicines}</p>}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => downloadPrescription(a)}
                          className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-primary"
                        >
                          <Download size={13} /> Download prescription
                        </button>
                        {reviewedIds.has(a.id) ? (
                          <span className="flex items-center gap-1 text-xs text-muted">
                            <Star size={13} className="fill-primary text-primary" /> You rated this visit
                          </span>
                        ) : (
                          <button
                            onClick={() => openReviewForm(a.id)}
                            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                              openReviewId === a.id
                                ? "border-primary bg-primary text-white"
                                : "border-line text-ink hover:border-primary"
                            }`}
                          >
                            <Star size={13} /> Rate this consultation
                          </button>
                        )}
                      </div>

                      {openReviewId === a.id && (
                        <div className="mt-3 rounded-md border border-line bg-bg p-4">
                          <p className="text-xs text-muted">Your rating for {a.doctorName}</p>
                          <div className="mt-2">
                            <StarPicker value={reviewRating} onChange={setReviewRating} />
                          </div>
                          <textarea
                            rows={2}
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Share a few words about your visit (optional)"
                            className="mt-3 w-full rounded-md border border-line px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                          />
                          <div className="mt-3 flex items-center gap-3">
                            <button
                              onClick={() => submitReview(a)}
                              disabled={reviewRating === 0}
                              className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Submit review
                            </button>
                            <button
                              onClick={() => setOpenReviewId(null)}
                              className="text-xs text-muted hover:text-ink"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "cancelled" && (
            <>
              {cancelled.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line py-12 text-center">
                  <CalendarX2 className="text-faint" size={26} />
                  <p className="text-sm text-muted">No cancelled appointments.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {cancelled.map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-col gap-2 rounded-lg border border-line bg-bg p-4 opacity-80 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink">{a.doctorName}</p>
                        <p className="mt-1 text-xs text-muted">
                          {a.date} &middot; {a.time}
                        </p>
                      </div>
                      <span className="w-fit rounded-full bg-accent-light px-2.5 py-1 text-xs font-medium text-accent">
                        cancelled
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}