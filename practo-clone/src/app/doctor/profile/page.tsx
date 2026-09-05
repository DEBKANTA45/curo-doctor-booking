"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  Stethoscope,
  MapPin,
  Globe2,
  FileText,
  IndianRupee,
  CalendarClock,
  BadgeCheck,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { specialties } from "@/lib/utils";
import { getCustomDoctorById, updateCustomDoctor } from "@/lib/mock-db";
import type { Doctor } from "@/lib/types";

export default function DoctorProfilePage() {
  const { account, loading, refresh } = useAuth();

  const [record, setRecord] = useState<Doctor | null>(null);

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
      const rec = getCustomDoctorById(account.doctorId);
      if (!rec) {
        setNotFoundInStore(true);
        return;
      }
      setRecord(rec);
      setSpecialtyId(rec.specialtyId);
      setCity(rec.city);
      setLocality(rec.locality);
      setClinicName(rec.clinicName);
      setConsultationFee(String(rec.consultationFee));
      setExperienceYears(String(rec.experienceYears));
      setLanguages(rec.languages.join(", "));
      setAbout(rec.about);
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
        <Link href="/doctor/login" className="btn-primary btn-md mt-6 inline-flex">
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
        <Link href="/doctor/register" className="mt-3 inline-block text-sm font-medium text-primary">
          Register as a doctor
        </Link>
      </div>
    );
  }

  const specialtyName = specialties.find((s) => s.id === specialtyId)?.name ?? account.specialty;
  const languageList = languages.split(",").map((l) => l.trim()).filter(Boolean);

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
      languages: languageList,
      about: about.trim(),
    });
    refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-lg font-semibold text-white shadow-glow">
            {account.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="section-eyebrow">My profile</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {account.name}
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              This is what patients see on your public listing
            </p>
          </div>
        </div>

        {record && (
          <Link
            href={`/doctors/${record.slug}`}
            target="_blank"
            className="btn-secondary btn-sm shrink-0"
          >
            View public profile <ExternalLink size={14} />
          </Link>
        )}
      </div>

      {/* Body */}
      <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_320px]">
        <form onSubmit={handleSave} className="min-w-0">
          <div className="card divide-y divide-line">
            {/* Practice details */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2.5">
                <span className="icon-tile-soft">
                  <Stethoscope size={18} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-ink">Practice details</h2>
                  <p className="text-xs text-muted">
                    Where and how patients can find and book you
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="specialty" className="mb-1.5 block text-xs font-medium text-muted">
                    Specialty
                  </label>
                  <select
                    id="specialty"
                    value={specialtyId}
                    onChange={(e) => setSpecialtyId(e.target.value)}
                    className="field"
                  >
                    {specialties.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="experience" className="mb-1.5 block text-xs font-medium text-muted">
                    Experience (years)
                  </label>
                  <input
                    id="experience"
                    type="number"
                    min={0}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="field"
                  />
                </div>
                <div>
                  <label htmlFor="fee" className="mb-1.5 block text-xs font-medium text-muted">
                    Consultation fee (₹)
                  </label>
                  <input
                    id="fee"
                    type="number"
                    min={0}
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value)}
                    className="field"
                  />
                </div>
                <div>
                  <label htmlFor="languages" className="mb-1.5 block text-xs font-medium text-muted">
                    Languages
                  </label>
                  <input
                    id="languages"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    placeholder="English, Hindi"
                    className="field"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="mb-1.5 block text-xs font-medium text-muted">
                    City
                  </label>
                  <input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="field"
                  />
                </div>
                <div>
                  <label htmlFor="locality" className="mb-1.5 block text-xs font-medium text-muted">
                    Locality / area
                  </label>
                  <input
                    id="locality"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="field"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="clinic" className="mb-1.5 block text-xs font-medium text-muted">
                    Clinic / hospital name
                  </label>
                  <input
                    id="clinic"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="field"
                  />
                </div>
              </div>
            </div>

            {/* About */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2.5">
                <span className="icon-tile-soft">
                  <FileText size={18} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-ink">About</h2>
                  <p className="text-xs text-muted">
                    A short note patients see on your profile
                  </p>
                </div>
              </div>
              <textarea
                rows={5}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Share your specialisation, approach to care, and what patients can expect from a visit."
                className="field mt-4 resize-none leading-relaxed"
              />
            </div>

            {/* Save bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-b-lg bg-bg/60 p-6 sm:p-8">
              <p className="text-xs text-faint">
                Changes are reflected on your public listing immediately.
              </p>
              <div className="flex items-center gap-4">
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                    <CheckCircle2 size={16} /> Saved
                  </span>
                )}
                <button type="submit" className="btn-primary btn-md">
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Live preview + shortcuts */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:h-fit">
          <div className="card p-5">
            <p className="section-eyebrow">Patient preview</p>
            <div className="mt-4 flex items-start gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm ring-1 ring-line">
                <Image
                  src={record?.photo ?? "https://i.pravatar.cc/120"}
                  alt={account.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <p className="truncate font-display text-sm font-semibold text-ink">
                    {account.name}
                  </p>
                  {record?.verified && (
                    <BadgeCheck size={14} className="shrink-0 text-primary" />
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted">{specialtyName}</p>
                <p className="text-xs text-faint">{experienceYears || 0} yrs experience</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-line pt-4 text-xs text-muted">
              <p className="flex items-start gap-1.5">
                <MapPin size={13} className="mt-0.5 shrink-0 text-cyan-dark" />
                <span>
                  {clinicName || "Clinic name"}
                  {locality ? `, ${locality}` : ""}, {city || "City"}
                </span>
              </p>
              {languageList.length > 0 && (
                <p className="flex items-start gap-1.5">
                  <Globe2 size={13} className="mt-0.5 shrink-0 text-cyan-dark" />
                  <span>{languageList.join(", ")}</span>
                </p>
              )}
              <p className="flex items-center gap-1.5 font-medium text-ink">
                <IndianRupee size={13} className="shrink-0 text-cyan-dark" />
                {consultationFee || 0} consultation fee
              </p>
            </div>
          </div>

          <div className="card flex items-start gap-3 p-5">
            <span className="icon-tile-soft shrink-0">
              <CalendarClock size={18} />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">Working hours &amp; slots</p>
              <p className="mt-1 text-xs text-muted">
                Set your availability and booking window.
              </p>
              <Link
                href="/doctor/schedule"
                className="mt-2 inline-block text-xs font-semibold text-primary"
              >
                Manage schedule →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}