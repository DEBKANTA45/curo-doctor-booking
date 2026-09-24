import {
  Account,
  Appointment,
  Doctor,
  DoctorAccount,
  DoctorDocument,
  Notification,
  PatientAccount,
  PatientProfile,
  Review,
  VerificationStatus,
} from "./types";
import { doctors as seedDoctors, reviews as seedReviews } from "./utils";
import { getAdminName, getAdminEmail } from "./admin-auth";

const ACCOUNTS_KEY = "curo_accounts";
const SESSION_KEY = "curo_session";
const APPOINTMENTS_KEY = "curo_appointments";
const CUSTOM_DOCTORS_KEY = "curo_custom_doctors";
const PATIENT_PROFILES_KEY = "curo_patient_profiles";
const NOTIFICATIONS_KEY = "curo_notifications";
const CUSTOM_REVIEWS_KEY = "curo_custom_reviews";
const DOCTOR_OVERRIDES_KEY = "curo_doctor_overrides";
const PATIENT_OVERRIDES_KEY = "curo_patient_overrides";
const REVIEW_OVERRIDES_KEY = "curo_review_overrides";
const NOTIFICATION_BROADCASTS_KEY = "curo_notification_broadcasts";
const AUDIT_LOGS_KEY = "curo_audit_logs";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---------- Accounts ----------

export function getAccounts(): Account[] {
  return read<Account[]>(ACCOUNTS_KEY, []);
}

export function findAccountByEmail(email: string): Account | undefined {
  const target = email.trim().toLowerCase();
  return getAccounts().find((a) => a.email.trim().toLowerCase() === target);
}

export function registerPatient(data: {
  name: string;
  email: string;
  password: string;
  phone: string;
}): { ok: boolean; error?: string; account?: PatientAccount } {
  const email = data.email.trim();
  if (findAccountByEmail(email)) {
    return { ok: false, error: "An account with this email already exists." };
  }
    const account: PatientAccount = {
    id: `p_${Date.now()}`,
    role: "patient",
    name: data.name.trim(),
    email,
    password: data.password,
    phone: data.phone.trim(),
    createdAt: new Date().toISOString(),
  };
  const accounts = getAccounts();
  accounts.push(account);
  write(ACCOUNTS_KEY, accounts);
  setSession(account);
  return { ok: true, account };
}

export function registerDoctor(data: {
  name: string;
  email: string;
  password: string;
  specialtyId: string;
  specialty: string;
  city: string;
  clinicName: string;
  consultationFee: number;
  experienceYears: number;
  about?: string;
}): { ok: boolean; error?: string; account?: DoctorAccount } {
  const email = data.email.trim();
  if (findAccountByEmail(email)) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const doctorId = `custom_${Date.now()}`;
  const slug = `${slugify(data.name) || "doctor"}-${Date.now().toString(36)}`;

  const newDoctor: Doctor = {
    id: doctorId,
    slug,
    name: data.name.trim(),
    gender: "male",
    specialtyId: data.specialtyId,
    specialty: data.specialty,
    qualifications: "MBBS",
    experienceYears: data.experienceYears,
    rating: 0,
    reviewCount: 0,
    consultationFee: data.consultationFee,
    clinicName: data.clinicName.trim(),
    locality: "",
    city: data.city.trim(),
    languages: ["English"],
    about:
      data.about?.trim() ||
      `${data.name.trim()} is a ${data.specialty} available for consultations on Curo.`,
    photo: `https://i.pravatar.cc/300?u=${encodeURIComponent(email)}`,
    verified: false,
    nextAvailable: "Today",
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    slots: ["10:00 AM", "11:00 AM", "04:00 PM", "05:00 PM"],
    active: true,
    verificationStatus: "pending",
    registeredAt: new Date().toISOString(),
  };

  const customDoctors = getCustomDoctors();
  customDoctors.push(newDoctor);
  write(CUSTOM_DOCTORS_KEY, customDoctors);

  const account: DoctorAccount = {
    id: `dr_${Date.now()}`,
    role: "doctor",
    name: data.name.trim(),
    email,
    password: data.password,
    specialty: data.specialty,
    doctorId,
  };
  const accounts = getAccounts();
  accounts.push(account);
  write(ACCOUNTS_KEY, accounts);
  setSession(account);
  return { ok: true, account };
}

