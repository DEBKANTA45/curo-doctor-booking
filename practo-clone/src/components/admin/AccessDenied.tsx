"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { getFirstAllowedHref } from "@/lib/admin-permissions";

export default function AccessDenied({ moduleLabel }: { moduleLabel?: string }) {
  const { role, permissions } = useAdminAuth();

  return (
    <div className="p-5 sm:p-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-accent/40 bg-accent-light/40 py-20 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-light text-accent">
          <ShieldAlert size={20} />
        </span>
        <div>
          <p className="text-sm font-medium text-ink">
            You don&apos;t have access{moduleLabel ? ` to ${moduleLabel}` : ""}
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Your {role?.name ?? "current"} role doesn&apos;t include this page. Ask a Super Admin to update your
            role if you need it.
          </p>
        </div>
        <Link href={getFirstAllowedHref(permissions)} className="btn-secondary btn-sm mt-1">
          Go to a page you can open
        </Link>
      </div>
    </div>
  );
}