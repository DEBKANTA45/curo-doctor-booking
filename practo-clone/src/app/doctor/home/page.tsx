"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  Sparkles,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Appointment } from "@/lib/types";
import { getAllDoctors, getAppointmentsForDoctor } from "@/lib/mock-db";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const quickLinks = [
  {
    href: "/doctor/dashboard",
    icon: LayoutDashboard,
    title: "Dashboard",
    description: "See today's patients, complete consultations, reschedule visits.",
  },
  {
    href: "/doctor/schedule",
    icon: CalendarClock,
    title: "Schedule",
    description: "Set your working days, hours, and how far ahead you're bookable.",
  },
  {
    href: "/doctor/profile",
    icon: User,
    title: "Profile",
    description: "Update your fee, specialty, clinic, and about section.",
  },
];

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

  const doctorRecord = useMemo(
    () => (account?.role === "doctor" ? getAllDoctors().find((d) => d.id === account.doctorId) : undefined),
    [account]
  );

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

  const stats = [
    { label: "Patients today", value: todaysPending.length },
    { label: "Pending overall", value: totalPending },
    { label: "Completed", value: totalCompleted },
  ];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute inset-0 bg-hero-radial" />

        <div className="relative mx-auto grid max-w-content gap-8 px-5 py-12 sm:py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="section-eyebrow inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1.5">
              <Sparkles size={13} /> Doctor dashboard
            </span>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-[1.15] tracking-tight text-ink sm:text-4xl">
              Welcome back,{" "}
              <span className="bg-brand-gradient bg-clip-text text-transparent">
                Dr. {firstName}
              </span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              {todaysPending.length > 0
                ? `You have ${todaysPending.length} patient${todaysPending.length > 1 ? "s" : ""} lined up for today.`
                : "You're all caught up — no patients waiting for today."}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/doctor/dashboard" className="btn-primary btn-md">
                Open dashboard <ArrowRight size={15} />
              </Link>
              <Link href="/doctor/schedule" className="btn-secondary btn-md">
                Manage schedule
              </Link>
            </div>
          </div>

          {doctorRecord && (
            <div className="hidden lg:block">
              <div className="ml-auto max-w-sm rounded-lg border border-line bg-surface p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <img
                    src={doctorRecord.photo}
                    alt={account.name}
                    className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{account.name}</p>
                    <p className="truncate text-xs text-muted">
                      {account.specialty} &middot; {doctorRecord.clinicName || "Clinic not set"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-faint">
                  <span className="badge-primary font-tabular">
                    ★ {doctorRecord.rating || "New"}
                  </span>
                  <span>₹{doctorRecord.consultationFee} per visit</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-content px-5 py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="card p-6">
              <p className="text-xs text-muted">{s.label}</p>
              <p className="mt-1.5 font-tabular text-3xl font-semibold text-ink">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="card card-hover group flex flex-col gap-3 p-6"
            >
              <span className="icon-tile-soft transition-colors duration-150 group-hover:bg-brand-gradient group-hover:text-white">
                <link.icon size={18} />
              </span>
              <div>
                <p className="flex items-center gap-1 text-sm font-medium text-ink">
                  {link.title}
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </p>
                <p className="mt-1 text-xs text-muted">{link.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {todaysPending.length > 0 && (
          <div className="mt-10">
            <div className="flex items-end justify-between">
              <div>
                <span className="section-eyebrow">Today</span>
                <h2 className="mt-1.5 font-display text-xl font-semibold text-ink">
                  Today's patients
                </h2>
              </div>
              <Link href="/doctor/dashboard" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark">
                View all <ArrowRight size={13} />
              </Link>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {todaysPending.slice(0, 4).map((a) => (
                <Link
                  key={a.id}
                  href={`/doctor/consult/${a.id}`}
                  className="card card-hover flex items-center justify-between gap-3 px-4 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="icon-tile-soft h-9 w-9">
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
    </div>
  );
}