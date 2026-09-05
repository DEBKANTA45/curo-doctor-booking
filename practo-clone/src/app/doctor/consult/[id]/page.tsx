"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  CheckCircle2,
  User,
  Clock,
  Download,
  Phone,
  Cake,
  Droplet,
  Activity,
  Ruler,
  Weight,
  ShieldAlert,
  ClipboardList,
  Pill,
  Contact,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Appointment, PatientProfile } from "@/lib/types";
import { getAppointmentById, completeAppointment, getPatientProfile } from "@/lib/mock-db";
import { downloadPrescription } from "@/lib/utils";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function VitalRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-start gap-2.5 border-b border-line py-2.5 last:border-b-0">
      <Icon size={15} className="mt-0.5 shrink-0 text-muted" />
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="truncate text-sm text-ink">{value?.trim() ? value : "Not provided"}</p>
      </div>
    </div>
  );
}

export default function ConsultPage({ params }: { params: { id: string } }) {
  const { account, loading } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null | undefined>(undefined);
  const [profile, setProfile] = useState<PatientProfile | null>(null);

  const [diagnosis, setDiagnosis] = useState("");
  const [report, setReport] = useState("");
  const [medicines, setMedicines] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const found = getAppointmentById(params.id) ?? null;
    setAppointment(found);
    if (found) {
      setDiagnosis(found.diagnosis ?? "");
      setReport(found.report ?? "");
      setMedicines(found.medicines ?? "");
      setProfile(getPatientProfile(found.patientEmail));
    }
  }, [params.id]);

  if (loading || appointment === undefined) return null;

  if (!account || account.role !== "doctor") {
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-ink">
          Log in to view this consultation
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

  if (!appointment || appointment.doctorName !== account.name) {
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <p className="text-sm text-muted">This consultation couldn't be found.</p>
        <Link href="/doctor/dashboard" className="mt-3 inline-block text-sm text-primary">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const isCompleted = appointment.status === "completed";
  const isToday = appointment.date === todayIso();
  const canEdit = isCompleted || isToday;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const updated = completeAppointment(appointment.id, {
      diagnosis: diagnosis.trim(),
      report: report.trim(),
      medicines: medicines.trim(),
    });
    if (updated) setAppointment(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="mx-auto max-w-content px-5 py-8">
      <Link
        href="/doctor/dashboard"
        className="flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft size={16} /> Back to dashboard
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-semibold text-ink">
              {appointment.patientName}
            </h1>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                isCompleted ? "bg-primary-light text-primary-dark" : "bg-accent-light text-accent"
              }`}
            >
              {isCompleted ? "Completed" : "Pending"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">{appointment.reason}</p>

          {!canEdit && (
            <div className="mt-6 rounded-md border border-line bg-bg px-4 py-3">
              <p className="text-sm text-ink">
                This appointment is scheduled for {appointment.date}. You can record the
                diagnosis and prescription on the day of the visit.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="diagnosis" className="text-sm font-medium text-ink">
                Diagnosis
              </label>
              <input
                id="diagnosis"
                disabled={!canEdit}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Seasonal allergic rhinitis"
                className="mt-1.5 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary disabled:bg-bg disabled:text-faint"
              />
            </div>
            <div>
              <label htmlFor="report" className="text-sm font-medium text-ink">
                Report / notes
              </label>
              <textarea
                id="report"
                rows={4}
                disabled={!canEdit}
                value={report}
                onChange={(e) => setReport(e.target.value)}
                placeholder="Findings, vitals, observations from this visit"
                className="mt-1.5 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary disabled:bg-bg disabled:text-faint"
              />
            </div>
            <div>
              <label htmlFor="medicines" className="text-sm font-medium text-ink">
                Medicines prescribed
              </label>
              <textarea
                id="medicines"
                rows={3}
                disabled={!canEdit}
                value={medicines}
                onChange={(e) => setMedicines(e.target.value)}
                placeholder="e.g. Cetirizine 10mg — once daily for 5 days"
                className="mt-1.5 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary disabled:bg-bg disabled:text-faint"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {canEdit && (
                <button
                  type="submit"
                  className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
                >
                  {isCompleted ? "Save changes" : "Complete consultation"}
                </button>
              )}
              {isCompleted && (
                <button
                  type="button"
                  onClick={() => downloadPrescription(appointment)}
                  className="flex items-center gap-1.5 rounded-md border border-line px-4 py-2.5 text-sm font-medium text-ink hover:border-primary"
                >
                  <Download size={14} /> Download prescription
                </button>
              )}
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-ink">
                  <CheckCircle2 size={16} /> Saved
                </span>
              )}
            </div>
          </form>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-lg border border-line bg-surface p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-primary-dark">
                <User size={18} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{appointment.patientName}</p>
                <p className="truncate text-xs text-muted">{appointment.patientEmail}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex items-center gap-1.5 text-ink">
                <Clock size={14} className="text-muted" />
                {appointment.date} &middot; {appointment.time}
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Fee</span>
                <span className="font-tabular text-ink">₹{appointment.fee}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-line bg-surface p-5">
            <p className="text-sm font-medium text-ink">Patient profile</p>
            {!profile && (
              <p className="mt-3 text-xs text-muted">
                This patient hasn't added medical profile details yet.
              </p>
            )}
            <div className="mt-1">
              <VitalRow icon={Phone} label="Phone" value={profile?.phone} />
              <VitalRow icon={Cake} label="Date of birth" value={profile?.dob} />
              <VitalRow icon={User} label="Gender" value={profile?.gender} />
              <VitalRow icon={Droplet} label="Blood group" value={profile?.bloodGroup} />
              <VitalRow icon={Activity} label="Blood pressure" value={profile?.bloodPressure} />
              <VitalRow icon={Ruler} label="Height" value={profile?.height} />
              <VitalRow icon={Weight} label="Weight" value={profile?.weight} />
              <VitalRow icon={ShieldAlert} label="Allergies" value={profile?.allergies} />
              <VitalRow icon={ClipboardList} label="Medical history" value={profile?.medicalHistory} />
              <VitalRow icon={Pill} label="Current medications" value={profile?.currentMedications} />
              <VitalRow icon={Contact} label="Emergency contact" value={profile?.emergencyContact} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}