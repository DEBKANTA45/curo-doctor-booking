"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Sparkles,
    CalendarCheck2,
    IndianRupee,
    Percent,
    Users,
    UserPlus,
    Video,
    MapPin,
    BadgeCheck,
} from "lucide-react";
import { getAppointments, getAllDoctors, getAllPatientsForAdmin, AdminPatientView } from "@/lib/mock-db";
import {
    consultationTypeSplit,
    appointmentStatusBreakdown,
    paymentStatusBreakdown,
    verificationBreakdown,
} from "@/lib/admin-reports";
import {
    DateRangePreset,
    rangeForPreset,
    filterAppointmentsByRange,
    buildBuckets,
    bucketedAppointmentTrend,
    bucketedRevenueTrend,
    bucketedRegistrationTrend,
} from "@/lib/admin-analytics-filters";
import { AnimatedBarChart, AnimatedLineChart, AnimatedDonutChart } from "@/components/admin/charts/AnimatedCharts";
import LoadingState from "@/components/admin/LoadingState";
import ErrorState from "@/components/admin/ErrorState";
import type { Appointment, Doctor } from "@/lib/types";

const PRESETS: { key: Exclude<DateRangePreset, "custom">; label: string }[] = [
    { key: "overall", label: "Overall" },
    { key: "today", label: "Today" },
    { key: "last7", label: "Last 7 Days" },
    { key: "lastMonth", label: "Last Month" },
    { key: "thisMonth", label: "This Month" },
    { key: "thisYear", label: "This Year" },
];

function formatINR(value: number) {
    return `₹${value.toLocaleString("en-IN")}`;
}

function formatDisplay(iso: string) {
    if (!iso) return "";
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
    return (
        <div className="card card-hover p-5">
            <span className="icon-tile-soft h-9 w-9">
                <Icon size={16} />
            </span>
            <p className="mt-3 text-xs text-muted">{label}</p>
            <p className="mt-1 font-tabular text-2xl font-semibold text-ink">{value}</p>
        </div>
    );
}

