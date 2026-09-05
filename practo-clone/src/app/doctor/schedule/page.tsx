"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  CalendarClock,
  CalendarDays,
  Clock,
  Users,
  User,
  Layers,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { generateSlots } from "@/lib/utils";
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

export default function DoctorSchedulePage() {
  const { account, loading, refresh } = useAuth();

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

  const visibleSlots = previewSlots.slice(0, 8);
  const extraSlots = previewSlots.length - visibleSlots.length;

  if (loading) return null;

  if (!account || account.role !== "doctor") {
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-ink">
          Log in to manage your schedule
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
          This demo doctor isn't editable here since it wasn't created through
          self-registration. Register a new doctor account to try this out.
        </p>
        <Link href="/doctor/register" className="mt-3 inline-block text-sm font-medium text-primary">
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
    updateCustomDoctor(account.doctorId, {
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
    <div className="mx-auto max-w-5xl px-5 py-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow">
          <CalendarClock size={22} />
        </span>
        <div>
          <p className="section-eyebrow">Booking settings</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Schedule
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Working days, hours, and how far ahead patients can book with you
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_320px]">
        <form onSubmit={handleSave} className="min-w-0">
          <div className="card divide-y divide-line">
            {/* Working days */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2.5">
                <span className="icon-tile-soft">
                  <CalendarDays size={18} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-ink">Working days</h2>
                  <p className="text-xs text-muted">Days you're open for appointments</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {weekdays.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      availableDays.includes(day)
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-line text-muted hover:border-primary/40 hover:bg-primary-light hover:text-primary-dark"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              <div className="mt-6 border-t border-line pt-6">
                <p className="text-xs font-medium text-muted">Open for booking between</p>
                <div className="mt-2.5 grid max-w-sm grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="scheduleStart" className="mb-1.5 block text-xs text-faint">
                      Start date
                    </label>
                    <input
                      id="scheduleStart"
                      type="date"
                      value={scheduleStart}
                      min={todayIso()}
                      onChange={(e) => setScheduleStart(e.target.value)}
                      className="field"
                    />
                  </div>
                  <div>
                    <label htmlFor="scheduleEnd" className="mb-1.5 block text-xs text-faint">
                      End date
                    </label>
                    <input
                      id="scheduleEnd"
                      type="date"
                      value={scheduleEnd}
                      min={scheduleStart}
                      onChange={(e) => setScheduleEnd(e.target.value)}
                      className="field"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-faint">
                  Leave end date blank to stay open through the end of the year.
                </p>
              </div>
            </div>

            {/* Daily hours */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2.5">
                <span className="icon-tile-soft">
                  <Clock size={18} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-ink">Daily hours</h2>
                  <p className="text-xs text-muted">How your day is split into slots</p>
                </div>
              </div>
              <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-3">
                <div>
                  <label htmlFor="slotStart" className="mb-1.5 block text-xs font-medium text-muted">
                    Day starts
                  </label>
                  <input
                    id="slotStart"
                    type="time"
                    value={slotStart}
                    onChange={(e) => setSlotStart(e.target.value)}
                    className="field"
                  />
                </div>
                <div>
                  <label htmlFor="slotEnd" className="mb-1.5 block text-xs font-medium text-muted">
                    Day ends
                  </label>
                  <input
                    id="slotEnd"
                    type="time"
                    value={slotEnd}
                    onChange={(e) => setSlotEnd(e.target.value)}
                    className="field"
                  />
                </div>
                <div>
                  <label htmlFor="duration" className="mb-1.5 block text-xs font-medium text-muted">
                    Mins / patient
                  </label>
                  <input
                    id="duration"
                    type="number"
                    min={5}
                    step={5}
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(e.target.value)}
                    className="field"
                  />
                </div>
              </div>
            </div>

            {/* Consultation type */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2.5">
                <span className="icon-tile-soft">
                  <Layers size={18} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-ink">Consultation type</h2>
                  <p className="text-xs text-muted">One-on-one visits or group sessions</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-md border border-line bg-bg p-1">
                  <button
                    type="button"
                    onClick={() => setSessionType("individual")}
                    className={`flex items-center gap-1.5 rounded-[6px] px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      sessionType === "individual"
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    <User size={14} /> Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionType("group")}
                    className={`flex items-center gap-1.5 rounded-[6px] px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      sessionType === "group"
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    <Users size={14} /> Group
                  </button>
                </div>
                {sessionType === "group" && (
                  <div className="flex items-center gap-2">
                    <label htmlFor="groupSize" className="text-xs font-medium text-muted">
                      Patients / slot
                    </label>
                    <input
                      id="groupSize"
                      type="number"
                      min={2}
                      value={groupSize}
                      onChange={(e) => setGroupSize(e.target.value)}
                      className="field w-20"
                    />
                  </div>
                )}
              </div>
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

        {/* Summary + slot preview */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:h-fit">
          <div className="card p-5">
            <p className="section-eyebrow">Schedule summary</p>
            <div className="mt-3 space-y-2.5 text-sm">
              <p className="flex items-center gap-2 text-ink">
                <CalendarDays size={14} className="shrink-0 text-cyan-dark" />
                {availableDays.length || 0} day{availableDays.length === 1 ? "" : "s"}/week
              </p>
              <p className="flex items-center gap-2 text-ink">
                <Clock size={14} className="shrink-0 text-cyan-dark" />
                {previewSlots.length} slot{previewSlots.length === 1 ? "" : "s"}/day
              </p>
              <p className="flex items-center gap-2 text-ink">
                {sessionType === "group" ? (
                  <Users size={14} className="shrink-0 text-cyan-dark" />
                ) : (
                  <User size={14} className="shrink-0 text-cyan-dark" />
                )}
                {sessionType === "group" ? `Group of ${groupSize || 1}` : "Individual visits"}
              </p>
              <p className="flex items-start gap-2 text-muted">
                <CalendarClock size={14} className="mt-0.5 shrink-0 text-cyan-dark" />
                Open {rangeLabel}
              </p>
            </div>
          </div>

          <div className="card p-5">
            <p className="section-eyebrow">Slot preview</p>
            <p className="mt-1 text-xs text-muted">What a working day looks like</p>
            {visibleSlots.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {visibleSlots.map((slot) => (
                  <span
                    key={slot}
                    className="rounded-md border border-line bg-bg px-2 py-1 font-tabular text-xs font-medium text-muted"
                  >
                    {slot}
                  </span>
                ))}
                {extraSlots > 0 && (
                  <span className="rounded-md border border-line bg-bg px-2 py-1 text-xs font-medium text-faint">
                    +{extraSlots} more
                  </span>
                )}
              </div>
            ) : (
              <p className="mt-3 text-xs text-faint">
                Set a start and end time to generate slots.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}