"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarX2, User, ChevronRight, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Appointment } from "@/lib/types";
import { getAppointmentsForDoctor } from "@/lib/mock-db";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Tab = "pending" | "completed" | "cancelled";

export default function DoctorDashboardPage() {
  const { account, loading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tab, setTab] = useState<Tab>("pending");
  const [dateFilter, setDateFilter] = useState(todayIso());

  useEffect(() => {
    if (account?.role === "doctor") {
      setAppointments(getAppointmentsForDoctor(account.name));
    }
  }, [account]);

  const byDate = useMemo(
    () => (dateFilter ? appointments.filter((a) => a.date === dateFilter) : appointments),
    [appointments, dateFilter]
  );

  const pending = useMemo(() => byDate.filter((a) => a.status === "upcoming"), [byDate]);
  const completed = useMemo(
    () =>
      byDate
        .filter((a) => a.status === "completed")
        .sort((a, b) => (b.consultedAt ?? "").localeCompare(a.consultedAt ?? "")),
    [byDate]
  );
  const cancelled = useMemo(() => byDate.filter((a) => a.status === "cancelled"), [byDate]);

  if (loading) return null;

  if (!account || account.role !== "doctor") {
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-ink">
          Log in to view your dashboard
        </h1>
        <p className="mt-2 text-sm text-muted">
          This area is for registered doctors on Curo.
        </p>
        <Link
          href="/doctor/login"
          className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Doctor login
        </Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count: number; list: Appointment[] }[] = [
    { key: "pending", label: "Pending", count: pending.length, list: pending },
    { key: "completed", label: "Completed", count: completed.length, list: completed },
    { key: "cancelled", label: "Cancelled", count: cancelled.length, list: cancelled },
  ];
  const active = tabs.find((t) => t.key === tab)!;

  return (
    <div className="mx-auto max-w-content px-5 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {account.name}
          </h1>
          <p className="mt-1 text-sm text-muted">{account.specialty}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <label htmlFor="dateFilter" className="text-xs text-muted">Showing</label>
        <input
          id="dateFilter"
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-md border border-line px-2.5 py-1.5 text-sm text-ink outline-none focus:border-primary"
        />
        {dateFilter && (
          <button
            onClick={() => setDateFilter("")}
            className="flex items-center gap-1 text-xs text-muted hover:text-ink"
          >
            <X size={12} /> Show all dates
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface p-5">
          <p className="text-xs text-muted">Pending</p>
          <p className="mt-1 font-tabular text-2xl font-semibold text-ink">{pending.length}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-5">
          <p className="text-xs text-muted">Completed</p>
          <p className="mt-1 font-tabular text-2xl font-semibold text-ink">{completed.length}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-5">
          <p className="text-xs text-muted">Cancelled</p>
          <p className="mt-1 font-tabular text-2xl font-semibold text-ink">{cancelled.length}</p>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-1 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-primary text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="mt-5">
        {active.list.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line py-12 text-center">
            <CalendarX2 className="text-faint" size={28} />
            <p className="text-sm text-muted">
              {dateFilter ? `No ${tab} patients on this date.` : `No ${tab} patients.`}
            </p>
          </div>
        ) : tab === "cancelled" ? (
          <div className="space-y-3">
            {cancelled.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg p-4 opacity-80"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-light text-accent">
                    <User size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{a.patientName}</p>
                    <p className="text-xs text-muted">{a.reason}</p>
                  </div>
                </div>
                <p className="font-tabular text-sm text-ink">
                  {a.date} &middot; {a.time}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {active.list.map((a) => (
              <Link
                key={a.id}
                href={`/doctor/consult/${a.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-4 transition-colors hover:border-primary"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-primary-dark">
                    <User size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{a.patientName}</p>
                    <p className="text-xs text-muted">
                      {tab === "completed" ? a.diagnosis || "No diagnosis recorded" : a.reason}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right text-sm text-ink">
                    <p className="font-tabular">
                      {a.date} &middot; {a.time}
                    </p>
                    <p className="text-xs text-muted">₹{a.fee}</p>
                  </div>
                  <ChevronRight size={16} className="text-faint" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}