"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarX2, Clock, Stethoscope } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Appointment } from "@/lib/types";
import { cancelAppointment, getAppointmentsForPatient } from "@/lib/mock-db";

export default function AppointmentsPage() {
  const { account, loading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (account?.role === "patient") {
      setAppointments(getAppointmentsForPatient(account.email));
    }
  }, [account]);

  const handleCancel = (id: string) => {
    cancelAppointment(id);
    if (account?.role === "patient") {
      setAppointments(getAppointmentsForPatient(account.email));
    }
  };

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

  const upcoming = appointments.filter((a) => a.status === "upcoming");
  const past = appointments.filter((a) => a.status !== "upcoming");

  return (
    <div className="mx-auto max-w-content px-5 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink">
        My appointments
      </h1>
      <p className="mt-1 text-sm text-muted">
        Welcome back, {account.name.split(" ")[0]}.
      </p>

      <div className="mt-8">
        <h2 className="text-sm font-medium text-ink">
          Upcoming ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <div className="mt-3 flex flex-col items-center gap-2 rounded-lg border border-dashed border-line py-12 text-center">
            <CalendarX2 className="text-faint" size={28} />
            <p className="text-sm text-muted">No upcoming appointments yet.</p>
            <Link href="/doctors" className="text-sm font-medium text-info">
              Find a doctor to book
            </Link>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
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
                <div className="flex items-center gap-3">
                  <span className="font-tabular text-sm text-ink">₹{a.fee}</span>
                  <button
                    onClick={() => handleCancel(a.id)}
                    className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-accent hover:border-accent"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-medium text-ink">Past &amp; cancelled</h2>
          <div className="mt-3 space-y-3">
            {past.map((a) => (
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
                <span
                  className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                    a.status === "cancelled"
                      ? "bg-accent-light text-accent"
                      : "bg-primary-light text-primary-dark"
                  }`}
                >
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
