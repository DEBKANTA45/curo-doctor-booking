export interface Specialty {
  id: string;
  name: string;
  icon: string; // lucide-react icon name
  description: string;
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
  verified: boolean;
  nextAvailable: string;
  availableDays: string[];
  slots: string[];
}

export interface Review {
  id: string;
  doctorId: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export type UserRole = "patient" | "doctor";

export interface PatientAccount {
  id: string;
  role: "patient";
  name: string;
  email: string;
  password: string;
  phone: string;
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
}

export interface PatientProfile {
  email: string;
  phone?: string;
  dob?: string;
  gender?: "male" | "female" | "other";
  bloodGroup?: string;
  allergies?: string;
  medicalHistory?: string;
  currentMedications?: string;
  emergencyContact?: string;
}