export function login(
  email: string,
  password: string,
  expectedRole: "patient" | "doctor"
): { ok: boolean; error?: string; account?: Account } {
  const account = findAccountByEmail(email);
  if (!account) return { ok: false, error: "No account found with this email." };
  if (account.role !== expectedRole) {
    return {
      ok: false,
      error: `This email is registered as a ${account.role}. Please use the ${account.role} login.`,
    };
  }
  if (account.password !== password) {
    return { ok: false, error: "Incorrect password." };
  }
  setSession(account);
  return { ok: true, account };
}

export function setSession(account: Account) {
  write(SESSION_KEY, account);
}

export function getSession(): Account | null {
  return read<Account | null>(SESSION_KEY, null);
}

export function logout() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

// ---------- Doctors (seeded + self-registered) ----------

export function getCustomDoctors(): Doctor[] {
  return read<Doctor[]>(CUSTOM_DOCTORS_KEY, []);
}

// Two seeded demo doctors ship as `verified: false` in doctors.json with no
// verification workflow attached. Rather than editing the seed data, give
// them a deterministic default status here so the Admin Portal has a
// pending case and a rejected case to demo out of the box.
const DEMO_REJECTED_SEED_IDS = new Set(["d15"]);
const DEMO_REJECTION_REASON =
  "Uploaded medical license image is blurry and the registration number isn't legible. Please reupload a clearer scan.";

function defaultVerificationStatus(doctor: Doctor): VerificationStatus {
  if (doctor.verified) return "approved";
  return DEMO_REJECTED_SEED_IDS.has(doctor.id) ? "rejected" : "pending";
}

// Every doctor is expected to have submitted these three documents. Mock
// data only — there's no real file storage, so each entry is metadata a
// review UI can display (name, type, submission date).
function generateMockDocuments(doctor: Doctor): DoctorDocument[] {
  const submittedAt = doctor.registeredAt ?? "2024-01-10T00:00:00.000Z";
  const degreeName = doctor.qualifications.split(",")[0]?.trim() || "Medical Degree";
  return [
    { id: `${doctor.id}_doc_license`, name: "Medical Council License", type: "License", uploadedAt: submittedAt },
    { id: `${doctor.id}_doc_degree`, name: `${degreeName} Certificate`, type: "Degree", uploadedAt: submittedAt },
    { id: `${doctor.id}_doc_id`, name: "Government Photo ID", type: "Identity", uploadedAt: submittedAt },
  ];
}

interface DoctorOverride {
  active?: boolean;
  verificationStatus?: VerificationStatus;
  rejectionReason?: string;
}

function getDoctorOverrides(): Record<string, DoctorOverride> {
  return read<Record<string, DoctorOverride>>(DOCTOR_OVERRIDES_KEY, {});
}

function saveDoctorOverride(id: string, patch: DoctorOverride) {
  const all = getDoctorOverrides();
  all[id] = { ...all[id], ...patch };
  write(DOCTOR_OVERRIDES_KEY, all);
}

// Merges a raw doctor record (seeded or self-registered) with its admin
// override (if any), filling in sensible defaults for fields older seed/
// custom records don't have yet. This is the single source of truth for
// "what does this doctor's admin-facing state look like right now".
function withDoctorMeta(doctor: Doctor, overrides: Record<string, DoctorOverride>): Doctor {
  const override = overrides[doctor.id];
  const verificationStatus =
    override?.verificationStatus ?? doctor.verificationStatus ?? defaultVerificationStatus(doctor);
  const verified = verificationStatus === "approved";
  const active = override?.active ?? doctor.active ?? true;
  const rejectionReason =
    verificationStatus === "rejected"
      ? override?.rejectionReason ?? doctor.rejectionReason ?? DEMO_REJECTION_REASON
      : undefined;
  const documents = doctor.documents ?? generateMockDocuments(doctor);

  return { ...doctor, verified, active, verificationStatus, rejectionReason, documents };
}

export function getAllDoctors(): Doctor[] {
  const overrides = getDoctorOverrides();
  return [...seedDoctors, ...getCustomDoctors()].map((d) => withDoctorMeta(d, overrides));
}

