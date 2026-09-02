"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ChevronLeft, Sun, Sunset, CalendarDays } from "lucide-react";
import { useDoctorBySlug } from "@/lib/hooks";
import { useAuth } from "@/context/AuthContext";
import { createAppointment } from "@/lib/mock-db";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthLabels = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatShort(d: Date) {
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function describeDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (isSameDay(date, today)) return { label: "Today", sublabel: formatShort(date) };
  if (isSameDay(date, tomorrow)) return { label: "Tomorrow", sublabel: formatShort(date) };
  return { label: formatShort(date), sublabel: "" };
}

// Today, Tomorrow, and a few more upcoming days the doctor is actually
// available — scans forward so the row never comes up short even if the
// doctor skips a day or two.
function buildQuickDays(availableDays: string[], minDate: Date, maxDate: Date, count = 4) {
  const out: string[] = [];
  const cursor = new Date(minDate);
  for (let i = 0; i < 90 && out.length < count && cursor <= maxDate; i++) {
    if (availableDays.includes(dayLabels[cursor.getDay()])) {
      out.push(toIsoDate(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

// Calendar for one month at a time — month is selectable, but only within
// the CURRENT year (no year navigation). Past days, days beyond the
// doctor's booking window, and weekdays the doctor doesn't work are disabled.
function buildMonthDays(monthIndex: number, year: number, availableDays: string[], minDate: Date, maxDate: Date) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();

  const days: { day: number; date: string; disabled: boolean }[] = [];
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, monthIndex, day);
    const outOfRange = d < minDate || d > maxDate;
    const disabled = outOfRange || !availableDays.includes(dayLabels[d.getDay()]);
    days.push({ day, date: toIsoDate(d), disabled });
  }
  return { days, leadingBlanks: new Date(year, monthIndex, 1).getDay() };
}
function groupSlots(slots: string[]) {
  return {
    morning: slots.filter((s) => s.endsWith("AM")),
    evening: slots.filter((s) => s.endsWith("PM")),
  };
}

// A doctor's self-set "open for booking" window (e.g. 2 weeks, 1 month),
// capped by the current-year restriction on the calendar itself.
// The doctor's own "open for booking" start/end dates, clamped so it never
// starts before today and never runs past the current year on the calendar.
function computeBookableRange(
  scheduleStart: string | undefined,
  scheduleEnd: string | undefined,
  currentYear: number
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yearEnd = new Date(currentYear, 11, 31);

  let min = today;
  if (scheduleStart) {
    const [y, m, d] = scheduleStart.split("-").map(Number);
    const start = new Date(y, m - 1, d);
    if (start > min) min = start;
  }

  let max = yearEnd;
  if (scheduleEnd) {
    const [y, m, d] = scheduleEnd.split("-").map(Number);
    const end = new Date(y, m - 1, d);
    if (end < max) max = end;
  }

  return { min, max };
}

export default function BookAppointmentPage({
  params,
}: {
  params: { slug: string };
}) {
  const { doctor, ready } = useDoctorBySlug(params.slug);
  const { account } = useAuth();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const { min: minBookableDate, max: maxBookableDate } = useMemo(
    () => computeBookableRange(doctor?.scheduleStart, doctor?.scheduleEnd, currentYear),
    [doctor, currentYear]
  );
  const quickDays = useMemo(
    () => (doctor ? buildQuickDays(doctor.availableDays, minBookableDate, maxBookableDate) : []),
    [doctor, minBookableDate, maxBookableDate]
  );
  const { morning, evening } = useMemo(
    () => (doctor ? groupSlots(doctor.slots) : { morning: [], evening: [] }),
    [doctor]
  );

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(currentMonth);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  
  const month = useMemo(
    () => (doctor ? buildMonthDays(calendarMonth, currentYear, doctor.availableDays, minBookableDate, maxBookableDate) : null),
    [doctor, calendarMonth, currentYear, minBookableDate, maxBookableDate]
  );

  if (!doctor) {
    if (!ready) return null;
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <p className="text-sm text-muted">Doctor not found.</p>
        <Link href="/doctors" className="mt-3 inline-block text-sm text-primary">
          Back to doctors
        </Link>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="mx-auto max-w-content px-5 py-16">
        <div className="mx-auto max-w-sm rounded-lg border border-line bg-surface p-8 text-center">
          <h1 className="font-display text-lg font-semibold text-ink">
            Log in to book with {doctor.name}
          </h1>
          <p className="mt-2 text-sm text-muted">
            You'll need a patient account to book an appointment.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={`/login?redirect=/doctors/${doctor.slug}/book`}
              className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Log in
            </Link>
            <Link
              href={`/register?redirect=/doctors/${doctor.slug}/book`}
              className="rounded-md border border-line px-4 py-2.5 text-sm font-medium text-ink hover:border-primary"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (account.role === "doctor") {
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <p className="text-sm text-muted">
          You're logged in as a doctor. Please log in with a patient account to book an appointment.
        </p>
      </div>
    );
  }

  if (confirmed) {
    const info = describeDate(selectedDate);
    return (
      <div className="mx-auto max-w-content px-5 py-16">
        <div className="mx-auto max-w-sm rounded-lg border border-line bg-surface p-8 text-center">
          <CheckCircle2 className="mx-auto text-primary" size={40} />
          <h1 className="mt-4 font-display text-lg font-semibold text-ink">
            You're all set
          </h1>
          <p className="mt-2 text-sm text-muted">
            {doctor.name} &middot; {info.label}{info.sublabel ? ` (${info.sublabel})` : ""} at {selectedTime}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/appointments"
              className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
            >
              View my appointments
            </Link>
            <Link
              href="/doctors"
              className="rounded-md border border-line px-4 py-2.5 text-sm font-medium text-ink hover:border-primary"
            >
              Find another doctor
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) {
      setError("Please choose a day and time for your visit.");
      return;
    }
    createAppointment({
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      patientEmail: account.email,
      patientName: account.name,
      date: selectedDate,
      time: selectedTime,
      fee: doctor.consultationFee,
      reason: reason.trim() || "General consultation",
    });
    setConfirmed(true);
  };

  const pickDate = (date: string) => {
    setSelectedDate(date);
    setSelectedTime("");
  };

  const renderSlotGroup = (title: string, icon: React.ReactNode, slots: string[]) => {
    if (slots.length === 0) return null;
    return (
      <div className="mt-5">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-faint">
          {icon} {title}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {slots.map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedTime(slot)}
              className={`rounded-md border px-3.5 py-2 text-sm font-tabular transition-colors ${selectedTime === slot
                ? "border-primary bg-primary text-white"
                : "border-line text-ink hover:border-primary"
                }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const selectedInfo = selectedDate ? describeDate(selectedDate) : null;
  const selectedIsQuickDay = selectedDate ? quickDays.includes(selectedDate) : false;

  return (
    <div className="mx-auto max-w-content px-5 py-8">
      <Link
        href={`/doctors/${doctor.slug}`}
        className="flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft size={16} /> Back to profile
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Book your appointment
          </h1>

          <div className="mt-6">
            <p className="text-sm font-medium text-ink">Choose a day</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {quickDays.map((date) => {
                const info = describeDate(date);
                return (
                  <button
                    key={date}
                    onClick={() => pickDate(date)}
                    className={`min-w-[104px] rounded-md border px-3.5 py-2.5 text-left transition-colors ${selectedDate === date
                      ? "border-primary bg-primary text-white"
                      : "border-line text-ink hover:border-primary"
                      }`}
                  >
                    <span className="block text-sm font-medium">{info.label}</span>
                    <span className={`block text-xs ${selectedDate === date ? "text-white/70" : "text-faint"}`}>
                      {info.sublabel}
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() => setShowCalendar((v) => !v)}
                className={`flex min-w-[104px] items-center justify-center gap-1.5 rounded-md border px-3.5 py-2.5 text-sm font-medium transition-colors ${showCalendar || (selectedDate && !selectedIsQuickDay)
                  ? "border-primary bg-primary text-white"
                  : "border-line text-ink hover:border-primary"
                  }`}
              >
                <CalendarDays size={15} />
                {selectedDate && !selectedIsQuickDay ? selectedInfo?.label : "More dates"}
              </button>
            </div>

            {showCalendar && month && (
              <div className="mt-3 max-w-xs rounded-lg border border-line p-4">
                <div className="flex items-center justify-between">
                  <select
                    value={calendarMonth}
                    onChange={(e) => setCalendarMonth(Number(e.target.value))}
                    className="rounded-md border border-line px-2.5 py-1.5 text-sm font-medium text-ink outline-none focus:border-primary"
                  >
                    {monthLabels.map((m, i) => (
                      <option key={m} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-faint">{currentYear}</span>
                </div>

                <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-faint">
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {Array.from({ length: month.leadingBlanks }).map((_, i) => (
                    <span key={`blank-${i}`} />
                  ))}
                  {month.days.map((d) => (
                    <button
                      key={d.date}
                      disabled={d.disabled}
                      onClick={() => pickDate(d.date)}
                      className={`aspect-square rounded-md text-sm transition-colors ${d.disabled
                        ? "cursor-not-allowed text-faint/60"
                        : selectedDate === d.date
                          ? "bg-primary text-white"
                          : "text-ink hover:border hover:border-primary"
                        }`}
                    >
                      {d.day}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-center text-xs text-faint">{currentYear} only</p>
              </div>
            )}
          </div>

          <div className="mt-2">
            <p className="mt-6 text-sm font-medium text-ink">Choose a time</p>
            {doctor.sessionType === "group" && (
              <p className="mt-1 text-xs text-muted">
                Group session — up to {doctor.groupSize ?? 1} patients per slot
              </p>
            )}
            {renderSlotGroup("Morning", <Sun size={13} />, morning)}
            {renderSlotGroup("Evening", <Sunset size={13} />, evening)}
          </div>

          <div className="mt-6">
            <label htmlFor="reason" className="text-sm font-medium text-ink">
              Reason for visit (optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Briefly describe your symptoms or reason for the visit"
              className="mt-2 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
            />
          </div>

          {error && <p className="mt-3 text-sm text-accent">{error}</p>}
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-lg border border-line bg-surface p-5">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-full">
                <Image src={doctor.photo} alt={doctor.name} fill sizes="48px" className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">{doctor.name}</p>
                <p className="text-xs text-muted">{doctor.specialty}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Day</span>
                <span className="text-ink">{selectedInfo?.label ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Time</span>
                <span className="font-tabular text-ink">{selectedTime || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Consultation fee</span>
                <span className="font-tabular text-ink">₹{doctor.consultationFee}</span>
              </div>
            </div>
            <button
              onClick={handleConfirm}
              className="mt-5 w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Confirm appointment
            </button>
            <p className="mt-3 text-center text-xs text-faint">
              Pay ₹{doctor.consultationFee} at the clinic during your visit
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}