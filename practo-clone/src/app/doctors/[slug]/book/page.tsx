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
  return d.toISOString().slice(0, 10);
}

function formatLong(d: Date) {
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function describeDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (toIsoDate(date) === toIsoDate(today)) return { label: "Today", sublabel: formatLong(date) };
  if (toIsoDate(date) === toIsoDate(tomorrow)) return { label: "Tomorrow", sublabel: formatLong(date) };
  return { label: formatLong(date), sublabel: "" };
}

// Today / Tomorrow quick-pick buttons — only shown if the doctor is
// actually available that weekday.
function buildQuickDays(availableDays: string[]) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const out: { key: string; date: string }[] = [];
  if (availableDays.includes(dayLabels[today.getDay()])) {
    out.push({ key: "today", date: toIsoDate(today) });
  }
  if (availableDays.includes(dayLabels[tomorrow.getDay()])) {
    out.push({ key: "tomorrow", date: toIsoDate(tomorrow) });
  }
  return out;
}

// All remaining days of the CURRENT month only (no month/year navigation).
// Past days and weekdays the doctor doesn't work are disabled.
function buildMonthDays(availableDays: string[]) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const startOfToday = new Date(year, month, today.getDate());

  const days: { day: number; date: string; disabled: boolean }[] = [];
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, month, day);
    const isPast = d < startOfToday;
    const disabled = isPast || !availableDays.includes(dayLabels[d.getDay()]);
    days.push({ day, date: toIsoDate(d), disabled });
  }
  return { days, monthName: monthLabels[month], year, leadingBlanks: new Date(year, month, 1).getDay() };
}

function groupSlots(slots: string[]) {
  return {
    morning: slots.filter((s) => s.endsWith("AM")),
    evening: slots.filter((s) => s.endsWith("PM")),
  };
}

export default function BookAppointmentPage({
  params,
}: {
  params: { slug: string };
}) {
  const { doctor, ready } = useDoctorBySlug(params.slug);
  const { account } = useAuth();

  const quickDays = useMemo(() => (doctor ? buildQuickDays(doctor.availableDays) : []), [doctor]);
  const month = useMemo(() => (doctor ? buildMonthDays(doctor.availableDays) : null), [doctor]);
  const { morning, evening } = useMemo(
    () => (doctor ? groupSlots(doctor.slots) : { morning: [], evening: [] }),
    [doctor]
  );

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

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
    setShowCalendar(false);
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
              className={`rounded-md border px-3.5 py-2 text-sm font-tabular transition-colors ${
                selectedTime === slot
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
              {quickDays.map((qd) => {
                const info = describeDate(qd.date);
                return (
                  <button
                    key={qd.key}
                    onClick={() => pickDate(qd.date)}
                    className={`min-w-[120px] rounded-md border px-4 py-3 text-left transition-colors ${
                      selectedDate === qd.date
                        ? "border-primary bg-primary text-white"
                        : "border-line text-ink hover:border-primary"
                    }`}
                  >
                    <span className="block text-sm font-medium">{info.label}</span>
                    <span className={`block text-xs ${selectedDate === qd.date ? "text-white/70" : "text-faint"}`}>
                      {info.sublabel}
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() => setShowCalendar((v) => !v)}
                className={`flex min-w-[120px] items-center justify-center gap-1.5 rounded-md border px-4 py-3 text-sm font-medium transition-colors ${
                  showCalendar || (selectedInfo && !["Today", "Tomorrow"].includes(selectedInfo.label))
                    ? "border-primary bg-primary text-white"
                    : "border-line text-ink hover:border-primary"
                }`}
              >
                <CalendarDays size={15} />
                {selectedInfo && !["Today", "Tomorrow"].includes(selectedInfo.label)
                  ? selectedInfo.label
                  : "More dates"}
              </button>
            </div>

            {showCalendar && month && (
              <div className="mt-3 max-w-xs rounded-lg border border-line p-4">
                <p className="text-sm font-medium text-ink">
                  {month.monthName} {month.year}
                </p>
                <p className="mt-0.5 text-xs text-faint">This month only</p>
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
                      className={`aspect-square rounded-md text-sm transition-colors ${
                        d.disabled
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
              </div>
            )}
          </div>

          <div className="mt-2">
            <p className="mt-6 text-sm font-medium text-ink">Choose a time</p>
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