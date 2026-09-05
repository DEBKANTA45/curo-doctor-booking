"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, User, History, Phone, Cake, Droplet, Activity, Ruler, Weight, ShieldAlert, ClipboardList, Pill, Contact } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { findPatientForDoctor, getPatientProfile } from "@/lib/mock-db";

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-line py-3 last:border-b-0">
      <Icon size={16} className="mt-0.5 shrink-0 text-muted" />
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm text-ink">{value?.trim() ? value : "Not provided"}</p>
      </div>
    </div>
  );
}

export default function PatientDetailsPage({ params }: { params: { email: string } }) {
  const { account, loading } = useAuth();
  const email = decodeURIComponent(params.email);

  const patient = useMemo(() => {
    if (!account || account.role !== "doctor") return undefined;
    return findPatientForDoctor(account.name, email);
  }, [account, email]);

  const profile = useMemo(() => getPatientProfile(email), [email]);

  if (loading) return null;

  if (!account || account.role !== "doctor") {
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-ink">
          Log in to view patient details
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

  return (
    <div className="mx-auto max-w-content px-5 py-8">
      <Link
        href="/doctor/patients"
        className="flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft size={16} /> Back to Patient Records
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary-dark">
              <User size={20} />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink">{patient.name}</h1>
              <p className="text-sm text-muted">{patient.email}</p>
            </div>
          </div>

          {!profile && (
            <div className="mt-6 rounded-md border border-line bg-bg px-4 py-3">
              <p className="text-sm text-ink">
                This patient hasn't added medical profile details yet.
              </p>
            </div>
          )}

          <div className="mt-6 rounded-lg border border-line bg-surface px-5">
            <DetailRow icon={Phone} label="Phone" value={profile?.phone} />
            <DetailRow icon={Cake} label="Date of birth" value={profile?.dob} />
            <DetailRow icon={User} label="Gender" value={profile?.gender} />
            <DetailRow icon={Droplet} label="Blood group" value={profile?.bloodGroup} />
            <DetailRow icon={Activity} label="Blood pressure" value={profile?.bloodPressure} />
            <DetailRow icon={Ruler} label="Height" value={profile?.height} />
            <DetailRow icon={Weight} label="Weight" value={profile?.weight} />
            <DetailRow icon={ShieldAlert} label="Allergies" value={profile?.allergies} />
            <DetailRow icon={ClipboardList} label="Medical history" value={profile?.medicalHistory} />
            <DetailRow icon={Pill} label="Current medications" value={profile?.currentMedications} />
            <DetailRow icon={Contact} label="Emergency contact" value={profile?.emergencyContact} />
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="text-sm font-medium text-ink">Visit summary</p>
            <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Total appointments</span>
                <span className="font-tabular text-ink">{patient.visitCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Completed visits</span>
                <span className="font-tabular text-ink">{patient.completedVisitCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Last activity</span>
                <span className="text-ink">{formatDate(patient.lastVisitAt)}</span>
              </div>
            </div>
            <Link
              href={`/doctor/patients/${encodeURIComponent(patient.email)}/visits`}
              className="mt-5 flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
            >
              <History size={15} /> View Visit History
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}