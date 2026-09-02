import Link from "next/link";
import { Stethoscope } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-content px-5 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white">
                <Stethoscope size={16} />
              </span>
              <span className="font-display text-base font-semibold text-ink">
                Curo
              </span>
            </div>
            <p className="mt-3 max-w-[220px] text-sm text-muted">
              Find the right doctor and book a visit in minutes.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-ink">For Patients</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link href="/doctors" className="hover:text-primary">Find doctors</Link></li>
              <li><Link href="/register" className="hover:text-primary">Create account</Link></li>
              <li><Link href="/appointments" className="hover:text-primary">My appointments</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-ink">For Doctors</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link href="/doctor/register" className="hover:text-primary">List your practice</Link></li>
              <li><Link href="/doctor/login" className="hover:text-primary">Doctor login</Link></li>
              <li><Link href="/doctor/dashboard" className="hover:text-primary">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-ink">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li className="text-muted">About</li>
              <li className="text-muted">Help centre</li>
              <li className="text-muted">Privacy</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 Curo. All data on this site is for demonstration only.</p>
          <p>Built with Next.js &middot; Frontend demo, no live backend</p>
        </div>
      </div>
    </footer>
  );
}