export default function AdminAnalyticsPage() {
    const [appointments, setAppointments] = useState<Appointment[] | null>(null);
    const [doctors, setDoctors] = useState<Doctor[] | null>(null);
    const [patients, setPatients] = useState<AdminPatientView[] | null>(null);
    const [error, setError] = useState(false);
    const [now] = useState(() => new Date());

    const defaultRange = useMemo(() => rangeForPreset("overall"), []);
    const [preset, setPreset] = useState<DateRangePreset>("overall");
    const [startDate, setStartDate] = useState(defaultRange.start);
    const [endDate, setEndDate] = useState(defaultRange.end);

    function load() {
        setAppointments(null);
        setDoctors(null);
        setPatients(null);
        setError(false);
        setTimeout(() => {
            try {
                setAppointments(getAppointments());
                setDoctors(getAllDoctors());
                setPatients(getAllPatientsForAdmin());
            } catch {
                setError(true);
            }
        }, 350);
    }

    useEffect(() => {
        load();
    }, []);

    const applyPreset = (key: Exclude<DateRangePreset, "custom">) => {
        const range = rangeForPreset(key);

        setPreset(key);
        setStartDate(range.start);
        setEndDate(range.end);
    };

    const clearFilter = () => {
        applyPreset("overall");
    };
    const dateError = startDate && endDate && startDate > endDate ? '"From" date is after "To" date.' : "";

    const filteredAppointments = useMemo(() => {
        if (!appointments || dateError) return [];
        return filterAppointmentsByRange(appointments, startDate, endDate);
    }, [appointments, startDate, endDate, dateError]);

    const { buckets, daily } = useMemo(
        () => buildBuckets(startDate, endDate),
        [startDate, endDate]
    );

    const apptTrend = useMemo(
        () => bucketedAppointmentTrend(filteredAppointments, buckets, daily),
        [filteredAppointments, buckets, daily]
    );

    const revTrend = useMemo(
        () => bucketedRevenueTrend(filteredAppointments, buckets, daily),
        [filteredAppointments, buckets, daily]
    );

    const regTrend = useMemo(
        () =>
            doctors && patients
                ? bucketedRegistrationTrend(doctors, patients, buckets, daily)
                : [],
        [doctors, patients, buckets, daily]
    );

    const typeSplit = useMemo(
        () => consultationTypeSplit(filteredAppointments),
        [filteredAppointments]
    );

    const statusCounts = useMemo(
        () => appointmentStatusBreakdown(filteredAppointments, now),
        [filteredAppointments, now]
    );

    const payment = useMemo(
        () => paymentStatusBreakdown(filteredAppointments),
        [filteredAppointments]
    );

    const verification = useMemo(
        () => (doctors ? verificationBreakdown(doctors) : null),
        [doctors]
    );


    //  const { buckets, daily } = useMemo(() => buildBuckets(startDate, endDate), [startDate, endDate]);
    //     const apptTrend = useMemo(() => bucketedAppointmentTrend(filteredAppointments, buckets, daily), [filteredAppointments, buckets, daily]);
    //     const revTrend = useMemo(() => bucketedRevenueTrend(filteredAppointments, buckets, daily), [filteredAppointments, buckets, daily]);
    //     const regTrend = useMemo(
    //         () => (doctors && patients ? bucketedRegistrationTrend(doctors, patients, buckets, daily) : []),
    //         [doctors, patients, buckets, daily]
    //     );

    //     const typeSplit = useMemo(() => consultationTypeSplit(filteredAppointments), [filteredAppointments]);
    //     const statusCounts = useMemo(() => appointmentStatusBreakdown(filteredAppointments, now), [filteredAppointments, now]);
    //     const payment = useMemo(() => paymentStatusBreakdown(filteredAppointments), [filteredAppointments]);
    //     const verification = useMemo(() => (doctors ? verificationBreakdown(doctors) : null), [doctors]);

    if (error) {
        return (
            <div className="p-5 sm:p-8">
                <ErrorState description="Couldn't load analytics." onRetry={load} />
            </div>
        );
    }

    if (!appointments || !doctors || !patients || !verification) {
        return (
            <div className="p-5 sm:p-8">
                <LoadingState label="Loading analytics…" />
            </div>
        );
    }

    const totalAppointments = filteredAppointments.length;
    const completedCount = filteredAppointments.filter((a) => a.status === "completed").length;
    const cancelledCount = filteredAppointments.filter((a) => a.status === "cancelled").length;
    const completionRate = totalAppointments ? Math.round((completedCount / totalAppointments) * 100) : 0;
    const cancellationRate = totalAppointments ? Math.round((cancelledCount / totalAppointments) * 100) : 0;

    const newPatientsInRange = patients.filter((p) => {
        const created = (p as unknown as { createdAt?: string }).createdAt;

        if (!created) return false;

        if (preset === "overall") return true;

        const date = created.slice(0, 10);
        return date >= startDate && date <= endDate;
    }).length;

    const newDoctorsInRange = doctors.filter((d) => {
        if (!d.registeredAt) return false;

        if (preset === "overall") return true;

        const date = d.registeredAt.slice(0, 10);
        return date >= startDate && date <= endDate;
    }).length;

    return (
        <div className="p-5 sm:p-8">

            <h1 className="mt-1.5 font-display text-2xl font-semibold text-ink">Platform insights</h1>
            {/* Date range controls */}
            <p className="mt-1 text-sm text-muted">
                {preset === "overall"
                    ? "All available platform data"
                    : `${formatDisplay(startDate)} — ${formatDisplay(endDate)}`}
            </p>

            <div className="mt-4 space-y-3">
                {/* Quick filters */}
                <div className="flex flex-wrap gap-2">
                    {PRESETS.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => applyPreset(item.key)}
                            className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${preset === item.key
                                ? "border-primary bg-primary text-white"
                                : "border-line bg-surface text-muted hover:bg-surface-soft"
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={clearFilter}
                        className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium transition hover:bg-surface-soft"
                    >
                        Clear Filter
                    </button>
                </div>

                {/* Date range */}
                {preset !== "overall" && (
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted">
                                From
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setPreset("custom");
                                }}
                                className="field"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted">
                                To
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setPreset("custom");
                                }}
                                className="field"
                            />
                        </div>
                    </div>
                )}
            </div>

            {dateError && <p className="mt-2 text-xs font-medium text-accent">{dateError}</p>}

            {dateError ? (
                <div className="mt-6">
                    <ErrorState title="Fix the date range" description="Charts will show once the range is valid." />
                </div>
            ) : (
                <>
                    {/* Stat cards */}
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <StatCard icon={CalendarCheck2} label="Appointments in range" value={totalAppointments} />
                        <StatCard icon={Percent} label="Completion rate" value={`${completionRate}%`} />
                        <StatCard icon={Percent} label="Cancellation rate" value={`${cancellationRate}%`} />
                        <StatCard icon={IndianRupee} label="Revenue collected" value={formatINR(payment.totalPaid)} />
                        <StatCard icon={UserPlus} label="New patients" value={newPatientsInRange} />
                        <StatCard icon={UserPlus} label="New doctors" value={newDoctorsInRange} />
                    </div>

                    {/* Line + bar trends */}
                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        <div className="card p-6">
                            <p className="text-sm font-medium text-ink">Appointment trend</p>
                            <p className="mt-0.5 text-xs text-faint">{daily ? "Daily" : "Monthly"} view for the selected range</p>
                            <div className="mt-5">
                                <AnimatedLineChart data={apptTrend} colorVar="--color-primary" />
                            </div>
                        </div>
                        <div className="card p-6">
                            <p className="text-sm font-medium text-ink">Revenue collected</p>
                            <p className="mt-0.5 text-xs text-faint">{daily ? "Daily" : "Monthly"} view for the selected range</p>
                            <div className="mt-5">
                                <AnimatedBarChart data={revTrend} colorVar="--color-success" valuePrefix="₹" />
                            </div>
                        </div>
                    </div>

                    {/* Registrations */}
                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        <div className="card p-6">
                            <p className="text-sm font-medium text-ink">Patient registrations</p>
                            <div className="mt-5">
                                <AnimatedBarChart data={regTrend.map((r) => ({ label: r.label, value: r.patients }))} colorVar="--color-cyan" />
                            </div>
                        </div>
                        <div className="card p-6">
                            <p className="text-sm font-medium text-ink">Doctor registrations</p>
                            <div className="mt-5">
                                <AnimatedBarChart data={regTrend.map((r) => ({ label: r.label, value: r.doctors }))} colorVar="--color-success" />
                            </div>
                        </div>
                    </div>

                    {/* Donut charts */}
                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        <div className="card p-6">
                            <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                                <Video size={14} className="text-cyan-dark" /> Online vs In-person
                            </p>
                            <div className="mt-5">
                                <AnimatedDonutChart
                                    segments={[
                                        { label: "Online", value: typeSplit.online, colorVar: "--color-cyan" },
                                        { label: "In-person", value: typeSplit.inPerson, colorVar: "--color-primary" },
                                    ]}
                                    centerLabel="Total"
                                    centerValue={typeSplit.online + typeSplit.inPerson}
                                />
                            </div>
                        </div>

                        <div className="card p-6">
                            <p className="text-sm font-medium text-ink">Appointment status</p>
                            <div className="mt-5">
                                <AnimatedDonutChart
                                    segments={[
                                        { label: "Confirmed", value: statusCounts.confirmed, colorVar: "--color-primary" },
                                        { label: "Upcoming", value: statusCounts.upcoming, colorVar: "--color-cyan" },
                                        { label: "Completed", value: statusCounts.completed, colorVar: "--color-success" },
                                        { label: "Cancelled", value: statusCounts.cancelled, colorVar: "--color-accent" },
                                        { label: "Rescheduled", value: statusCounts.rescheduled, colorVar: "--color-faint" },
                                    ]}
                                    centerLabel="Total"
                                    centerValue={totalAppointments}
                                />
                            </div>
                        </div>

                        <div className="card p-6">
                            <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                                <BadgeCheck size={14} className="text-primary" /> Doctor verification
                            </p>
                            <p className="mt-0.5 text-xs text-faint">Current status — not affected by the date range</p>
                            <div className="mt-5">
                                <AnimatedDonutChart
                                    segments={[
                                        { label: "Approved", value: verification.approved, colorVar: "--color-success" },
                                        { label: "Pending", value: verification.pending, colorVar: "--color-primary" },
                                        { label: "Rejected", value: verification.rejected, colorVar: "--color-accent" },
                                    ]}
                                    centerLabel="Doctors"
                                    centerValue={doctors.length}
                                />
                            </div>
                        </div>

                        <div className="card p-6">
                            <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                                <MapPin size={14} className="text-cyan-dark" /> Payment status
                            </p>
                            <div className="mt-5">
                                <AnimatedDonutChart
                                    segments={[
                                        { label: "Paid", value: payment.buckets.paid, colorVar: "--color-success" },
                                        { label: "Pending", value: payment.buckets.pending, colorVar: "--color-primary" },
                                        { label: "Failed", value: payment.buckets.failed, colorVar: "--color-accent" },
                                        { label: "Refunded", value: payment.buckets.refunded, colorVar: "--color-faint" },
                                    ]}
                                    centerLabel="Collected"
                                    centerValue={formatINR(payment.totalPaid)}
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
