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
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  CalendarDays,
  UserPlus,
  Repeat,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Appointment, Doctor } from "@/lib/types";
import {
  getAppointmentsForDoctor,
  getPatientsForDoctor,
  getAllDoctors,
  getRatingSummary,
  DoctorPatientSummary,
} from "@/lib/mock-db";
import MiniBarChart from "@/components/miniBarChart";

function monthKey(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short" });
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DoctorAnalyticsPage() {
  const { account, loading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<DoctorPatientSummary[]>([]);
  const [doctorRecord, setDoctorRecord] = useState<Doctor | undefined>(undefined);

  useEffect(() => {
    if (account?.role === "doctor") {
      setAppointments(getAppointmentsForDoctor(account.name));
      setPatients(getPatientsForDoctor(account.name));
      setDoctorRecord(getAllDoctors().find((d) => d.id === account.doctorId));
    }
  }, [account]);

  const ratingSummary = useMemo(
    () => (doctorRecord ? getRatingSummary(doctorRecord) : null),
    [doctorRecord]
  );

  const completed = useMemo(() => appointments.filter((a) => a.status === "completed"), [appointments]);
  const cancelled = useMemo(() => appointments.filter((a) => a.status === "cancelled"), [appointments]);
  const pending = useMemo(() => appointments.filter((a) => a.status === "upcoming"), [appointments]);
  const total = appointments.length;
  const completionRate = total ? Math.round((completed.length / total) * 100) : 0;
  const cancellationRate = total ? Math.round((cancelled.length / total) * 100) : 0;
  const revenue = useMemo(() => completed.reduce((sum, a) => sum + a.fee, 0), [completed]);

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
    appointments.forEach((a) => {
      const key = monthKey(a.date);
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return monthBuckets.map((m) => ({ label: monthLabel(m), value: counts.get(m) ?? 0 }));
  }, [appointments, monthBuckets]);

  const revenueTrend = useMemo(() => {
    const sums = new Map(monthBuckets.map((m) => [m, 0]));
    completed.forEach((a) => {
      const key = monthKey(a.consultedAt ?? a.date);
      if (sums.has(key)) sums.set(key, (sums.get(key) ?? 0) + a.fee);
    });
    return monthBuckets.map((m) => ({ label: monthLabel(m), value: sums.get(m) ?? 0 }));
  }, [completed, monthBuckets]);

  const thisMonthCount = trend[trend.length - 1]?.value ?? 0;
  const lastMonthCount = trend[trend.length - 2]?.value ?? 0;
  const appointmentDelta =
    lastMonthCount > 0
      ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
      : thisMonthCount > 0
      ? 100
      : 0;

  const thisMonthRevenue = revenueTrend[revenueTrend.length - 1]?.value ?? 0;
  const lastMonthRevenue = revenueTrend[revenueTrend.length - 2]?.value ?? 0;
  const revenueDelta =
    lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : thisMonthRevenue > 0
      ? 100
      : 0;

  const topReasons = useMemo(() => {
    const map = new Map<string, number>();
    appointments.forEach((a) => {
      const key = a.reason?.trim() || "Not specified";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [appointments]);
  const maxReason = Math.max(1, ...topReasons.map(([, c]) => c));

  const busiestDay = useMemo(() => {
    if (appointments.length === 0) return null;
    const counts = new Array(7).fill(0);
    appointments.forEach((a) => {
      const d = new Date(a.date);
      if (!Number.isNaN(d.getTime())) counts[d.getDay()]++;
    });
    const maxCount = Math.max(...counts);
    if (maxCount === 0) return null;
    const dayIndex = counts.indexOf(maxCount);
    return { day: DAY_NAMES[dayIndex], count: maxCount };
  }, [appointments]);

  const newPatientsCount = useMemo(() => patients.filter((p) => p.visitCount === 1).length, [patients]);
  const returningPatientsCount = useMemo(
    () => patients.filter((p) => p.visitCount > 1).length,
    [patients]
  );

  const insights = useMemo(() => {
    const items: string[] = [];
    if (total === 0) {
      return ["No appointment data yet — insights will show up here once you start seeing patients."];
    }
    if (total >= 5 && cancellationRate >= 20) {
      items.push(
        `${cancellationRate}% of your appointments were cancelled. Sending a reminder a day before may help reduce this.`
      );
    }
    if (total >= 5 && completionRate < 70) {
      items.push(
        `Your completion rate is ${completionRate}%. Following up on pending appointments could help more patients finish their visit.`
      );
    }
    if (ratingSummary && ratingSummary.reviewCount === 0) {
      items.push("You don't have any patient reviews yet — asking patients to leave feedback after a visit builds trust for new patients.");
    } else if (ratingSummary && ratingSummary.reviewCount >= 3 && ratingSummary.rating < 4) {
      items.push(`Your average rating is ${ratingSummary.rating} from ${ratingSummary.reviewCount} reviews. Check your recent feedback for common themes.`);
    }
    if (patients.length >= 3 && returningPatientsCount === 0) {
      items.push("All your patients so far are first-time visits. Encouraging follow-up bookings can improve continuity of care.");
    }
    if (lastMonthCount > 0 && appointmentDelta <= -20) {
      items.push(`Appointments are down ${Math.abs(appointmentDelta)}% from last month. Updating your available slots or profile may help visibility.`);
    }
    if (lastMonthCount > 0 && appointmentDelta >= 20) {
      items.push(`Appointments are up ${appointmentDelta}% from last month — great momentum, keep your schedule updated to match demand.`);
    }
    if (items.length === 0) {
      items.push("Your practice metrics look healthy right now — no urgent action needed.");
    }
    return items.slice(0, 4);
  }, [total, cancellationRate, completionRate, ratingSummary, patients.length, returningPatientsCount, lastMonthCount, appointmentDelta]);

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
    { label: "Total patients", value: patients.length, icon: Users, delta: null as number | null },
    {
      label: "Total appointments",
      value: total,
      icon: CalendarCheck2,
      delta: lastMonthCount > 0 ? appointmentDelta : null,
    },
    { label: "Completion rate", value: `${completionRate}%`, icon: TrendingUp, delta: null as number | null },
    {
      label: "Revenue earned",
      value: `₹${revenue}`,
      icon: IndianRupee,
      delta: lastMonthRevenue > 0 ? revenueDelta : null,
    },
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
            <div className="mt-1 flex items-center gap-2">
              <p className="font-tabular text-2xl font-semibold text-ink">{s.value}</p>
              {s.delta !== null && (
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium ${
                    s.delta >= 0 ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {s.delta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {Math.abs(s.delta)}%
                </span>
              )}
            </div>
            {s.delta !== null && <p className="mt-0.5 text-[11px] text-faint">vs last month</p>}
          </div>
        ))}
      </div>

      <div className="mt-6 card border-primary/20 bg-primary-light/40 p-6">
        <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <Lightbulb size={16} className="text-primary" /> Insights & recommendations
        </p>
        <ul className="mt-3 space-y-2">
          {insights.map((insight, i) => (
            <li key={i} className="flex gap-2 text-sm text-ink/90">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              {insight}
            </li>
          ))}
        </ul>
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

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-6">
          <p className="text-sm font-medium text-ink">Revenue — last 6 months</p>
          <div className="mt-5">
            <MiniBarChart data={revenueTrend} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="card p-5">
            <span className="icon-tile-soft h-9 w-9">
              <CalendarDays size={16} />
            </span>
            <p className="mt-3 text-xs text-muted">Busiest day</p>
            <p className="mt-1 font-tabular text-xl font-semibold text-ink">
              {busiestDay ? busiestDay.day : "—"}
            </p>
            <p className="mt-0.5 text-[11px] text-faint">
              {busiestDay ? `${busiestDay.count} appointments` : "Not enough data yet"}
            </p>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-4">
              <div>
                <span className="icon-tile-soft h-9 w-9">
                  <UserPlus size={16} />
                </span>
                <p className="mt-2 text-xs text-muted">New patients</p>
                <p className="mt-0.5 font-tabular text-lg font-semibold text-ink">{newPatientsCount}</p>
              </div>
              <div className="border-l border-line pl-4">
                <span className="icon-tile-soft h-9 w-9">
                  <Repeat size={16} />
                </span>
                <p className="mt-2 text-xs text-muted">Returning</p>
                <p className="mt-0.5 font-tabular text-lg font-semibold text-ink">{returningPatientsCount}</p>
              </div>
            </div>
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