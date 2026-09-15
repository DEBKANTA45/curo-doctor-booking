"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ChevronLeft, Sunrise, Sun, Sunset, CalendarDays, BadgeCheck, MapPin, Globe2, CreditCard, Lock, Loader2, Clock, X } from "lucide-react";
import { useDoctorBySlug } from "@/lib/hooks";
import { useAuth } from "@/context/AuthContext";
import { createAppointment, getRatingSummary, getAllReviewsForDoctor, isSlotTaken } from "@/lib/mock-db";
import RatingStars from "@/components/RatingStars";

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

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
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
// the CURRENT year (no year navigation). Past days and weekdays the doctor
// doesn't work are disabled.
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

// Parses "10:00 AM" / "02:30 PM" into a 24-hour hour value.
function parseSlotHour(slot: string): number {
  const [time, period] = slot.split(" ");
  const [hourStr] = time.split(":");
  let hour = parseInt(hourStr, 10) % 12;
  if (period === "PM") hour += 12;
  return hour;
}

// Morning: before noon. Afternoon: noon to before 4pm. Evening: 4pm onward.
// (A plain AM/PM split was lumping 12–4pm into "evening", which read wrong.)
function groupSlots(slots: string[]) {
  const morning: string[] = [];
  const afternoon: string[] = [];
  const evening: string[] = [];
  for (const slot of slots) {
    const hour = parseSlotHour(slot);
    if (hour < 12) morning.push(slot);
    else if (hour < 16) afternoon.push(slot);
    else evening.push(slot);
  }
  return { morning, afternoon, evening };
}
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
  const { morning, afternoon, evening } = useMemo(
    () => (doctor ? groupSlots(doctor.slots) : { morning: [], afternoon: [], evening: [] }),
    [doctor]
  );

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(currentMonth);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"details" | "payment">("details");
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi">("card");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const selectedInfo = selectedDate ? describeDate(selectedDate) : null;
  const selectedIsQuickDay = selectedDate ? quickDays.includes(selectedDate) : false;

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

  const handleProceedToPayment = () => {
    if (!selectedDate || !selectedTime) {
      setError("Please choose a day and time for your visit.");
      return;
    }
    setError("");
    setStep("payment");
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");

    if (paymentMethod === "upi") {
      if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim())) {
        setPaymentError("Enter a valid UPI ID, e.g. yourname@upi.");
        return;
      }
    } else {
      const digitsOnly = cardNumber.replace(/\s/g, "");
      if (digitsOnly.length !== 16 || !/^\d+$/.test(digitsOnly)) {
        setPaymentError("Enter a valid 16-digit card number.");
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        setPaymentError("Enter expiry as MM/YY.");
        return;
      }
      if (!/^\d{3,4}$/.test(cardCvv)) {
        setPaymentError("Enter a valid CVV.");
        return;
      }
      if (!cardName.trim()) {
        setPaymentError("Enter the name on the card.");
        return;
      }
    }

    setProcessingPayment(true);
    // This is a demo — no real payment gateway is involved. We simulate a
    // brief processing delay so the flow feels real, then confirm the
    // booking exactly as before.
    setTimeout(() => {
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
      setProcessingPayment(false);
      setConfirmed(true);
    }, 1400);
  };

  if (step === "payment") {
    return (
      <div className="mx-auto max-w-content px-5 py-10">
        <button
          onClick={() => setStep("details")}
          className="flex items-center gap-1 text-sm text-muted hover:text-ink"
        >
          <ChevronLeft size={16} /> Back to appointment details
        </button>

        <div className="mx-auto mt-6 max-w-md rounded-lg border border-line bg-surface p-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary-light text-primary">
            <CreditCard size={20} />
          </span>
          <h1 className="mt-5 font-display text-xl font-semibold text-ink">
            Complete your payment
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {doctor.name} &middot; {selectedInfo?.label}{selectedInfo?.sublabel ? ` (${selectedInfo.sublabel})` : ""} at {selectedTime}
          </p>

          <div className="mt-5 flex items-center justify-between rounded-md bg-bg px-4 py-3 text-sm">
            <span className="text-muted">Amount to pay</span>
            <span className="font-tabular text-lg font-semibold text-ink">₹{doctor.consultationFee}</span>
          </div>

          <div className="mt-5 inline-flex w-full items-center gap-1 rounded-md border border-line bg-bg p-1">
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              className={`flex-1 rounded-sm px-4 py-1.5 text-sm font-medium transition-colors ${paymentMethod === "card" ? "bg-surface text-primary shadow-card" : "text-muted hover:text-ink"
                }`}
            >
              Card
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("upi")}
              className={`flex-1 rounded-sm px-4 py-1.5 text-sm font-medium transition-colors ${paymentMethod === "upi" ? "bg-surface text-primary shadow-card" : "text-muted hover:text-ink"
                }`}
            >
              UPI
            </button>
          </div>

          <form onSubmit={handlePay} className="mt-6 space-y-4">
            {paymentMethod === "upi" ? (
              <div>
                <label htmlFor="upiId" className="text-sm font-medium text-ink">
                  UPI ID
                </label>
                <input
                  id="upiId"
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
                  placeholder="yourname@upi"
                />
                <p className="mt-1.5 text-xs text-faint">
                  You'll get a payment request on your UPI app to approve.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="cardName" className="text-sm font-medium text-ink">
                    Name on card
                  </label>
                  <input
                    id="cardName"
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="As it appears on the card"
                  />
                </div>

                <div>
                  <label htmlFor="cardNumber" className="text-sm font-medium text-ink">
                    Card number
                  </label>
                  <input
                    id="cardNumber"
                    type="text"
                    inputMode="numeric"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className="mt-1.5 w-full rounded-md border border-line bg-surface px-3.5 py-2.5 font-tabular text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="1234 5678 9012 3456"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label htmlFor="cardExpiry" className="text-sm font-medium text-ink">
                      Expiry
                    </label>
                    <input
                      id="cardExpiry"
                      type="text"
                      inputMode="numeric"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      className="mt-1.5 w-full rounded-md border border-line bg-surface px-3.5 py-2.5 font-tabular text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="cardCvv" className="text-sm font-medium text-ink">
                      CVV
                    </label>
                    <input
                      id="cardCvv"
                      type="text"
                      inputMode="numeric"
                      required
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="mt-1.5 w-full rounded-md border border-line bg-surface px-3.5 py-2.5 font-tabular text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
                      placeholder="123"
                    />
                  </div>
                </div>
              </>
            )}

            {paymentError && <p className="text-sm text-accent">{paymentError}</p>}

            <button
              type="submit"
              disabled={processingPayment}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processingPayment ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Processing payment…
                </>
              ) : (
                `Pay ₹${doctor.consultationFee}`
              )}
            </button>
          </form>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-faint">
            <Lock size={12} /> This is a demo checkout — no real payment is processed.
          </p>
        </div>
      </div>
    );
  }

  const pickDate = (date: string) => {
    setSelectedDate(date);
    setSelectedTime("");
    setSlotModalOpen(false);
  };

  const renderSlotGroup = (title: string, icon: React.ReactNode, slots: string[]) => {
    if (slots.length === 0) return null;
    return (
      <div className="mt-5">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-faint">
          {icon} {title}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {slots.map((slot) => {
            const taken = selectedDate ? isSlotTaken(doctor.id, selectedDate, slot) : false;
            return (
              <button
                key={slot}
                disabled={taken}
                onClick={() => {
                  setSelectedTime(slot);
                  setSlotModalOpen(false);
                }}
                className={`rounded-md border px-3.5 py-2 text-sm font-tabular transition-colors ${taken
                    ? "cursor-not-allowed border-line bg-bg text-faint line-through"
                    : selectedTime === slot
                      ? "border-primary bg-primary text-white"
                      : "border-line text-ink hover:border-primary"
                  }`}
              >
                {slot}
                {taken && <span className="ml-1 text-[10px] no-underline">(Booked)</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const { rating, reviewCount } = getRatingSummary(doctor);
  const reviews = getAllReviewsForDoctor(doctor.id);
  return (
    <div className="mx-auto max-w-content px-5 py-8">
      <Link
        href={`/doctors/${doctor.slug}`}
        className="flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft size={16} /> Back to profile
      </Link>

      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink">
        Book your appointment
      </h1>

        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1fr_400px]">
        {/* LEFT — complete doctor information */}
        <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-line bg-surface p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-line">
              <Image src={doctor.photo} alt={doctor.name} fill sizes="96px" className="object-cover" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="font-display text-xl font-semibold text-ink">{doctor.name}</p>
                {doctor.verified && (
                  <BadgeCheck size={17} className="text-primary" aria-label="Verified doctor" />
                )}
              </div>
              <p className="mt-1 text-sm text-muted">
                {doctor.specialty} &middot; {doctor.qualifications}
              </p>
              <p className="mt-1 text-sm text-faint">{doctor.experienceYears} years experience</p>
              {reviewCount > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <RatingStars rating={rating} />
                  <span className="font-tabular text-sm text-muted">
                    {rating} ({reviewCount})
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-1.5 border-t border-line pt-5 text-sm text-muted">
            <p className="flex items-center gap-1.5">
              <MapPin size={15} className="shrink-0" />
              {doctor.clinicName}{doctor.locality ? `, ${doctor.locality}` : ""}, {doctor.city}
            </p>
            <p className="flex items-center gap-1.5">
              <Globe2 size={15} className="shrink-0" />
              {doctor.languages.join(", ")}
            </p>
          </div>

          {doctor.about && (
            <div className="mt-5 border-t border-line pt-5">
              <p className="text-sm font-medium text-ink">About</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{doctor.about}</p>
            </div>
          )}

          {doctor.sessionType === "group" && (
            <div className="mt-5 rounded-md border border-line bg-primary-light px-4 py-2.5">
              <p className="text-sm text-primary-dark">
                Group session — up to {doctor.groupSize ?? 1} patients per slot
              </p>
            </div>
          )}

          




              </div>

        <div className="rounded-lg border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-semibold text-ink">
            Patient reviews ({reviews.length})
          </h2>
          {reviews.length > 0 ? (
            <div className="mt-4 space-y-5">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-line pb-5 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink">{review.author}</p>
                    <RatingStars rating={review.rating} size={12} />
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm leading-relaxed text-muted">{review.comment}</p>
                  )}
                  <p className="mt-1.5 text-xs text-faint">{review.date}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">No reviews yet for this doctor.</p>
          )}
        </div>
        </div>

        {/* RIGHT — date, slot, and confirmation */}
        <div className="rounded-lg border border-line bg-surface p-6 lg:sticky lg:top-24 lg:h-fit">
          <p className="text-sm font-medium text-ink">Choose a day</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {quickDays.map((date) => {
              const info = describeDate(date);
              return (
                <button
                  key={date}
                  onClick={() => pickDate(date)}
                  className={`min-w-[96px] rounded-md border px-3 py-2 text-left transition-colors ${selectedDate === date
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
              className={`flex min-w-[96px] items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${showCalendar || (selectedDate && !selectedIsQuickDay)
                  ? "border-primary bg-primary text-white"
                  : "border-line text-ink hover:border-primary"
                }`}
            >
              <CalendarDays size={15} />
              {selectedDate && !selectedIsQuickDay ? selectedInfo?.label : "More"}
            </button>
          </div>

          {showCalendar && month && (
            <div className="mt-3 rounded-lg border border-line p-4">
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

          <div className="mt-6">
            <p className="text-sm font-medium text-ink">Choose a time</p>
            <button
              type="button"
              onClick={() => selectedDate && setSlotModalOpen(true)}
              disabled={!selectedDate}
              className={`mt-2.5 flex w-full items-center justify-between rounded-md border px-4 py-3 text-sm transition-colors ${!selectedDate
                  ? "cursor-not-allowed border-line bg-bg text-faint"
                  : "border-line text-ink hover:border-primary"
                }`}
            >
              <span className="flex items-center gap-2">
                <Clock size={16} className={selectedTime ? "text-primary" : "text-faint"} />
                {selectedTime ? (
                  <span className="font-tabular font-medium text-ink">{selectedTime}</span>
                ) : (
                  <span>{selectedDate ? "Choose a time slot" : "Select a date first"}</span>
                )}
              </span>
              {selectedTime && <span className="text-xs font-medium text-primary">Change</span>}
            </button>
          </div>

          {slotModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-4"
              onClick={() => setSlotModalOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="max-h-[80vh] w-full overflow-y-auto rounded-t-xl border border-line bg-surface p-6 shadow-soft animate-ecg-fade-in sm:max-w-md sm:rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold text-ink">Choose a time</h3>
                  <button
                    onClick={() => setSlotModalOpen(false)}
                    aria-label="Close"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-bg hover:text-ink"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {selectedInfo?.label}
                  {selectedInfo?.sublabel ? ` (${selectedInfo.sublabel})` : ""}
                </p>

                {renderSlotGroup("Morning", <Sunrise size={13} />, morning)}
                {renderSlotGroup("Afternoon", <Sun size={13} />, afternoon)}
                {renderSlotGroup("Evening", <Sunset size={13} />, evening)}

                {morning.length === 0 && afternoon.length === 0 && evening.length === 0 && (
                  <p className="mt-4 text-sm text-muted">No time slots available for this doctor.</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-6">
            <label htmlFor="reason" className="text-sm font-medium text-ink">
              Reason for visit (optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Briefly describe your symptoms"
              className="mt-2 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
            />
          </div>

          {error && <p className="mt-3 text-sm text-accent">{error}</p>}

          <div className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
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
            onClick={handleProceedToPayment}
            className="mt-5 w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Proceed to payment
          </button>
               </div>
           </div>
    </div>
  );
}