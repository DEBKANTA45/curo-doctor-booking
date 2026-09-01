import doctorsData from "@/data/doctors.json";
import reviewsData from "@/data/reviews.json";
import specialtiesData from "@/data/specialties.json";
import { Doctor, Review, Specialty } from "./types";

export const doctors = doctorsData as Doctor[];
export const reviews = reviewsData as Review[];
export const specialties = specialtiesData as Specialty[];

export function getDoctorBySlug(slug: string): Doctor | undefined {
  return doctors.find((d) => d.slug === slug);
}

export function getReviewsForDoctor(doctorId: string): Review[] {
  return reviews.filter((r) => r.doctorId === doctorId);
}

export function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
