"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Stethoscope } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { specialties } from "@/lib/utils";
import { getCustomDoctorById, updateCustomDoctor } from "@/lib/mock-db";

export default function DoctorProfilePage() {
  const { account, loading, refresh } = useAuth();

  const [specialtyId, setSpecialtyId] = useState("");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [languages, setLanguages] = useState("");
  const [about, setAbout] = useState("");

  const [notFoundInStore, setNotFoundInStore] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (account?.role === "doctor") {
      const record = getCustomDoctorById(account.doctorId);
      if (!record) {
        setNotFoundInStore(true);
        return;
      }
      setSpecialtyId(record.specialtyId);
      setCity(record.city);
      setLocality(record.locality);
      setClinicName(record.clinicName);
      setConsultationFee(String(record.consultationFee));
      setExperienceYears(String(record.experienceYears));
      setLanguages(record.languages.join(", "));
      setAbout(record.about);
    }
  }, [account]);

  if (loading) return null;

  if (!account || account.role !== "doctor") {
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-ink">
          Log in to view your profile
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

  if (notFoundInStore) {
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <p className="text-sm text-muted">
          This demo doctor profile isn't editable here since it wasn't created
          through self-registration. Register a new doctor account to try
          editing a profile.
        </p>
        <Link href="/doctor/register" className="mt-3 inline-block text-sm text-primary">
          Register as a doctor
        </Link>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const specialty = specialties.find((s) => s.id === specialtyId);
    updateCustomDoctor(account.doctorId, {
      specialtyId,
      specialty: specialty?.name ?? account.specialty,
      city: city.trim(),
      locality: locality.trim(),
      clinicName: clinicName.trim(),
      consultationFee: Number(consultationFee) || 0,
      experienceYears: Number(experienceYears) || 0,
      languages: languages.split(",").map((l) => l.trim()).filter(Boolean),
      about: about.trim(),
    });
    refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="mx-auto max-w-content px-5 py-8">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary-dark">
          <Stethoscope size={22} />
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Profile
          </h1>
          <p className="text-sm text-muted">
            {account.name} &middot; this is what patients see on your listing.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-8 max-w-2xl">
        <div className="rounded-lg border border-line bg-surface p-6">
          <h2 className="text-sm font-medium text-ink">Practice details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="specialty" className="text-xs text-muted">Specialty</label>
              <select
                id="specialty"
                value={specialtyId}
                onChange={(e) => setSpecialtyId(e.target.value)}
                className="mt-1 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              >
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="fee" className="text-xs text-muted">Consultation fee (₹)</label>
              <input
                id="fee"
                type="number"
                min={0}
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                className="mt-1 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="experience" className="text-xs text-muted">Experience (years)</label>
              <input
                id="experience"
                type="number"
                min={0}
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="mt-1 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="languages" className="text-xs text-muted">Languages (comma separated)</label>
              <input
                id="languages"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                placeholder="English, Hindi"
                className="mt-1 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="city" className="text-xs text-muted">City</label>
              <input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="locality" className="text-xs text-muted">Locality / area</label>
              <input
                id="locality"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="mt-1 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="clinic" className="text-xs text-muted">Clinic / hospital name</label>
              <input
                id="clinic"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="mt-1 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-line bg-surface p-6">
          <h2 className="text-sm font-medium text-ink">About</h2>
          <textarea
            rows={4}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="A short note patients see on your profile"
            className="mt-3 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
          />
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            type="submit"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Save changes
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-ink">
              <CheckCircle2 size={16} /> Saved
            </span>
          )}
        </div>
      </form>

      <div className="mt-6 max-w-2xl rounded-lg border border-dashed border-line px-5 py-4">
        <p className="text-sm text-muted">
          Setting your working hours, time slots, and booking window?{" "}
          <Link href="/doctor/schedule" className="font-medium text-primary">
            Manage your Schedule
          </Link>
        </p>
      </div>
    </div>
  );
}