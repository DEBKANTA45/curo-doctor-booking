"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarX2, Clock, Stethoscope, Download } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Appointment } from "@/lib/types";
import { cancelAppointment, getAppointmentsForPatient } from "@/lib/mock-db";
import { downloadPrescription } from "@/lib/utils";

type Tab = "upcoming" | "completed" | "cancelled";

export default function AppointmentsPage() {
  const { account, loading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tab, setTab] = useState<Tab>("upcoming");

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

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "upcoming", label: "Upcoming", count: upcoming.length },
    { key: "completed", label: "Completed", count: completed.length },
    { key: "cancelled", label: "Cancelled", count: cancelled.length },
  ];

  return (
    <div className="mx-auto max-w-content px-5 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink">
        My appointments
      </h1>
      <p className="mt-1 text-sm text-muted">
        Welcome back, {account.name.split(" ")[0]}.
      </p>

      <div className="mt-6 flex items-center gap-1 border-b border-line">
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

      {tab === "upcoming" && (
        <div className="mt-5">
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line py-12 text-center">
              <CalendarX2 className="text-faint" size={28} />
              <p className="text-sm text-muted">No upcoming appointments yet.</p>
              <Link href="/doctors" className="text-sm font-medium text-primary">
                Find a doctor to book
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
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
      )}

      {tab === "completed" && (
        <div className="mt-5">
          {completed.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line py-12 text-center">
              <CalendarX2 className="text-faint" size={28} />
              <p className="text-sm text-muted">No completed visits yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
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
                    <div className="mt-2 space-y-1 border-t border-line pt-2 text-xs text-muted">
                      {a.diagnosis && <p><span className="text-faint">Diagnosis:</span> {a.diagnosis}</p>}
                      {a.report && <p><span className="text-faint">Notes:</span> {a.report}</p>}
                      {a.medicines && <p><span className="text-faint">Prescribed:</span> {a.medicines}</p>}
                    </div>
                  )}
                  <button
                    onClick={() => downloadPrescription(a)}
                    className="mt-3 flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-primary"
                  >
                    <Download size={13} /> Download prescription
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "cancelled" && (
        <div className="mt-5">
          {cancelled.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line py-12 text-center">
              <CalendarX2 className="text-faint" size={28} />
              <p className="text-sm text-muted">No cancelled appointments.</p>
            </div>
          ) : (
            <div className="space-y-3">
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
        </div>
      )}
    </div>
  );
}