export interface Specialty {
  id: string;
  name: string;
  icon: string; // lucide-react icon name
  description: string;
}

export type VerificationStatus = "pending" | "approved" | "rejected";

export interface DoctorDocument {
  id: string;
  name: string;
  /** e.g. "Medical License", "Degree Certificate", "Government ID" */
  type: string;
  uploadedAt: string;
}

export interface Doctor {
  id: string;
  slug: string;
  name: string;
  gender: "male" | "female";
  specialtyId: string;
  specialty: string;
  qualifications: string;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  consultationFee: number;
  clinicName: string;
  locality: string;
  city: string;
  languages: string[];
  about: string;
  photo: string;
  /** Kept in sync with verificationStatus === "approved" — true only for approved doctors. */
  verified: boolean;
  nextAvailable: string;
  availableDays: string[];
  slots: string[];
  sessionType?: "individual" | "group";
  groupSize?: number;
  slotStart?: string;
  slotEnd?: string;
  slotDurationMinutes?: number;
  scheduleStart?: string;
  scheduleEnd?: string;
  /** Whether the doctor's account is enabled — separate from verification. */
  active?: boolean;
  verificationStatus?: VerificationStatus;
  /** Required whenever verificationStatus is "rejected". */
  rejectionReason?: string;
  documents?: DoctorDocument[];
  /** ISO timestamp of when the doctor registered / was submitted for verification. */
  registeredAt?: string;
  /** Optional editorial flag — shows a "Featured Doctor" badge on DoctorCard when true. */
  featured?: boolean;
}

export interface Review {
  id: string;
  doctorId: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
  appointmentId?: string;
}

export type UserRole = "patient" | "doctor";

export interface PatientAccount {
  id: string;
  role: "patient";
  name: string;
  email: string;
  password: string;
  phone: string;
  // When this account was created — used for the Admin Portal's patient
  // registration trend chart. Optional since accounts created before this
  // field existed have no value here.
  createdAt?: string;
}

export interface DoctorAccount {
  id: string;
  role: "doctor";
  name: string;
  email: string;
  password: string;
  specialty: string;
  doctorId: string; // links to Doctor.id if seeded, else self
}

export type Account = PatientAccount | DoctorAccount;

// "online" video-call style visit, or the original in-person clinic visit.
export type ConsultationType = "online" | "in-person";

// How the patient paid at booking time. Optional so appointments created
// before the payment step existed don't break — read through
// getPaymentMethodLabel() (src/lib/consultation.ts) rather than directly.
export type PaymentMethod = "card" | "upi";

// Derived, time-based phase of an appointment — never stored, always
// computed from `status` + `date` + `time` via getAppointmentPhase() in
// src/lib/consultation.ts. Drives the "Upcoming → Starting Soon →
// Live/Consultation → Completed" flow for both consultation types.
export type AppointmentPhase = "upcoming" | "starting-soon" | "live" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  patientEmail: string;
  patientName: string;
  date: string;
  time: string;
  status: "upcoming" | "completed" | "cancelled";
  fee: number;
  reason: string;
  createdAt: string;
  diagnosis?: string;
  report?: string;
  medicines?: string;
  consultedAt?: string;
  // Optional on purpose: appointments created before this feature existed
  // have no value here. Always read this through getConsultationType()
  // (src/lib/consultation.ts), which defaults missing values to
  // "in-person" — never read appt.consultationType directly.
  consultationType?: ConsultationType;
  // Optional for the same reason as consultationType above — older
  // appointments predate the payment step and have no value here.
  paymentMethod?: PaymentMethod;
  // Set by cancelAppointment() — who cancelled it, for admin visibility.
  cancelledBy?: "patient" | "doctor";
  // Set by rescheduleAppointment() to the previous date, whenever this
  // appointment has been rescheduled at least once.
  rescheduledFrom?: string;
}

export interface PatientProfile {
  email: string;
  phone?: string;
  dob?: string;
  gender?: "male" | "female" | "other";
  bloodGroup?: string;
  height?: string;
  weight?: string;
  bloodPressure?: string;
  allergies?: string;
  medicalHistory?: string;
  currentMedications?: string;
  emergencyContact?: string;
}

export interface Notification {
  id: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: string;
}