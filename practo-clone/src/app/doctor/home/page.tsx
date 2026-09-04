"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, ClipboardList, LayoutDashboard, User, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Appointment } from "@/lib/types";
import { getAppointmentsForDoctor } from "@/lib/mock-db";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function DoctorHomePage() {
  const { account, loading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (account?.role === "doctor") {
      setAppointments(getAppointmentsForDoctor(account.name));
    }
  }, [account]);

  const today = todayIso();
  const todaysPending = useMemo(
    () => appointments.filter((a) => a.status === "upcoming" && a.date === today),
    [appointments, today]
  );
  const totalPending = useMemo(() => appointments.filter((a) => a.status === "upcoming").length, [appointments]);
  const totalCompleted = useMemo(() => appointments.filter((a) => a.status === "completed").length, [appointments]);

  if (loading) return null;

  if (!account || account.role !== "doctor") {
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-ink">
          Log in to your doctor account
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

  const firstName = account.name.replace(/^Dr\.?\s*/i, "").split(" ")[0];

  return (
    <div className="mx-auto max-w-content px-5 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
        Welcome back, Dr. {firstName}
      </h1>
      <p className="mt-1.5 text-sm text-muted">{account.specialty}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface p-6">
          <p className="text-xs text-muted">Patients today</p>
          <p className="mt-1.5 font-tabular text-3xl font-semibold text-ink">
            {todaysPending.length}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-6">
          <p className="text-xs text-muted">Pending overall</p>
          <p className="mt-1.5 font-tabular text-3xl font-semibold text-ink">
            {totalPending}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-6">
          <p className="text-xs text-muted">Completed</p>
          <p className="mt-1.5 font-tabular text-3xl font-semibold text-ink">
            {totalCompleted}
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Link
          href="/doctor/dashboard"
          className="group flex flex-col gap-3 rounded-lg border border-line bg-surface p-6 transition-colors hover:border-primary"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-light text-primary-dark">
            <LayoutDashboard size={18} />
          </span>
          <div>
            <p className="flex items-center gap-1 text-sm font-medium text-ink">
              Dashboard
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </p>
            <p className="mt-1 text-xs text-muted">
              See today's patients, complete consultations, reschedule visits.
            </p>
          </div>
        </Link>

        <Link
          href="/doctor/schedule"
          className="group flex flex-col gap-3 rounded-lg border border-line bg-surface p-6 transition-colors hover:border-primary"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-light text-primary-dark">
            <CalendarClock size={18} />
          </span>
          <div>
            <p className="flex items-center gap-1 text-sm font-medium text-ink">
              Schedule
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </p>
            <p className="mt-1 text-xs text-muted">
              Set your working days, hours, and how far ahead you're bookable.
            </p>
          </div>
        </Link>

        <Link
          href="/doctor/profile"
          className="group flex flex-col gap-3 rounded-lg border border-line bg-surface p-6 transition-colors hover:border-primary"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-light text-primary-dark">
            <User size={18} />
          </span>
          <div>
            <p className="flex items-center gap-1 text-sm font-medium text-ink">
              Profile
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </p>
            <p className="mt-1 text-xs text-muted">
              Update your fee, specialty, clinic, and about section.
            </p>
          </div>
        </Link>
      </div>

      {todaysPending.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-ink">Today's patients</h2>
            <Link href="/doctor/dashboard" className="flex items-center gap-1 text-sm text-primary">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {todaysPending.slice(0, 4).map((a) => (
              <Link
                key={a.id}
                href={`/doctor/consult/${a.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-4 transition-colors hover:border-primary"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-primary-dark">
                    <ClipboardList size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{a.patientName}</p>
                    <p className="text-xs text-muted">{a.reason}</p>
                  </div>
                </div>
                <p className="font-tabular text-sm text-ink">{a.time}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}