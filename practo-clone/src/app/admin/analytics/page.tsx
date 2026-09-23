"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Sparkles,
    CalendarCheck2,
    IndianRupee,
    Percent,
    Stethoscope,
    Users,
    Video,
    MapPin,
    BadgeCheck,
} from "lucide-react";
import { getAppointments, getAllDoctors, getAllPatientsForAdmin, AdminPatientView } from "@/lib/mock-db";
import {
    appointmentTrend,
    revenueTrend,
    registrationTrend,
    consultationTypeSplit,
    appointmentStatusBreakdown,
    paymentStatusBreakdown,
    verificationBreakdown,
} from "@/lib/admin-reports";
import MiniBarChart from "@/components/miniBarChart";
import LoadingState from "@/components/admin/LoadingState";
import ErrorState from "@/components/admin/ErrorState";
import type { Appointment, Doctor } from "@/lib/types";

interface BreakdownRow {
    label: string;
    count: number;
    className: string;
}

function formatINR(value: number) {
    return `₹${value.toLocaleString("en-IN")}`;
}

function BreakdownBars({ rows, total }: { rows: BreakdownRow[]; total: number }) {
    return (
        <div className="space-y-4">
            {rows.map((row) => (
                <div key={row.label}>
                    <div className="flex items-center justify-between text-xs text-muted">
                        <span>{row.label}</span>
                        <span className="font-tabular text-ink">{row.count}</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-bg">
                        <div
                            className={`h-2 rounded-full transition-[width] duration-500 ${row.className}`}
                            style={{ width: `${total ? (row.count / total) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function AdminAnalyticsPage() {
    const [appointments, setAppointments] = useState<Appointment[] | null>(null);
    const [doctors, setDoctors] = useState<Doctor[] | null>(null);
    const [patients, setPatients] = useState<AdminPatientView[] | null>(null);
    const [error, setError] = useState(false);
    const [now] = useState(() => new Date());

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

    const trend = useMemo(() => (appointments ? appointmentTrend(appointments) : []), [appointments]);
    const revTrend = useMemo(() => (appointments ? revenueTrend(appointments) : []), [appointments]);
    const regTrend = useMemo(
        () => (doctors && patients ? registrationTrend(doctors, patients) : []),
        [doctors, patients]
    );
    const typeSplit = useMemo(
        () => (appointments ? consultationTypeSplit(appointments) : { online: 0, inPerson: 0 }),
        [appointments]
    );
    const statusCounts = useMemo(
        () => (appointments ? appointmentStatusBreakdown(appointments, now) : null),
        [appointments, now]
    );
    const payment = useMemo(() => (appointments ? paymentStatusBreakdown(appointments) : null), [appointments]);
    const verification = useMemo(() => (doctors ? verificationBreakdown(doctors) : null), [doctors]);

    if (error) {
        return (
            <div className="p-5 sm:p-8">
                <ErrorState description="Couldn't load analytics." onRetry={load} />
            </div>
        );
    }

    if (!appointments || !doctors || !patients || !statusCounts || !payment || !verification) {
        return (
            <div className="p-5 sm:p-8">
                <LoadingState label="Loading analytics…" />
            </div>
        );
    }

    const totalAppointments = appointments.length;
    const completedCount = appointments.filter((a) => a.status === "completed").length;
    const cancelledCount = appointments.filter((a) => a.status === "cancelled").length;
    const completionRate = totalAppointments ? Math.round((completedCount / totalAppointments) * 100) : 0;
    const cancellationRate = totalAppointments ? Math.round((cancelledCount / totalAppointments) * 100) : 0;
    const typeTotal = typeSplit.online + typeSplit.inPerson;

    const statCards = [
        { label: "Total appointments", value: totalAppointments, icon: CalendarCheck2 },
        { label: "Completion rate", value: `${completionRate}%`, icon: Percent },
        { label: "Cancellation rate", value: `${cancellationRate}%`, icon: Percent },
        { label: "Revenue collected", value: formatINR(payment.totalPaid), icon: IndianRupee },
        { label: "Registered doctors", value: doctors.length, icon: Stethoscope },
        { label: "Registered patients", value: patients.length, icon: Users },
    ];

    const statusRows: BreakdownRow[] = [
        { label: "Confirmed", count: statusCounts.confirmed, className: "bg-primary" },
        { label: "Upcoming", count: statusCounts.upcoming, className: "bg-cyan" },
        { label: "Completed", count: statusCounts.completed, className: "bg-success" },
        { label: "Cancelled", count: statusCounts.cancelled, className: "bg-accent" },
        { label: "Rescheduled", count: statusCounts.rescheduled, className: "bg-faint" },
    ];

    const paymentRows: BreakdownRow[] = [
        { label: "Paid", count: payment.buckets.paid, className: "bg-success" },
        { label: "Pending", count: payment.buckets.pending, className: "bg-primary" },
        { label: "Failed", count: payment.buckets.failed, className: "bg-accent" },
        { label: "Refunded", count: payment.buckets.refunded, className: "bg-faint" },
    ];

    const verificationRows: BreakdownRow[] = [
        { label: "Approved", count: verification.approved, className: "bg-success" },
        { label: "Pending", count: verification.pending, className: "bg-primary" },
        { label: "Rejected", count: verification.rejected, className: "bg-accent" },
    ];

    return (
        <div className="p-5 sm:p-8">
            <h1 className="font-display text-2xl font-semibold text-ink">
                Platform insights
            </h1>
            <p className="mt-1 text-sm text-muted">
                Appointments, registrations, payments, and verification at a glance.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {statCards.map((s) => (
                    <div key={s.label} className="card card-hover p-5">
                        <span className="icon-tile-soft h-9 w-9">
                            <s.icon size={16} />
                        </span>
                        <p className="mt-3 text-xs text-muted">{s.label}</p>
                        <p className="mt-1 font-tabular text-2xl font-semibold text-ink">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="card p-6">
                    <p className="text-sm font-medium text-ink">Appointments — last 6 months</p>
                    <div className="mt-5">
                        <MiniBarChart data={trend} />
                    </div>
                </div>
                <div className="card p-6">
                    <p className="text-sm font-medium text-ink">Revenue collected — last 6 months</p>
                    <div className="mt-5">
                        <MiniBarChart data={revTrend} />
                    </div>
                </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="card p-6">
                    <p className="text-sm font-medium text-ink">Patient registrations — last 6 months</p>
                    <div className="mt-5">
                        <MiniBarChart data={regTrend.map((r) => ({ label: r.label, value: r.patients }))} />
                    </div>
                </div>
                <div className="card p-6">
                    <p className="text-sm font-medium text-ink">Doctor registrations — last 6 months</p>
                    <div className="mt-5">
                        <MiniBarChart data={regTrend.map((r) => ({ label: r.label, value: r.doctors }))} />
                    </div>
                </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="card p-6">
                    <p className="text-sm font-medium text-ink">Appointment status</p>
                    <div className="mt-5">
                        <BreakdownBars rows={statusRows} total={totalAppointments} />
                    </div>
                </div>

                <div className="card p-6">
                    <p className="text-sm font-medium text-ink">Online vs in-person</p>
                    <div className="mt-5 space-y-4">
                        <div>
                            <div className="flex items-center justify-between text-xs text-muted">
                                <span className="flex items-center gap-1">
                                    <Video size={12} /> Online
                                </span>
                                <span className="font-tabular text-ink">{typeSplit.online}</span>
                            </div>
                            <div className="mt-1.5 h-2 rounded-full bg-bg">
                                <div
                                    className="h-2 rounded-full bg-cyan transition-[width] duration-500"
                                    style={{ width: `${typeTotal ? (typeSplit.online / typeTotal) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between text-xs text-muted">
                                <span className="flex items-center gap-1">
                                    <MapPin size={12} /> In-person
                                </span>
                                <span className="font-tabular text-ink">{typeSplit.inPerson}</span>
                            </div>
                            <div className="mt-1.5 h-2 rounded-full bg-bg">
                                <div
                                    className="h-2 rounded-full bg-primary transition-[width] duration-500"
                                    style={{ width: `${typeTotal ? (typeSplit.inPerson / typeTotal) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                        <BadgeCheck size={15} className="text-primary" /> Doctor verification
                    </p>
                    <div className="mt-5">
                        <BreakdownBars rows={verificationRows} total={doctors.length} />
                    </div>
                </div>
            </div>

            <div className="mt-6 card p-6">
                <p className="text-sm font-medium text-ink">Payment status</p>
                <p className="mt-1 text-xs text-muted">
                    {formatINR(payment.totalPaid)} collected across {payment.buckets.paid} paid transactions
                </p>
                <div className="mt-5">
                    <BreakdownBars rows={paymentRows} total={totalAppointments} />
                </div>
            </div>
        </div>
    );
}