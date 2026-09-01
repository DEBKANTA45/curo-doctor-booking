"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getPatientProfile, savePatientProfile } from "@/lib/mock-db";
import { PatientProfile } from "@/lib/types";

const emptyProfile: Omit<PatientProfile, "email"> = {
  phone: "",
  dob: "",
  gender: undefined,
  bloodGroup: "",
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
        <Link
          href="/login?redirect=/profile"
          className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
        >
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
      allergies: form.allergies?.trim(),
      medicalHistory: form.medicalHistory?.trim(),
      currentMedications: form.currentMedications?.trim(),
      emergencyContact: form.emergencyContact?.trim(),
    });
    setSaved(true);
  };

  return (
    <div className="mx-auto max-w-content px-5 py-8">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-ink">
          <UserRound size={20} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">My profile</h1>
          <p className="text-sm text-muted">
            Keep this up to date so doctors have the right context at your visit.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-8 max-w-2xl">
        <section>
          <h2 className="text-sm font-medium text-ink">Account</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted">Full name</label>
              <p className="mt-1 rounded-md border border-line bg-bg px-3.5 py-2.5 text-sm text-ink">
                {account.name}
              </p>
            </div>
            <div>
              <label className="text-xs text-muted">Email</label>
              <p className="mt-1 rounded-md border border-line bg-bg px-3.5 py-2.5 text-sm text-ink">
                {account.email}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-medium text-ink">Personal details</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="text-xs text-muted">Phone</label>
              <input
                id="phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="mt-1 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
                placeholder="98765 43210"
              />
            </div>
            <div>
              <label htmlFor="dob" className="text-xs text-muted">Date of birth</label>
              <input
                id="dob"
                type="date"
                value={form.dob}
                onChange={(e) => update("dob", e.target.value)}
                className="mt-1 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="gender" className="text-xs text-muted">Gender</label>
              <select
                id="gender"
                value={form.gender ?? ""}
                onChange={(e) => update("gender", e.target.value)}
                className="mt-1 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              >
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="bloodGroup" className="text-xs text-muted">Blood group</label>
              <input
                id="bloodGroup"
                value={form.bloodGroup}
                onChange={(e) => update("bloodGroup", e.target.value)}
                className="mt-1 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
                placeholder="O+"
              />
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-medium text-ink">Medical history</h2>
          <p className="mt-1 text-xs text-muted">
            Shared with a doctor only when you choose to bring it up at your visit.
          </p>
          <div className="mt-3 space-y-4">
            <div>
              <label htmlFor="allergies" className="text-xs text-muted">Allergies</label>
              <textarea
                id="allergies"
                rows={2}
                value={form.allergies}
                onChange={(e) => update("allergies", e.target.value)}
                placeholder="e.g. penicillin, peanuts"
                className="mt-1 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="medicalHistory" className="text-xs text-muted">
                Past conditions, surgeries, or reports worth noting
              </label>
              <textarea
                id="medicalHistory"
                rows={4}
                value={form.medicalHistory}
                onChange={(e) => update("medicalHistory", e.target.value)}
                placeholder="e.g. asthma diagnosed 2019, appendix surgery 2021"
                className="mt-1 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="currentMedications" className="text-xs text-muted">
                Current medications
              </label>
              <textarea
                id="currentMedications"
                rows={2}
                value={form.currentMedications}
                onChange={(e) => update("currentMedications", e.target.value)}
                placeholder="e.g. metformin 500mg, twice daily"
                className="mt-1 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="emergencyContact" className="text-xs text-muted">
                Emergency contact
              </label>
              <input
                id="emergencyContact"
                value={form.emergencyContact}
                onChange={(e) => update("emergencyContact", e.target.value)}
                placeholder="Name and phone number"
                className="mt-1 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </div>
          </div>
        </section>

        <div className="mt-8 flex items-center gap-4">
          <button
            type="submit"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Save profile
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-ink">
              <CheckCircle2 size={16} /> Saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}