// Looks up a doctor by id across both seeded and self-registered doctors,
// with admin overrides applied — the function admin screens should use.
export function getDoctorById(id: string): Doctor | undefined {
  const raw = seedDoctors.find((d) => d.id === id) ?? getCustomDoctors().find((d) => d.id === id);
  if (!raw) return undefined;
  return withDoctorMeta(raw, getDoctorOverrides());
}

export function getCustomDoctorById(id: string): Doctor | undefined {
  const raw = getCustomDoctors().find((d) => d.id === id);
  if (!raw) return undefined;
  return withDoctorMeta(raw, getDoctorOverrides());
}

export function updateCustomDoctor(id: string, updates: Partial<Doctor>): Doctor | null {
  const all = getCustomDoctors();
  const index = all.findIndex((d) => d.id === id);
  if (index === -1) return null;
  const updated = { ...all[index], ...updates };
  all[index] = updated;
  write(CUSTOM_DOCTORS_KEY, all);
  return withDoctorMeta(updated, getDoctorOverrides());
}

// ---------- Doctor management & verification (Admin Portal) ----------

export function setDoctorActive(id: string, active: boolean): Doctor | undefined {
  saveDoctorOverride(id, { active });
  const doctor = getDoctorById(id);
  if (doctor) logAdminAction(active ? "Activated doctor" : "Deactivated doctor", "doctor", doctor.name);
  return doctor;
}

export function approveDoctorVerification(id: string): Doctor | undefined {
  saveDoctorOverride(id, { verificationStatus: "approved", rejectionReason: undefined });
  const doctor = getDoctorById(id);
  if (doctor) logAdminAction("Approved doctor verification", "doctor", doctor.name);
  return doctor;
}

export function rejectDoctorVerification(id: string, reason: string): Doctor | undefined {
  const trimmed = reason.trim();
  saveDoctorOverride(id, { verificationStatus: "rejected", rejectionReason: trimmed });
  const doctor = getDoctorById(id);
  if (doctor) logAdminAction("Rejected doctor verification", "doctor", doctor.name);
  return doctor;
}

// Lets a rejected doctor resubmit for review — moves them back to
// "pending" and clears the previous rejection reason.
export function resubmitDoctorVerification(id: string): Doctor | undefined {
  saveDoctorOverride(id, { verificationStatus: "pending", rejectionReason: undefined });
  return getDoctorById(id);
}

// ---------- Patient profile (medical info, contact details) ----------

export function getPatientProfile(email: string): PatientProfile | null {
  const all = read<Record<string, PatientProfile>>(PATIENT_PROFILES_KEY, {});
  return all[email.trim().toLowerCase()] ?? null;
}

export function savePatientProfile(profile: PatientProfile) {
  const all = read<Record<string, PatientProfile>>(PATIENT_PROFILES_KEY, {});
  all[profile.email.trim().toLowerCase()] = profile;
  write(PATIENT_PROFILES_KEY, all);
}

// ---------- Appointments ----------

export function getAppointments(): Appointment[] {
  return read<Appointment[]>(APPOINTMENTS_KEY, []);
}

export function getAppointmentsForPatient(email: string): Appointment[] {
  const target = email.trim().toLowerCase();
  return getAppointments().filter((a) => a.patientEmail.trim().toLowerCase() === target);
}

export function getAppointmentsForDoctor(doctorName: string): Appointment[] {
  return getAppointments().filter((a) => a.doctorName === doctorName);
}

export interface DoctorPatientSummary {
  name: string;
  email: string;
  visitCount: number;
  completedVisitCount: number;
  lastVisitAt: string;
}

// Unique patients this doctor has ever had an appointment with, newest activity first.
export function getPatientsForDoctor(doctorName: string): DoctorPatientSummary[] {
  const appts = getAppointmentsForDoctor(doctorName);
  const map = new Map<string, DoctorPatientSummary>();

  for (const a of appts) {
    const key = a.patientEmail.trim().toLowerCase();
    const activityAt = a.consultedAt ?? a.date;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        name: a.patientName,
        email: a.patientEmail,
        visitCount: 1,
        completedVisitCount: a.status === "completed" ? 1 : 0,
        lastVisitAt: activityAt,
      });
    } else {
      existing.visitCount += 1;
      if (a.status === "completed") existing.completedVisitCount += 1;
      if (activityAt > existing.lastVisitAt) existing.lastVisitAt = activityAt;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.lastVisitAt.localeCompare(a.lastVisitAt));
}

