import { Suspense } from "react";
import DoctorRegisterForm from "@/components/DoctorRegisterForm";

export const metadata = { title: "Register as a doctor — Curo" };

export default function DoctorRegisterPage() {
  return (
    <Suspense fallback={null}>
      <DoctorRegisterForm />
    </Suspense>
  );
}
