"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Users,
  CalendarCheck2,
  TrendingUp,
  IndianRupee,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Appointment } from "@/lib/types";
import { getAppointmentsForDoctor, getPatientsForDoctor, getAllDoctors, getRatingSummary } from "@/lib/mock-db";
import MiniBarChart from "@/components/MiniBarChart";

function monthKey(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short" });
}

export default function DoctorAnalyticsPage() {
  const { account, loading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (account?.role === "doctor") {
      setAppointments(getAppointmentsForDoctor(account.name));
    }
  }, [account]);

  const patients = useMemo(
    () => (account?.role === "doctor" ? getPatientsForDoctor(account.name) : []),
    [account]
  );

  const doctorRecord = useMemo(
    () => (account?.role === "doctor" ? getAllDoctors().find((d) => d.id === account.doctorId) : undefined),
    [account]
  );

  const ratingSummary = useMemo(
    () => (doctorRecord ? getRatingSummary(doctorRecord) : null),
    [doctorRecord]
  );

  const completed = useMemo(() => appointments.filter((a) => a.status === "completed"), [appointments]);
  const cancelled = useMemo(() => appointments.filter((a) => a.status === "cancelled"), [appointments]);
  const pending = useMemo(() => appointments.filter((a) => a.status === "upcoming"), [appointments]);
  const total = appointments.length;
  const completionRate = total ? Math.round((completed.length / total) * 100) : 0;
  const revenue = useMemo(() => completed.reduce((sum, a) => sum + a.fee, 0), [completed]);

  const trend = useMemo(() => {
    const now = new Date();
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const counts = new Map(months.map((m) => [m, 0]));
    appointments.forEach((a) => {
      const key = monthKey(a.date);
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return months.map((m) => ({ label: monthLabel(m), value: counts.get(m) ?? 0 }));
  }, [appointments]);

  const topReasons = useMemo(() => {
    const map = new Map<string, number>();
    appointments.forEach((a) => {
      const key = a.reason?.trim() || "Not specified";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [appointments]);
  const maxReason = Math.max(1, ...topReasons.map(([, c]) => c));

  if (loading) return null;

  if (!account || account.role !== "doctor") {
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-ink">
          Log in to view your analytics
        </h1>
        <Link
          href="/doctor/login"
          className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Doctor login
        </Link>
      </div>
    );
  }

  const stats = [
    { label: "Total patients", value: patients.length, icon: Users },
    { label: "Total appointments", value: total, icon: CalendarCheck2 },
    { label: "Completion rate", value: `${completionRate}%`, icon: TrendingUp },
    { label: "Revenue earned", value: `₹${revenue}`, icon: IndianRupee },
  ];

  const statusRows = [
    { label: "Pending", count: pending.length, className: "bg-accent" },
    { label: "Completed", count: completed.length, className: "bg-primary" },
    { label: "Cancelled", count: cancelled.length, className: "bg-faint" },
  ];

  return (
    <div className="mx-auto max-w-content px-5 py-8">
      <span className="section-eyebrow inline-flex items-center gap-1.5">
        <Sparkles size={13} /> Analytics
      </span>
      <h1 className="mt-1.5 font-display text-2xl font-semibold text-ink">Practice insights</h1>
      <p className="mt-1 text-sm text-muted">How your practice is performing at a glance.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="card p-6">
          <p className="text-sm font-medium text-ink">Top reasons for visits</p>
          <div className="mt-4 space-y-3">
            {topReasons.length === 0 ? (
              <p className="text-sm text-muted">No appointment data yet.</p>
            ) : (
              topReasons.map(([reason, count]) => (
                <div key={reason}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink">{reason}</span>
                    <span className="font-tabular text-muted">{count}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-bg">
                    <div
                      className="h-1.5 rounded-full bg-brand-gradient"
                      style={{ width: `${(count / maxReason) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-6">
          <p className="text-sm font-medium text-ink">Patient rating</p>
          {ratingSummary ? (
            <>
              <p className="mt-3 font-tabular text-3xl font-semibold text-ink">
                ★ {ratingSummary.rating || "New"}
              </p>
              <p className="text-xs text-muted">
                {ratingSummary.reviewCount} review{ratingSummary.reviewCount !== 1 ? "s" : ""}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">No ratings yet.</p>
          )}
          <Link
            href="/doctor/feedback"
            className="mt-4 flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark"
          >
            View all feedback <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}