export function findPatientForDoctor(
  doctorName: string,
  patientEmail: string
): DoctorPatientSummary | undefined {
  const target = patientEmail.trim().toLowerCase();
  return getPatientsForDoctor(doctorName).find((p) => p.email.trim().toLowerCase() === target);
}

// Completed visits only (i.e. ones with a diagnosis/prescription on record), newest first.
export function getVisitHistoryForDoctorAndPatient(
  doctorName: string,
  patientEmail: string
): Appointment[] {
  const target = patientEmail.trim().toLowerCase();
  return getAppointmentsForDoctor(doctorName)
    .filter((a) => a.patientEmail.trim().toLowerCase() === target && a.status === "completed")
    .sort((a, b) => {
      const aKey = a.consultedAt ?? a.date;
      const bKey = b.consultedAt ?? b.date;
      return bKey.localeCompare(aKey);
    });
}

// Returns true if the given doctor already has an active (non-cancelled)
// appointment at this exact date + time — used to block double-booking
// the same slot.
export function isSlotTaken(doctorId: string, date: string, time: string): boolean {
  return getAppointments().some(
    (a) => a.doctorId === doctorId && a.date === date && a.time === time && a.status !== "cancelled"
  );
}

export function createAppointment(
  appt: Omit<Appointment, "id" | "createdAt" | "status">
): Appointment {
  if (isSlotTaken(appt.doctorId, appt.date, appt.time)) {
    throw new Error("This slot has just been booked by someone else. Please choose another time.");
  }
  const full: Appointment = {
    ...appt,
    id: `apt_${Date.now()}`,
    status: "upcoming",
    createdAt: new Date().toISOString(),
  };
  const all = getAppointments();
  all.unshift(full);
  write(APPOINTMENTS_KEY, all);
  return full;
}

export function cancelAppointment(id: string, cancelledBy: "patient" | "doctor" = "patient") {
  const appt = getAppointmentById(id);
  const all = getAppointments().map((a) =>
        a.id === id ? { ...a, status: "cancelled" as const, cancelledBy } : a
  );
  write(APPOINTMENTS_KEY, all);

  if (!appt) return;

  if (cancelledBy === "patient") {
    // Notify the doctor (only self-registered doctors have a login account
    // to notify — seeded demo doctors have none).
    const doctorAccount = getAccounts().find(
      (a) => a.role === "doctor" && a.doctorId === appt.doctorId
    );
    if (doctorAccount) {
      addNotification(
        doctorAccount.email,
        `${appt.patientName} cancelled their appointment on ${appt.date} at ${appt.time}.`
      );
    }
  } else {
    addNotification(
      appt.patientEmail,
      `${appt.doctorName} cancelled your appointment on ${appt.date} at ${appt.time}.`
    );
  }
}

export function rescheduleAppointment(id: string, newDate: string): Appointment | null {
  const all = getAppointments();
  const index = all.findIndex((a) => a.id === id);
  if (index === -1) return null;
  const previous = all[index];
  if (previous.date === newDate) return previous;
  if (isSlotTaken(previous.doctorId, newDate, previous.time)) return null;

    const updated: Appointment = { ...previous, date: newDate, rescheduledFrom: previous.date };
  all[index] = updated;
  write(APPOINTMENTS_KEY, all);

  addNotification(
    previous.patientEmail,
    `${previous.doctorName} rescheduled your appointment from ${previous.date} to ${newDate}.`
  );
  return updated;
}

export function getAppointmentById(id: string): Appointment | undefined {
  return getAppointments().find((a) => a.id === id);
}

export function completeAppointment(
  id: string,
  data: { diagnosis: string; report: string; medicines: string }
): Appointment | null {
  const all = getAppointments();
  const index = all.findIndex((a) => a.id === id);
  if (index === -1) return null;
  const updated: Appointment = {
    ...all[index],
    status: "completed",
    diagnosis: data.diagnosis,
    report: data.report,
    medicines: data.medicines,
    consultedAt: new Date().toISOString(),
  };
  all[index] = updated;
  write(APPOINTMENTS_KEY, all);
  return updated;
}

