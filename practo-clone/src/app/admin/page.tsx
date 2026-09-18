"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Stethoscope,
  Users,
  CalendarCheck2,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { getAccounts, getAllDoctors, getAppointments } from "@/lib/mock-db";
import { Appointment, Doctor } from "@/lib/types";
import MiniBarChart from "@/components/miniBarChart";
import StatusBadge from "@/components/admin/StatusBadge";
import LoadingState from "@/components/admin/LoadingState";
import EmptyState from "@/components/admin/EmptyState";

function monthKey(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short" });
}

export default function AdminDashboardPage() {
  const { adminName } = useAdminAuth();
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [patientCount, setPatientCount] = useState(0);

  useEffect(() => {
    setDoctors(getAllDoctors());
    setAppointments(getAppointments());
    setPatientCount(getAccounts().filter((a) => a.role === "patient").length);
  }, []);

  const monthBuckets = useMemo(() => {
    const now = new Date();
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return months;
  }, []);

  const trend = useMemo(() => {
    const counts = new Map(monthBuckets.map((m) => [m, 0]));
    (appointments ?? []).forEach((a) => {
      const key = monthKey(a.date);
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return monthBuckets.map((m) => ({ label: monthLabel(m), value: counts.get(m) ?? 0 }));
  }, [appointments, monthBuckets]);

  if (doctors === null || appointments === null) {
    return <LoadingState label="Loading dashboard…" />;
  }

  const upcoming = appointments.filter((a) => a.status === "upcoming");
  const completed = appointments.filter((a) => a.status === "completed");
  const cancelled = appointments.filter((a) => a.status === "cancelled");
  const pendingVerifications = doctors.filter((d) => !d.verified);
  const total = appointments.length;

  const stats = [
    { label: "Total doctors", value: doctors.length, icon: Stethoscope },
    { label: "Total patients", value: patientCount, icon: Users },
    { label: "Total appointments", value: total, icon: CalendarCheck2 },
    { label: "Pending verifications", value: pendingVerifications.length, icon: BadgeCheck },
    { label: "Upcoming appointments", value: upcoming.length, icon: CalendarClock },
    { label: "Completed appointments", value: completed.length, icon: CheckCircle2 },
  ];

  const statusRows = [
    { label: "Upcoming", count: upcoming.length, className: "bg-primary" },
    { label: "Completed", count: completed.length, className: "bg-success" },
    { label: "Cancelled", count: cancelled.length, className: "bg-accent" },
  ];

  // Newest first — appointments are unshifted into storage on creation, so
  // the array is already newest-first; doctors have no createdAt field, so
  // reversing the combined (seeded + self-registered) list surfaces the
  // most recently self-registered ones first.
  const recentAppointments = [...appointments]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  const recentDoctors = [...doctors].reverse().slice(0, 5);

  return (
    <div className="p-5 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Welcome, {adminName}</h1>
      <p className="mt-1 text-sm text-muted">Here's what's happening across Curo right now.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <span className="icon-tile-soft h-9 w-9">
              <s.icon size={16} />
            </span>
            <p className="mt-3 text-xs text-muted">{s.label}</p>
            <p className="mt-1 font-tabular text-2xl font-semibold text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-6">
          <p className="text-sm font-medium text-ink">Appointments — last 6 months</p>
          <div className="mt-5">
            <MiniBarChart data={trend} />
          </div>
        </div>

        <div className="card p-6">
          <p className="text-sm font-medium text-ink">Status breakdown</p>
          <div className="mt-5 space-y-4">
            {statusRows.map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{row.label}</span>
                  <span className="font-tabular text-ink">{row.count}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-bg">
                  <div
                    className={`h-2 rounded-full ${row.className}`}
                    style={{ width: `${total ? (row.count / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">Recent appointments</p>
            <Link
              href="/admin/appointments"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="mt-4">
            {recentAppointments.length === 0 ? (
              <EmptyState title="No appointments yet" />
            ) : (
              <div className="space-y-3">
                {recentAppointments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{a.patientName}</p>
                      <p className="truncate text-xs text-muted">
                        with {a.doctorName} &middot; {a.date}
                      </p>
                    </div>
                    <StatusBadge label={a.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">Recent doctors</p>
            <Link
              href="/admin/doctors"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="mt-4">
            {recentDoctors.length === 0 ? (
              <EmptyState title="No doctors yet" />
            ) : (
              <div className="space-y-3">
                {recentDoctors.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{d.name}</p>
                      <p className="truncate text-xs text-muted">
                        {d.specialty} &middot; {d.city}
                      </p>
                    </div>
                    <StatusBadge label={d.verified ? "Verified" : "Unverified"} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}