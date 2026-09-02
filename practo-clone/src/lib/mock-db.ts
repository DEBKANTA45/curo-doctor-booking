import {
  Account,
  Appointment,
  Doctor,
  DoctorAccount,
  PatientAccount,
  PatientProfile,
} from "./types";
import { doctors as seedDoctors } from "./utils";

const ACCOUNTS_KEY = "curo_accounts";
const SESSION_KEY = "curo_session";
const APPOINTMENTS_KEY = "curo_appointments";
const CUSTOM_DOCTORS_KEY = "curo_custom_doctors";
const PATIENT_PROFILES_KEY = "curo_patient_profiles";

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

export function getAllDoctors(): Doctor[] {
  return [...seedDoctors, ...getCustomDoctors()];
}

export function getCustomDoctorById(id: string): Doctor | undefined {
  return getCustomDoctors().find((d) => d.id === id);
}

export function updateCustomDoctor(id: string, updates: Partial<Doctor>): Doctor | null {
  const all = getCustomDoctors();
  const index = all.findIndex((d) => d.id === id);
  if (index === -1) return null;
  const updated = { ...all[index], ...updates };
  all[index] = updated;
  write(CUSTOM_DOCTORS_KEY, all);
  return updated;
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

export function createAppointment(
  appt: Omit<Appointment, "id" | "createdAt" | "status">
): Appointment {
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

export function cancelAppointment(id: string) {
  const all = getAppointments().map((a) =>
    a.id === id ? { ...a, status: "cancelled" as const } : a
  );
  write(APPOINTMENTS_KEY, all);
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