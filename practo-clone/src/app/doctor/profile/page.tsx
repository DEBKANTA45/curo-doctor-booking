"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Stethoscope } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { specialties } from "@/lib/utils";
import { getCustomDoctorById, updateCustomDoctor } from "@/lib/mock-db";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DoctorProfileEditPage() {
  const { account, loading, refresh } = useAuth();

  const [specialtyId, setSpecialtyId] = useState("");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [languages, setLanguages] = useState("");
  const [about, setAbout] = useState("");
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [slots, setSlots] = useState("");
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
      setAvailableDays(record.availableDays);
      setSlots(record.slots.join(", "));
    }
  }, [account]);

  if (loading) return null;

  if (!account || account.role !== "doctor") {
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-ink">
          Log in to edit your profile
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
        <Link href="/doctor/register" className="mt-3 inline-block text-sm text-info">
          Register as a doctor
        </Link>
      </div>
    );
  }

  const toggleDay = (day: string) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

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
      availableDays,
      slots: slots.split(",").map((s) => s.trim()).filter(Boolean),
    });
    refresh();
    setSaved(true);
  };

  return (
    <div className="mx-auto max-w-content px-5 py-8">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-primary-dark">
          <Stethoscope size={20} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Edit your profile
          </h1>
          <p className="text-sm text-muted">
            These details are what patients see on your listing.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-8 max-w-2xl">
        <section>
          <h2 className="text-sm font-medium text-ink">Practice details</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
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
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-medium text-ink">About</h2>
          <textarea
            rows={3}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="A short note patients see on your profile"
            className="mt-2 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
          />
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-medium text-ink">Weekly availability</h2>
          <p className="mt-1 text-xs text-muted">Days you take appointments, every week.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {weekdays.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`rounded-md border px-3.5 py-2 text-sm transition-colors ${
                  availableDays.includes(day)
                    ? "border-primary bg-primary text-white"
                    : "border-line text-ink hover:border-primary"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-medium text-ink">Time slots</h2>
          <p className="mt-1 text-xs text-muted">
            Comma separated, e.g. 10:00 AM, 11:00 AM, 04:00 PM
          </p>
          <input
            value={slots}
            onChange={(e) => setSlots(e.target.value)}
            className="mt-2 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
          />
        </section>

        <div className="mt-8 flex items-center gap-4">
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
    </div>
  );
}