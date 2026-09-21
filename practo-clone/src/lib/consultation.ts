import { Appointment, AppointmentPhase, ConsultationType, PaymentMethod } from "./types";

// How long before the scheduled time an "upcoming" appointment flips to
// "starting-soon". Kept in one place so every screen agrees on the timing.
export const STARTING_SOON_WINDOW_MINUTES = 15;

// Reads consultation type with the required backward-compatible default:
// appointments created before this feature existed have no value stored,
// and must always read back as "in-person".
export function getConsultationType(appt: Appointment): ConsultationType {
  return appt.consultationType ?? "in-person";
}

export function isOnline(appt: Appointment): boolean {
  return getConsultationType(appt) === "online";
}

// Human-readable payment method label, e.g. "Card" / "UPI". Returns null
// for appointments created before the payment step existed (no value
// stored) so callers can decide whether to show anything at all.
export function getPaymentMethodLabel(appt: Appointment): string | null {
  const method: PaymentMethod | undefined = appt.paymentMethod;
  if (method === "card") return "Card";
  if (method === "upi") return "UPI";
  return null;
}

// Parses this app's "date" ("YYYY-MM-DD") + "time" ("10:00 AM" / "02:30 PM")
// fields into a real Date, so phase/countdown math has one thing to work
// against instead of re-parsing strings all over the UI.
export function getAppointmentDateTime(appt: Appointment): Date {
  const [year, month, day] = appt.date.split("-").map(Number);
  const [time, period] = appt.time.split(" ");
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10) % 12;
  if (period === "PM") hour += 12;
  const minute = parseInt(minuteStr, 10) || 0;
  return new Date(year, (month ?? 1) - 1, day, hour, minute, 0, 0);
}

// Derives the "Upcoming → Starting Soon → Live/Consultation → Completed"
// phase from status + real time. Nothing here is persisted — call this
// wherever the phase needs to be known, ideally with `now` passed in from
// a ticking timer so the UI updates live (see useAppointmentPhase below).
export function getAppointmentPhase(appt: Appointment, now: Date = new Date()): AppointmentPhase {
  if (appt.status === "cancelled") return "cancelled";
  if (appt.status === "completed") return "completed";

  const start = getAppointmentDateTime(appt);
  const msUntilStart = start.getTime() - now.getTime();
  const startingSoonMs = STARTING_SOON_WINDOW_MINUTES * 60 * 1000;

  if (msUntilStart > startingSoonMs) return "upcoming";
  if (msUntilStart > 0) return "starting-soon";
  // Past the start time but the doctor hasn't marked it completed yet —
  // treat as live/in-progress indefinitely (there's no real call to time
  // out; the doctor ending it is what moves it to "completed").
  return "live";
}

export function getPhaseLabel(phase: AppointmentPhase, type: ConsultationType): string {
  switch (phase) {
    case "upcoming":
      return "Upcoming";
    case "starting-soon":
      return "Starting soon";
    case "live":
      return type === "online" ? "Live" : "In consultation";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
  }
}

// "2h 15m", "45m", "38s" — short countdown text for the online flow.
// Returns null once the appointment has started (nothing left to count
// down to).
export function formatCountdown(appt: Appointment, now: Date = new Date()): string | null {
  const start = getAppointmentDateTime(appt);
  const ms = start.getTime() - now.getTime();
  if (ms <= 0) return null;

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export type AdminAppointmentStatus = "confirmed" | "upcoming" | "completed" | "cancelled" | "rescheduled";

// Collapses the raw status + live phase + reschedule history into the
// 5-state vocabulary the Admin Portal displays (Confirmed / Upcoming /
// Completed / Cancelled / Rescheduled). This is purely a display-layer
// label — nothing here is persisted, and it never changes appt.status.
export function getAdminAppointmentStatus(appt: Appointment, now: Date = new Date()): AdminAppointmentStatus {
  if (appt.status === "cancelled") return "cancelled";
  if (appt.status === "completed") return "completed";
  if (appt.rescheduledFrom) return "rescheduled";
  const phase = getAppointmentPhase(appt, now);
  return phase === "upcoming" ? "confirmed" : "upcoming";
}