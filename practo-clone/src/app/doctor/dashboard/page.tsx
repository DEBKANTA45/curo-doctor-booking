"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarX2, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Appointment } from "@/lib/types";
import { getAppointmentsForDoctor } from "@/lib/mock-db";

export default function DoctorDashboardPage() {
  const { account, loading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (account?.role === "doctor") {
      setAppointments(getAppointmentsForDoctor(account.name));
    }
  }, [account]);

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

  const upcoming = appointments.filter((a) => a.status === "upcoming");

  return (
    <div className="mx-auto max-w-content px-5 py-10">
         <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {account.name}
          </h1>
          <p className="mt-1 text-sm text-muted">{account.specialty}</p>
        </div>
        <Link
          href="/doctor/profile"
          className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:border-primary"
        >
          Edit profile
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface p-5">
          <p className="text-xs text-muted">Upcoming appointments</p>
          <p className="mt-1 font-tabular text-2xl font-semibold text-ink">
            {upcoming.length}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-5">
          <p className="text-xs text-muted">Total bookings</p>
          <p className="mt-1 font-tabular text-2xl font-semibold text-ink">
            {appointments.length}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-5">
          <p className="text-xs text-muted">Cancelled</p>
          <p className="mt-1 font-tabular text-2xl font-semibold text-ink">
            {appointments.filter((a) => a.status === "cancelled").length}
          </p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-medium text-ink">Upcoming patients</h2>
        {upcoming.length === 0 ? (
          <div className="mt-3 flex flex-col items-center gap-2 rounded-lg border border-dashed border-line py-12 text-center">
            <CalendarX2 className="text-faint" size={28} />
            <p className="text-sm text-muted">No appointments booked yet.</p>
            <p className="max-w-xs text-xs text-faint">
              Appointments patients book under your registered name will show up here.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {upcoming.map((a) => (
              <div
                key={a.id}
                className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-primary-dark">
                    <User size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{a.patientName}</p>
                    <p className="text-xs text-muted">{a.reason}</p>
                  </div>
                </div>
                <div className="text-sm text-ink sm:text-right">
                  <p className="font-tabular">
                    {a.date} &middot; {a.time}
                  </p>
                  <p className="text-xs text-muted">₹{a.fee}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
