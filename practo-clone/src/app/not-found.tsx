import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NotFoundIllustration } from "@/components/illustrations/BrandIllustrations";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-content flex-col items-center px-5 py-24 text-center">
      <NotFoundIllustration className="h-48 w-48 sm:h-56 sm:w-56" />
      <p className="mt-4 font-display text-5xl font-semibold bg-brand-gradient bg-clip-text text-transparent">
        404
      </p>
      <h1 className="mt-3 text-lg font-semibold text-ink">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link href="/" className="btn-primary btn-md mt-6">
        <ArrowLeft size={15} /> Back to home
      </Link>
    </div>
  );
}