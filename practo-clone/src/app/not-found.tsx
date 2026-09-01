import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-content px-5 py-24 text-center">
      <p className="font-display text-5xl font-semibold text-primary">404</p>
      <h1 className="mt-3 text-lg font-semibold text-ink">Page not found</h1>
      <p className="mt-2 text-sm text-muted">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
      >
        Back to home
      </Link>
    </div>
  );
}
