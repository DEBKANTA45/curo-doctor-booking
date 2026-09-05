"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  UserRound,
  Phone,
  Activity,
  ClipboardList,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getPatientProfile, savePatientProfile } from "@/lib/mock-db";
import { PatientProfile } from "@/lib/types";

const emptyProfile: Omit<PatientProfile, "email"> = {
  phone: "",
  dob: "",
  gender: undefined,
  bloodGroup: "",
  height: "",
  weight: "",
  bloodPressure: "",
  allergies: "",
  medicalHistory: "",
  currentMedications: "",
  emergencyContact: "",
};

export default function ProfilePage() {
  const { account, loading } = useAuth();
  const [form, setForm] = useState(emptyProfile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (account?.role === "patient") {
      const existing = getPatientProfile(account.email);
      if (existing) {
        setForm({
          phone: existing.phone ?? account.phone ?? "",
          dob: existing.dob ?? "",
          gender: existing.gender,
          bloodGroup: existing.bloodGroup ?? "",
          height: existing.height ?? "",
          weight: existing.weight ?? "",
          bloodPressure: existing.bloodPressure ?? "",
          allergies: existing.allergies ?? "",
          medicalHistory: existing.medicalHistory ?? "",
          currentMedications: existing.currentMedications ?? "",
          emergencyContact: existing.emergencyContact ?? "",
        });
      } else {
        setForm((f) => ({ ...f, phone: account.phone ?? "" }));
      }
    }
  }, [account]);

  if (loading) return null;

  if (!account || account.role !== "patient") {
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-ink">
          Log in to manage your profile
        </h1>
        <p className="mt-2 text-sm text-muted">
          Your profile keeps your contact details and medical history in one place.
        </p>
        <Link href="/login?redirect=/profile" className="btn-primary btn-md mt-6 inline-flex">
          Log in
        </Link>
      </div>
    );
  }

  const update = (field: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [field]: value }) as typeof form);
    setSaved(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    savePatientProfile({
      email: account.email,
      phone: form.phone?.trim(),
      dob: form.dob,
      gender: form.gender,
      bloodGroup: form.bloodGroup?.trim(),
      height: form.height?.trim(),
      weight: form.weight?.trim(),
      bloodPressure: form.bloodPressure?.trim(),
      allergies: form.allergies?.trim(),
      medicalHistory: form.medicalHistory?.trim(),
      currentMedications: form.currentMedications?.trim(),
      emergencyContact: form.emergencyContact?.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const vitals = [
    { label: "Blood group", value: form.bloodGroup },
    { label: "Height", value: form.height },
    { label: "Weight", value: form.weight },
    { label: "Blood pressure", value: form.bloodPressure },
  ].filter((v) => v.value);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow">
          <UserRound size={22} />
        </span>
        <div>
          <p className="section-eyebrow">My profile</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {account.name}
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Keep this up to date so doctors have the right context at your visit
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_320px]">
        <form onSubmit={handleSave} className="min-w-0">
          <div className="card divide-y divide-line">
            {/* Personal details */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2.5">
                <span className="icon-tile-soft">
                  <Phone size={18} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-ink">Personal details</h2>
                  <p className="text-xs text-muted">Your contact and basic information</p>
                </div>
              </div>
              <div className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="mb-1.5 block text-xs font-medium text-muted">
                    Phone
                  </label>
                  <input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="field"
                    placeholder="98765 43210"
                  />
                </div>
                <div>
                  <label htmlFor="dob" className="mb-1.5 block text-xs font-medium text-muted">
                    Date of birth
                  </label>
                  <input
                    id="dob"
                    type="date"
                    value={form.dob}
                    onChange={(e) => update("dob", e.target.value)}
                    className="field"
                  />
                </div>
                <div>
                  <label htmlFor="gender" className="mb-1.5 block text-xs font-medium text-muted">
                    Gender
                  </label>
                  <select
                    id="gender"
                    value={form.gender ?? ""}
                    onChange={(e) => update("gender", e.target.value)}
                    className="field"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="bloodGroup" className="mb-1.5 block text-xs font-medium text-muted">
                    Blood group
                  </label>
                  <input
                    id="bloodGroup"
                    value={form.bloodGroup}
                    onChange={(e) => update("bloodGroup", e.target.value)}
                    className="field"
                    placeholder="O+"
                  />
                </div>
              </div>
            </div>

            {/* Vitals */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2.5">
                <span className="icon-tile-soft">
                  <Activity size={18} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-ink">Vitals</h2>
                  <p className="text-xs text-muted">
                    Helps your doctor prepare before you're even in the room
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-3">
                <div>
                  <label htmlFor="height" className="mb-1.5 block text-xs font-medium text-muted">
                    Height
                  </label>
                  <input
                    id="height"
                    value={form.height}
                    onChange={(e) => update("height", e.target.value)}
                    className="field"
                    placeholder="170 cm"
                  />
                </div>
                <div>
                  <label htmlFor="weight" className="mb-1.5 block text-xs font-medium text-muted">
                    Weight
                  </label>
                  <input
                    id="weight"
                    value={form.weight}
                    onChange={(e) => update("weight", e.target.value)}
                    className="field"
                    placeholder="65 kg"
                  />
                </div>
                <div>
                  <label htmlFor="bloodPressure" className="mb-1.5 block text-xs font-medium text-muted">
                    Blood pressure
                  </label>
                  <input
                    id="bloodPressure"
                    value={form.bloodPressure}
                    onChange={(e) => update("bloodPressure", e.target.value)}
                    className="field"
                    placeholder="120/80 mmHg"
                  />
                </div>
              </div>
            </div>

            {/* Medical history */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2.5">
                <span className="icon-tile-soft">
                  <ClipboardList size={18} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-ink">Medical history</h2>
                  <p className="text-xs text-muted">
                    Shared with a doctor only when you choose to bring it up at your visit
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-5">
                <div>
                  <label htmlFor="allergies" className="mb-1.5 block text-xs font-medium text-muted">
                    Allergies
                  </label>
                  <textarea
                    id="allergies"
                    rows={2}
                    value={form.allergies}
                    onChange={(e) => update("allergies", e.target.value)}
                    placeholder="e.g. penicillin, peanuts"
                    className="field resize-none leading-relaxed"
                  />
                </div>
                <div>
                  <label htmlFor="medicalHistory" className="mb-1.5 block text-xs font-medium text-muted">
                    Past conditions, surgeries, or reports worth noting
                  </label>
                  <textarea
                    id="medicalHistory"
                    rows={4}
                    value={form.medicalHistory}
                    onChange={(e) => update("medicalHistory", e.target.value)}
                    placeholder="e.g. asthma diagnosed 2019, appendix surgery 2021"
                    className="field resize-none leading-relaxed"
                  />
                </div>
                <div>
                  <label htmlFor="currentMedications" className="mb-1.5 block text-xs font-medium text-muted">
                    Current medications
                  </label>
                  <textarea
                    id="currentMedications"
                    rows={2}
                    value={form.currentMedications}
                    onChange={(e) => update("currentMedications", e.target.value)}
                    placeholder="e.g. metformin 500mg, twice daily"
                    className="field resize-none leading-relaxed"
                  />
                </div>
                <div>
                  <label htmlFor="emergencyContact" className="mb-1.5 block text-xs font-medium text-muted">
                    Emergency contact
                  </label>
                  <input
                    id="emergencyContact"
                    value={form.emergencyContact}
                    onChange={(e) => update("emergencyContact", e.target.value)}
                    placeholder="Name and phone number"
                    className="field"
                  />
                </div>
              </div>
            </div>

            {/* Save bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-b-lg bg-bg/60 p-6 sm:p-8">
              <p className="text-xs text-faint">
                Your medical history stays private unless you choose to share it.
              </p>
              <div className="flex items-center gap-4">
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                    <CheckCircle2 size={16} /> Saved
                  </span>
                )}
                <button type="submit" className="btn-primary btn-md">
                  Save profile
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Account + snapshot */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:h-fit">
          <div className="card p-5">
            <p className="section-eyebrow">Account</p>
            <div className="mt-3 space-y-2.5 text-sm">
              <p className="flex items-center gap-2 text-ink">
                <UserRound size={14} className="shrink-0 text-cyan-dark" />
                {account.name}
              </p>
              <p className="flex items-center gap-2 text-muted">
                <Mail size={14} className="shrink-0 text-cyan-dark" />
                {account.email}
              </p>
            </div>
          </div>

          <div className="card p-5">
            <p className="section-eyebrow">Health snapshot</p>
            {vitals.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {vitals.map((v) => (
                  <span
                    key={v.label}
                    className="rounded-md border border-line bg-bg px-2 py-1 text-xs font-medium text-muted"
                  >
                    {v.label}: <span className="text-ink">{v.value}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-faint">
                Fill in your vitals so this fills in automatically.
              </p>
            )}
          </div>

          <div className="card flex items-start gap-3 p-5">
            <span className="icon-tile-soft shrink-0">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">Your data stays private</p>
              <p className="mt-1 text-xs text-muted">
                Medical history is only visible to a doctor when you share it during a
                consultation.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}