// ---------- Notifications ----------

export function getNotifications(email: string): Notification[] {
  const target = email.trim().toLowerCase();
  return read<Notification[]>(NOTIFICATIONS_KEY, [])
    .filter((n) => n.email.trim().toLowerCase() === target)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getUnreadNotificationCount(email: string): number {
  return getNotifications(email).filter((n) => !n.read).length;
}

export function addNotification(email: string, message: string) {
  const all = read<Notification[]>(NOTIFICATIONS_KEY, []);
  all.push({
    id: `note_${Date.now()}`,
    email,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  });
  write(NOTIFICATIONS_KEY, all);
}

export function markAllNotificationsRead(email: string) {
  const target = email.trim().toLowerCase();
  const all = read<Notification[]>(NOTIFICATIONS_KEY, []);
  write(
    NOTIFICATIONS_KEY,
    all.map((n) => (n.email.trim().toLowerCase() === target ? { ...n, read: true } : n))
  );
}

export function dismissNotification(id: string) {
  const all = read<Notification[]>(NOTIFICATIONS_KEY, []);
  write(NOTIFICATIONS_KEY, all.filter((n) => n.id !== id));
}

// ---------- Reviews (seeded + patient-submitted) ----------

export function getCustomReviews(doctorId?: string): Review[] {
  const all = read<Review[]>(CUSTOM_REVIEWS_KEY, []);
  return doctorId ? all.filter((r) => r.doctorId === doctorId) : all;
}

export function hasReviewedAppointment(appointmentId: string): boolean {
  return getCustomReviews().some((r) => r.appointmentId === appointmentId);
}

export function addReview(review: Omit<Review, "id">): Review {
  const full: Review = { ...review, id: `rev_${Date.now()}` };
  const all = getCustomReviews();
  all.unshift(full);
  write(CUSTOM_REVIEWS_KEY, all);
  return full;
}

export function getAllReviewsForDoctor(doctorId: string): Review[] {
  const hiddenIds = getHiddenReviewIds();
  const seeded = seedReviews.filter((r) => r.doctorId === doctorId && !hiddenIds.has(r.id));
  const custom = getCustomReviews(doctorId).filter((r) => !hiddenIds.has(r.id));
  return [...custom, ...seeded];
}

// Blends the doctor's baseline rating/review count with any freshly
// submitted patient reviews, so new reviews move the average without
// needing full historical review data for the seeded baseline.
export function getRatingSummary(doctor: Doctor): { rating: number; reviewCount: number } {
  const hiddenIds = getHiddenReviewIds();
  const custom = getCustomReviews(doctor.id).filter((r) => !hiddenIds.has(r.id));
  if (custom.length === 0) return { rating: doctor.rating, reviewCount: doctor.reviewCount };

  const baselineScore = doctor.rating * doctor.reviewCount;
  const customScore = custom.reduce((sum, r) => sum + r.rating, 0);
  const totalCount = doctor.reviewCount + custom.length;
  const rating = totalCount > 0 ? Math.round(((baselineScore + customScore) / totalCount) * 10) / 10 : 0;

  return { rating, reviewCount: totalCount };
}
// ---------- Password reset ----------

const RESET_TOKENS_KEY = "curo_reset_tokens";

interface ResetToken {
  email: string;
  code: string;
  expiresAt: number;
}

function generateResetCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Starts a password reset for the given email. In a real app the code
// below would be emailed to the user; since this app has no email backend,
// the code is returned directly so the UI can display it (clearly labeled
// as a demo stand-in for an email).
export function requestPasswordReset(email: string): { ok: boolean; error?: string; code?: string } {
  const target = email.trim().toLowerCase();
  const account = findAccountByEmail(target);
  if (!account) {
    return { ok: false, error: "No account found with this email." };
  }
  const tokens = read<ResetToken[]>(RESET_TOKENS_KEY, []).filter((t) => t.email !== target);
  const code = generateResetCode();
  tokens.push({ email: target, code, expiresAt: Date.now() + 10 * 60 * 1000 });
  write(RESET_TOKENS_KEY, tokens);
  return { ok: true, code };
}

// Verifies the reset code and sets a new password if valid and unexpired.
export function resetPassword(
  email: string,
  code: string,
  newPassword: string
): { ok: boolean; error?: string } {
  const target = email.trim().toLowerCase();
  const tokens = read<ResetToken[]>(RESET_TOKENS_KEY, []);
  const match = tokens.find((t) => t.email === target && t.code === code.trim());
  if (!match) {
    return { ok: false, error: "Invalid or incorrect reset code." };
  }
  if (Date.now() > match.expiresAt) {
    return { ok: false, error: "This reset code has expired. Please request a new one." };
  }
  const accounts = getAccounts();
  const index = accounts.findIndex((a) => a.email.trim().toLowerCase() === target);
  if (index === -1) {
    return { ok: false, error: "No account found with this email." };
  }
  accounts[index] = { ...accounts[index], password: newPassword };
  write(ACCOUNTS_KEY, accounts);
  write(
    RESET_TOKENS_KEY,
    tokens.filter((t) => !(t.email === target && t.code === code.trim()))
  );
  return { ok: true };
}


// ---------- Patient management (Admin Portal) ----------

interface PatientOverride {
  active?: boolean;
}

function getPatientOverrides(): Record<string, PatientOverride> {
  return read<Record<string, PatientOverride>>(PATIENT_OVERRIDES_KEY, {});
}

function savePatientOverride(email: string, patch: PatientOverride) {
  const key = email.trim().toLowerCase();
  const all = getPatientOverrides();
  all[key] = { ...all[key], ...patch };
  write(PATIENT_OVERRIDES_KEY, all);
}

export interface AdminPatientView extends PatientAccount {
  active: boolean;
  appointmentCount: number;
  lastVisitAt: string | null;
}

// All patient accounts, enriched with admin-facing status and a rollup of
// their appointment activity. Use this (not getAccounts()) for any Admin
// Portal patient screen.
export function getAllPatientsForAdmin(): AdminPatientView[] {
  const overrides = getPatientOverrides();
  const patients = getAccounts().filter((a): a is PatientAccount => a.role === "patient");
  const appts = getAppointments();

  return patients.map((p) => {
    const key = p.email.trim().toLowerCase();
    const own = appts.filter((a) => a.patientEmail.trim().toLowerCase() === key);
    const lastVisitAt = own.length
      ? own.reduce((latest, a) => (a.date > latest ? a.date : latest), own[0].date)
      : null;
    return {
      ...p,
      active: overrides[key]?.active ?? true,
      appointmentCount: own.length,
      lastVisitAt,
    };
  });
}

export function getPatientForAdmin(email: string): AdminPatientView | undefined {
  const target = email.trim().toLowerCase();
  return getAllPatientsForAdmin().find((p) => p.email.trim().toLowerCase() === target);
}

export function setPatientActive(email: string, active: boolean): AdminPatientView | undefined {
  savePatientOverride(email, { active });
  const patient = getPatientForAdmin(email);
  if (patient) logAdminAction(active ? "Activated patient" : "Deactivated patient", "patient", patient.name);
  return patient;
}


// ---------- Reviews management (Admin Portal) ----------

interface ReviewOverride {
  hidden?: boolean;
  reported?: boolean;
}

function getReviewOverrides(): Record<string, ReviewOverride> {
  return read<Record<string, ReviewOverride>>(REVIEW_OVERRIDES_KEY, {});
}

function saveReviewOverride(id: string, patch: ReviewOverride) {
  const all = getReviewOverrides();
  all[id] = { ...all[id], ...patch };
  write(REVIEW_OVERRIDES_KEY, all);
}

// Small deterministic hash so demo data can flag a stable subset of
// reviews as "reported" without persisting anything up front — same
// technique as the doctor verification demo defaults in this file.
function hashReviewId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function getHiddenReviewIds(): Set<string> {
  const overrides = getReviewOverrides();
  return new Set(Object.entries(overrides).filter(([, o]) => o.hidden).map(([id]) => id));
}

export interface AdminReviewView extends Review {
  doctorName: string;
  reported: boolean;
  hidden: boolean;
}

// All reviews (seeded + patient-submitted), enriched with the doctor's
// name and admin-facing reported/hidden flags. Use this for any Admin
// Portal reviews screen — never read the raw review lists directly.
export function getAllReviewsForAdmin(): AdminReviewView[] {
  const overrides = getReviewOverrides();
  const doctors = getAllDoctors();
  const combined = [...getCustomReviews(), ...seedReviews];

  return combined.map((r) => {
    const override = overrides[r.id];
    const doctor = doctors.find((d) => d.id === r.doctorId);
    return {
      ...r,
      doctorName: doctor?.name ?? "Unknown doctor",
      reported: override?.hidden || (override?.reported ?? hashReviewId(r.id) % 7 === 0),
      hidden: override?.hidden ?? false,
    };
  });
}

export function hideReview(id: string): void {
  saveReviewOverride(id, { hidden: true, reported: true });
  const review = getAllReviewsForAdmin().find((r) => r.id === id);
  logAdminAction("Hid review", "review", review ? `${review.author} → ${review.doctorName}` : id);
}

export function unhideReview(id: string): void {
  saveReviewOverride(id, { hidden: false });
  const review = getAllReviewsForAdmin().find((r) => r.id === id);
  logAdminAction("Unhid review", "review", review ? `${review.author} → ${review.doctorName}` : id);
}

// ---------- Notifications management (Admin Portal) ----------

export function getAllNotifications(): Notification[] {
  return read<Notification[]>(NOTIFICATIONS_KEY, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type NotificationAudience = "all-patients" | "all-doctors" | "selected";

export interface AdminNotificationBroadcast {
  id: string;
  message: string;
  audience: NotificationAudience;
  recipientCount: number;
  createdAt: string;
}

export function getBroadcastHistory(): AdminNotificationBroadcast[] {
  return read<AdminNotificationBroadcast[]>(NOTIFICATION_BROADCASTS_KEY, []).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

// Sends `message` to every email in `recipientEmails` (one Notification
// row each, via the existing addNotification()) and records a single
// broadcast-history entry so the Admin Portal can show "sent to N people"
// without needing to list every individual notification row.
export function sendAdminNotification(
  message: string,
  audience: NotificationAudience,
  recipientEmails: string[]
): AdminNotificationBroadcast {
  recipientEmails.forEach((email) => addNotification(email, message));

  const broadcast: AdminNotificationBroadcast = {
    id: `bcast_${Date.now()}`,
    message,
    audience,
    recipientCount: recipientEmails.length,
    createdAt: new Date().toISOString(),
  };
    const all = read<AdminNotificationBroadcast[]>(NOTIFICATION_BROADCASTS_KEY, []);
  all.unshift(broadcast);
  write(NOTIFICATION_BROADCASTS_KEY, all);

  const audienceText =
    audience === "all-patients" ? "All Patients" : audience === "all-doctors" ? "All Doctors" : `${recipientEmails.length} selected users`;
  logAdminAction(`Sent notification to ${audienceText}`, "notification", message.slice(0, 60));

  return broadcast;
}

// ---------- Audit logs (Admin Portal) ----------

export type AuditEntityType = "doctor" | "patient" | "review" | "notification" | "admin" | "role" | "settings";


export interface AuditLogEntry {
  id: string;
  actorName: string;
  actorEmail: string;
  action: string;
  entityType: AuditEntityType;
  entityLabel: string;
  createdAt: string;
}

// Records one admin action. Called internally by the admin mutation
// functions above (setDoctorActive, approveDoctorVerification, etc.) —
// never call this directly from a page component.
export function logAdminAction(action: string, entityType: AuditEntityType, entityLabel: string) {
  const entry: AuditLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    actorName: getAdminName(),
    actorEmail: getAdminEmail(),
    action,
    entityType,
    entityLabel,
    createdAt: new Date().toISOString(),
  };
  const all = read<AuditLogEntry[]>(AUDIT_LOGS_KEY, []);
  all.unshift(entry);
  write(AUDIT_LOGS_KEY, all);
}

export function getAuditLogs(): AuditLogEntry[] {
  return read<AuditLogEntry[]>(AUDIT_LOGS_KEY, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}