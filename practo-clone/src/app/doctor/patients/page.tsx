"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, User, ChevronRight, History } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getPatientsForDoctor } from "@/lib/mock-db";

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function DoctorPatientsPage() {
  const { account, loading } = useAuth();
  const [query, setQuery] = useState("");

  const patients = useMemo(() => {
    if (!account || account.role !== "doctor") return [];
    return getPatientsForDoctor(account.name);
  }, [account]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter((p) => p.name.toLowerCase().includes(term));
  }, [patients, query]);

  if (loading) return null;

  if (!account || account.role !== "doctor") {
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-ink">
          Log in to view your patients
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

  return (
    <div className="mx-auto max-w-content px-5 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Patient Records</h1>
      <p className="mt-1 text-sm text-muted">
        Search for a patient to view their details or past visit history.
      </p>

      <div className="relative mt-6 max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patients by name…"
          className="w-full rounded-md border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-primary"
          autoFocus
        />
      </div>

      <div className="mt-6 rounded-lg border border-line bg-surface">
        {results.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-ink">
              {patients.length === 0 ? "No patients yet" : "No matching patients"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {patients.length === 0
                ? "Patients you've had appointments with will show up here."
                : "Try a different name."}
            </p>
          </div>
        ) : (
          results.map((patient) => (
            <div
              key={patient.email}
              className="flex flex-col gap-3 border-b border-line px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary-dark">
                  <User size={18} />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{patient.name}</p>
                  <p className="text-xs text-muted">
                    {patient.email} &middot; {patient.completedVisitCount} completed visit
                    {patient.completedVisitCount !== 1 ? "s" : ""} &middot; Last activity{" "}
                    {formatDate(patient.lastVisitAt)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/doctor/patients/${encodeURIComponent(patient.email)}`}
                  className="flex items-center gap-1.5 rounded-md border border-line px-3.5 py-2 text-xs font-medium text-ink hover:border-primary hover:bg-primary-light hover:text-primary-dark"
                >
                  Patient Details <ChevronRight size={13} />
                </Link>
                <Link
                  href={`/doctor/patients/${encodeURIComponent(patient.email)}/visits`}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-medium text-white hover:bg-primary-dark"
                >
                  <History size={13} /> Visit History
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}