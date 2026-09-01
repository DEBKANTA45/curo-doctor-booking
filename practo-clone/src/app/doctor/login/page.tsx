import { Suspense } from "react";
import DoctorLoginForm from "@/components/DoctorLoginForm";

export const metadata = { title: "Doctor login — Curo" };

export default function DoctorLoginPage() {
  return (
    <Suspense fallback={null}>
      <DoctorLoginForm />
    </Suspense>
  );
}
