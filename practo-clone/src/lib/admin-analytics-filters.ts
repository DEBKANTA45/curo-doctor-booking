import type { Appointment, Doctor } from "./types";
import type { AdminPatientView } from "./mock-db";

// ---------- Date helpers ----------

function toIso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfDay(d: Date): Date {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

export type DateRangePreset =
    | "overall"
    | "today"
    | "last7"
    | "lastMonth"
    | "thisMonth"
    | "thisYear"
    | "custom";

export function rangeForPreset(
    preset: Exclude<DateRangePreset, "custom">
): { start: string; end: string } {
    const today = startOfDay(new Date());

    switch (preset) {
        case "overall":
            return { start: "", end: "" };

        case "today":
            return { start: toIso(today), end: toIso(today) };

        case "last7": {
            const start = new Date(today);
            start.setDate(start.getDate() - 6);
            return { start: toIso(start), end: toIso(today) };
        }

        case "lastMonth": {
            const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastMonthEnd = new Date(firstOfThisMonth);
            lastMonthEnd.setDate(0);
            const lastMonthStart = new Date(
                lastMonthEnd.getFullYear(),
                lastMonthEnd.getMonth(),
                1
            );

            return {
                start: toIso(lastMonthStart),
                end: toIso(lastMonthEnd),
            };
        }

        case "thisMonth": {
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            return { start: toIso(start), end: toIso(today) };
        }

        case "thisYear": {
            const start = new Date(today.getFullYear(), 0, 1);
            return { start: toIso(start), end: toIso(today) };
        }
    }
}

// ---------- Filtering ----------

export function filterAppointmentsByRange(appointments: Appointment[], start: string, end: string): Appointment[] {
    if (!start && !end) return appointments;
    return appointments.filter((a) => (!start || a.date >= start) && (!end || a.date <= end));
}

// ---------- Bucketing ----------

export interface Bucket {
    key: string;
    label: string;
}

// Daily buckets for ranges up to ~35 days, monthly buckets for longer ones —
// keeps the trend chart readable whether the range is "Today" or "This Year".
export function buildBuckets(
    start: string,
    end: string
): { buckets: Bucket[]; daily: boolean } {
    // Overall mode: no date range means monthly buckets from
    // the current year's beginning through today.
    if (!start && !end) {
        const today = startOfDay(new Date());
        const startDate = new Date(today.getFullYear(), 0, 1);
        const endMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const buckets: Bucket[] = [];
        const cursor = new Date(startDate);

        while (cursor <= endMonth) {
            const key = `${cursor.getFullYear()}-${String(
                cursor.getMonth() + 1
            ).padStart(2, "0")}`;

            buckets.push({
                key,
                label: cursor.toLocaleDateString("en-IN", {
                    month: "short",
                    year: "2-digit",
                }),
            });

            cursor.setMonth(cursor.getMonth() + 1);
        }

        return { buckets, daily: false };
    }

    const s = new Date(`${start}T00:00:00`);
    const e = new Date(`${end}T00:00:00`);

    if (
        Number.isNaN(s.getTime()) ||
        Number.isNaN(e.getTime()) ||
        s > e
    ) {
        return { buckets: [], daily: true };
    }

    const spanDays = Math.round(
        (e.getTime() - s.getTime()) / 86400000
    );

    if (spanDays <= 35) {
        const buckets: Bucket[] = [];
        const cursor = new Date(s);

        while (cursor <= e) {
            const key = toIso(cursor);

            buckets.push({
                key,
                label: cursor.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                }),
            });

            cursor.setDate(cursor.getDate() + 1);
        }

        return { buckets, daily: true };
    }

    const buckets: Bucket[] = [];
    const cursor = new Date(s.getFullYear(), s.getMonth(), 1);
    const endMonth = new Date(e.getFullYear(), e.getMonth(), 1);

    while (cursor <= endMonth) {
        const key = `${cursor.getFullYear()}-${String(
            cursor.getMonth() + 1
        ).padStart(2, "0")}`;

        buckets.push({
            key,
            label: cursor.toLocaleDateString("en-IN", {
                month: "short",
                year: "2-digit",
            }),
        });

        cursor.setMonth(cursor.getMonth() + 1);
    }

    return { buckets, daily: false };
}

function bucketKeyFor(isoDateOrDateTime: string, daily: boolean): string {
    const datePart = isoDateOrDateTime.slice(0, 10);
    return daily ? datePart : datePart.slice(0, 7);
}

export function bucketedAppointmentTrend(appointments: Appointment[], buckets: Bucket[], daily: boolean) {
    const counts = new Map(buckets.map((b) => [b.key, 0]));
    appointments.forEach((a) => {
        const key = bucketKeyFor(a.date, daily);
        if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return buckets.map((b) => ({ label: b.label, value: counts.get(b.key) ?? 0 }));
}

export function bucketedRevenueTrend(appointments: Appointment[], buckets: Bucket[], daily: boolean) {
    const sums = new Map(buckets.map((b) => [b.key, 0]));
    appointments
        .filter((a) => a.status === "completed")
        .forEach((a) => {
            const key = bucketKeyFor(a.consultedAt ?? a.date, daily);
            if (sums.has(key)) sums.set(key, (sums.get(key) ?? 0) + a.fee);
        });
    return buckets.map((b) => ({ label: b.label, value: sums.get(b.key) ?? 0 }));
}

// Deterministic fallback bucket for accounts with no real timestamp — same
// technique mock-db.ts already uses for demo payment/review defaults — so
// older seed/demo data still shows up on the chart instead of vanishing.
function hashString(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
}

function approxBucketKey(id: string, real: string | undefined, buckets: Bucket[], daily: boolean): string {
    if (real) {
        const key = bucketKeyFor(real, daily);
        if (buckets.some((b) => b.key === key)) return key;
    }
    return buckets.length ? buckets[hashString(id) % buckets.length].key : "";
}

export function bucketedRegistrationTrend(
    doctors: Doctor[],
    patients: AdminPatientView[],
    buckets: Bucket[],
    daily: boolean
) {
    const doctorCounts = new Map(buckets.map((b) => [b.key, 0]));
    doctors.forEach((d) => {
        const key = approxBucketKey(d.id, d.registeredAt, buckets, daily);
        if (doctorCounts.has(key)) doctorCounts.set(key, (doctorCounts.get(key) ?? 0) + 1);
    });

    const patientCounts = new Map(buckets.map((b) => [b.key, 0]));
    patients.forEach((p) => {
        // Cast guards against older builds that haven't added PatientAccount.createdAt yet.
        const created = (p as unknown as { createdAt?: string }).createdAt;
        const key = approxBucketKey(p.email, created, buckets, daily);
        if (patientCounts.has(key)) patientCounts.set(key, (patientCounts.get(key) ?? 0) + 1);
    });

    return buckets.map((b) => ({
        label: b.label,
        doctors: doctorCounts.get(b.key) ?? 0,
        patients: patientCounts.get(b.key) ?? 0,
    }));
}