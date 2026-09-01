import { Suspense } from "react";
import DoctorListing from "@/components/DoctorListing";

export const metadata = {
  title: "Find Doctors — Curo",
};

export default function DoctorsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-content px-5 py-10 text-sm text-muted">Loading doctors…</div>}>
      <DoctorListing />
    </Suspense>
  );
}
