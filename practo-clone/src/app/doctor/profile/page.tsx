"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Stethoscope, Users, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { specialties, generateSlots } from "@/lib/utils";
import { getCustomDoctorById, updateCustomDoctor } from "@/lib/mock-db";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

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

  const [scheduleStart, setScheduleStart] = useState(todayIso());
  const [scheduleEnd, setScheduleEnd] = useState("");

  const [slotStart, setSlotStart] = useState("10:00");
  const [slotEnd, setSlotEnd] = useState("13:00");
  const [slotDuration, setSlotDuration] = useState("20");
  const [sessionType, setSessionType] = useState<"individual" | "group">("individual");
  const [groupSize, setGroupSize] = useState("4");

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
      if (record.scheduleStart) setScheduleStart(record.scheduleStart);
      if (record.scheduleEnd) setScheduleEnd(record.scheduleEnd);
      if (record.slotStart) setSlotStart(record.slotStart);
      if (record.slotEnd) setSlotEnd(record.slotEnd);
      if (record.slotDurationMinutes) setSlotDuration(String(record.slotDurationMinutes));
      if (record.sessionType) setSessionType(record.sessionType);
      if (record.groupSize) setGroupSize(String(record.groupSize));
    }
  }, [account]);

  const previewSlots = useMemo(
    () => generateSlots(slotStart, slotEnd, Number(slotDuration) || 0),
    [slotStart, slotEnd, slotDuration]
  );

  const rangeLabel = scheduleEnd
    ? `${formatDateLabel(scheduleStart)} – ${formatDateLabel(scheduleEnd)}`
    : `from ${formatDateLabel(scheduleStart)}`;

  const summary = `${availableDays.length || 0} day${availableDays.length === 1 ? "" : "s"}/week · ${previewSlots.length} slot${previewSlots.length === 1 ? "" : "s"}/day · ${sessionType === "group" ? `Group of ${groupSize || 1}` : "Individual"} · Open ${rangeLabel}`;

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
      scheduleStart,
      scheduleEnd,
      slots: previewSlots,
      slotStart,
      slotEnd,
      slotDurationMinutes: Number(slotDuration) || 0,
      sessionType,
      groupSize: sessionType === "group" ? Number(groupSize) || 1 : undefined,
    });
    refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="mx-auto max-w-content px-5 py-8">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-primary-dark">
          <Stethoscope size={20} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            My profile
          </h1>
          <p className="text-sm text-muted">
            These details, and your schedule, are what patients see on your listing.
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
          <h2 className="text-sm font-medium text-ink">Schedule</h2>

          <div className="mt-3 rounded-md border border-line bg-primary-light px-4 py-2.5">
            <p className="text-sm text-primary-dark">{summary}</p>
          </div>

          <div className="mt-4">
            <p className="text-xs text-muted">Working days</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {weekdays.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    availableDays.includes(day)
                      ? "border-primary bg-primary text-white"
                      : "border-line text-ink hover:border-primary"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs text-muted">Open for booking between</p>
            <div className="mt-1 grid grid-cols-2 gap-3 max-w-xs">
              <div>
                <label htmlFor="scheduleStart" className="text-xs text-faint">Start date</label>
                <input
                  id="scheduleStart"
                  type="date"
                  value={scheduleStart}
                  min={todayIso()}
                  onChange={(e) => setScheduleStart(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line px-2.5 py-2 text-sm text-ink outline-none focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="scheduleEnd" className="text-xs text-faint">End date</label>
                <input
                  id="scheduleEnd"
                  type="date"
                  value={scheduleEnd}
                  min={scheduleStart}
                  onChange={(e) => setScheduleEnd(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line px-2.5 py-2 text-sm text-ink outline-none focus:border-primary"
                />
              </div>
            </div>
            <p className="mt-1.5 text-xs text-faint">
              Leave end date blank to stay open through the end of the year.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="slotStart" className="text-xs text-muted">Day starts</label>
              <input
                id="slotStart"
                type="time"
                value={slotStart}
                onChange={(e) => setSlotStart(e.target.value)}
                className="mt-1 w-full rounded-md border border-line px-2.5 py-2 text-sm text-ink outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="slotEnd" className="text-xs text-muted">Day ends</label>
              <input
                id="slotEnd"
                type="time"
                value={slotEnd}
                onChange={(e) => setSlotEnd(e.target.value)}
                className="mt-1 w-full rounded-md border border-line px-2.5 py-2 text-sm text-ink outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="duration" className="text-xs text-muted">Mins/patient</label>
              <input
                id="duration"
                type="number"
                min={5}
                step={5}
                value={slotDuration}
                onChange={(e) => setSlotDuration(e.target.value)}
                className="mt-1 w-full rounded-md border border-line px-2.5 py-2 text-sm text-ink outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs text-muted">Consultation type</p>
            <div className="mt-1 flex gap-1.5">
              <button
                type="button"
                onClick={() => setSessionType("individual")}
                className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors ${
                  sessionType === "individual"
                    ? "border-primary bg-primary text-white"
                    : "border-line text-ink hover:border-primary"
                }`}
              >
                <User size={14} /> Individual
              </button>
              <button
                type="button"
                onClick={() => setSessionType("group")}
                className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors ${
                  sessionType === "group"
                    ? "border-primary bg-primary text-white"
                    : "border-line text-ink hover:border-primary"
                }`}
              >
                <Users size={14} /> Group
              </button>
              {sessionType === "group" && (
                <input
                  type="number"
                  min={2}
                  value={groupSize}
                  onChange={(e) => setGroupSize(e.target.value)}
                  aria-label="Patients per slot"
                  className="w-20 rounded-md border border-line px-2.5 py-2 text-sm text-ink outline-none focus:border-primary"
                />
              )}
            </div>
          </div>
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