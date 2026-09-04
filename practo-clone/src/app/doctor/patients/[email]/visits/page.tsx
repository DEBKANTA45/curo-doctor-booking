"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronDown, ChevronUp, ChevronRight, Calendar, Download } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { findPatientForDoctor, getVisitHistoryForDoctorAndPatient } from "@/lib/mock-db";
import { downloadPrescriptionPdf } from "@/lib/prescription-pdf";

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function VisitHistoryPage({ params }: { params: { email: string } }) {
  const { account, loading } = useAuth();
  const email = decodeURIComponent(params.email);
  // Only one visit is expanded at a time, so visits are reviewed one by one.
  const [activeIndex, setActiveIndex] = useState(0);

  const patient = useMemo(() => {
    if (!account || account.role !== "doctor") return undefined;
    return findPatientForDoctor(account.name, email);
  }, [account, email]);

  // Newest visit first.
  const visits = useMemo(() => {
    if (!account || account.role !== "doctor") return [];
    return getVisitHistoryForDoctorAndPatient(account.name, email);
  }, [account, email]);

  if (loading) return null;

  if (!account || account.role !== "doctor") {
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-ink">
          Log in to view visit history
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

  if (!patient) {
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <p className="text-sm text-muted">This patient couldn't be found in your records.</p>
        <Link href="/doctor/patients" className="mt-3 inline-block text-sm text-primary">
          Back to Patient Records
        </Link>
      </div>
    );
  }

  const goPrev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const goNext = () => setActiveIndex((i) => Math.min(visits.length - 1, i + 1));

  return (
    <div className="mx-auto max-w-content px-5 py-8">
      <Link
        href={`/doctor/patients/${encodeURIComponent(email)}`}
        className="flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft size={16} /> Back to {patient.name}'s details
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Visit History — {patient.name}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {visits.length} completed visit{visits.length !== 1 ? "s" : ""}, most recent first.
          </p>
        </div>

        {visits.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              disabled={activeIndex === 0}
              className="flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={13} /> Previous visit
            </button>
            <span className="text-xs text-muted">
              Visit {activeIndex + 1} of {visits.length}
            </span>
            <button
              onClick={goNext}
              disabled={activeIndex === visits.length - 1}
              className="flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next visit <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-line bg-surface">
        {visits.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-ink">No past visits yet</p>
            <p className="mt-1 text-sm text-muted">
              Completed consultations with this patient will show up here.
            </p>
          </div>
        ) : (
          visits.map((visit, index) => {
            const isOpen = index === activeIndex;
            return (
              <div key={visit.id} className="border-b border-line last:border-b-0">
                <button
                  onClick={() => setActiveIndex(index)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-bg"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary-dark">
                      <Calendar size={15} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {formatDate(visit.consultedAt ?? visit.date)}{" "}
                        {index === 0 && (
                          <span className="ml-1.5 rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-medium text-primary-dark">
                            Latest
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted">{visit.diagnosis || "No diagnosis recorded"}</p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="shrink-0 text-muted" /> : <ChevronDown size={16} className="shrink-0 text-muted" />}
                </button>

                {isOpen && (
                  <div className="space-y-4 border-t border-line bg-bg px-5 py-5">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted">
                      <span>Appointment: {visit.date} &middot; {visit.time}</span>
                      <span>Fee: ₹{visit.fee}</span>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase text-muted">Diagnosis</p>
                      <p className="mt-1 text-sm text-ink">{visit.diagnosis || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted">Report / notes</p>
                      <p className="mt-1 whitespace-pre-line text-sm text-ink">{visit.report || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted">Medicines prescribed</p>
                      <p className="mt-1 whitespace-pre-line text-sm text-ink">{visit.medicines || "—"}</p>
                    </div>

                    <button
                      onClick={() =>
                        downloadPrescriptionPdf({
                          doctorName: visit.doctorName,
                          doctorSpecialty: visit.doctorSpecialty,
                          patientName: visit.patientName,
                          patientEmail: visit.patientEmail,
                          date: visit.date,
                          time: visit.time,
                          diagnosis: visit.diagnosis,
                          report: visit.report,
                          medicines: visit.medicines,
                        })
                      }
                      className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:border-primary hover:bg-primary-light hover:text-primary-dark"
                    >
                      <Download size={14} /> Download prescription (PDF)
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}