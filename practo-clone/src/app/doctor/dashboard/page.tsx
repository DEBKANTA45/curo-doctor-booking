"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarX2,
  User,
  ChevronRight,
  X,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Appointment } from "@/lib/types";
import { getAppointmentsForDoctor, getCustomDoctorById, rescheduleAppointment } from "@/lib/mock-db";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildRescheduleMonth(availableDays: string[] | null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();
  const month = today.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  const days: { day: number; date: string; disabled: boolean }[] = [];
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, month, day);
    const isPast = d < today;
    const disabled = isPast || (availableDays ? !availableDays.includes(dayLabels[d.getDay()]) : false);
    days.push({ day, date: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`, disabled });
  }
  const monthLabel = today.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  return { days, leadingBlanks: new Date(year, month, 1).getDay(), monthLabel };
}

function RescheduleCalendar({
  appointmentId,
  availableDays,
  onReschedule,
}: {
  appointmentId: string;
  availableDays: string[] | null;
  onReschedule: (id: string, date: string) => void;
}) {
  const { days, leadingBlanks, monthLabel } = useMemo(
    () => buildRescheduleMonth(availableDays),
    [availableDays]
  );
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="mt-3 max-w-xs rounded-md border border-line bg-bg p-3"
    >
      <p className="text-xs font-medium text-ink">{monthLabel}</p>
      <p className="mt-0.5 text-xs text-faint">Click a date, or drag a patient card here</p>
      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs text-faint">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {days.map((d) => (
          <button
            key={d.date}
            type="button"
            disabled={d.disabled}
            onClick={() => !d.disabled && onReschedule(appointmentId, d.date)}
            onDragOver={(e) => {
              if (!d.disabled) {
                e.preventDefault();
                setDragOverDate(d.date);
              }
            }}
            onDragLeave={() => setDragOverDate((prev) => (prev === d.date ? null : prev))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverDate(null);
              if (d.disabled) return;
              const draggedId = e.dataTransfer.getData("text/plain") || appointmentId;
              onReschedule(draggedId, d.date);
            }}
            className={`aspect-square rounded-md text-xs transition-colors ${
              d.disabled
                ? "cursor-not-allowed text-faint/60"
                : dragOverDate === d.date
                ? "bg-primary text-white"
                : "text-ink hover:border hover:border-primary"
            }`}
          >
            {d.day}
          </button>
        ))}
      </div>
    </div>
  );
}

type Tab = "pending" | "completed" | "cancelled";

export default function DoctorDashboardPage() {
  const { account, loading } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tab, setTab] = useState<Tab>("pending");
  const [dateFilter, setDateFilter] = useState(todayIso());
  const [openRescheduleId, setOpenRescheduleId] = useState<string | null>(null);
  const [myAvailableDays, setMyAvailableDays] = useState<string[] | null>(null);

  const refreshAppointments = () => {
    if (account?.role === "doctor") {
      setAppointments(getAppointmentsForDoctor(account.name));
    }
  };

  useEffect(() => {
    if (account?.role === "doctor") {
      refreshAppointments();
      const record = getCustomDoctorById(account.doctorId);
      if (record) setMyAvailableDays(record.availableDays);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const byDate = useMemo(
    () => (dateFilter ? appointments.filter((a) => a.date === dateFilter) : appointments),
    [appointments, dateFilter]
  );

  const pending = useMemo(() => byDate.filter((a) => a.status === "upcoming"), [byDate]);
  const completed = useMemo(
    () =>
      byDate
        .filter((a) => a.status === "completed")
        .sort((a, b) => (b.consultedAt ?? "").localeCompare(a.consultedAt ?? "")),
    [byDate]
  );
  const cancelled = useMemo(() => byDate.filter((a) => a.status === "cancelled"), [byDate]);

  const handleReschedule = (id: string, newDate: string) => {
    rescheduleAppointment(id, newDate);
    refreshAppointments();
    setOpenRescheduleId(null);
  };

  if (loading) return null;

  if (!account || account.role !== "doctor") {
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-ink">
          Log in to view your dashboard
        </h1>
        <p className="mt-2 text-sm text-muted">
          This area is for registered doctors on Curo.
        </p>
        <Link
          href="/doctor/login"
          className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Doctor login
        </Link>
      </div>
    );
  }

  const navItems: { key: Tab; label: string; count: number; icon: typeof Clock }[] = [
    { key: "pending", label: "Pending", count: pending.length, icon: Clock },
    { key: "completed", label: "Completed", count: completed.length, icon: CheckCircle2 },
    { key: "cancelled", label: "Cancelled", count: cancelled.length, icon: XCircle },
  ];

  const activeList = tab === "pending" ? pending : tab === "completed" ? completed : cancelled;
  const emptyLabel =
    tab === "pending" ? "pending patients" : tab === "completed" ? "completed patients" : "cancelled patients";

  return (
    <div className="mx-auto max-w-content px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink sm:text-2xl">
            {account.name}
          </h1>
          <p className="text-sm text-muted">{account.specialty}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="dateFilter"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter("")}
              className="flex items-center gap-1 text-xs text-muted hover:text-ink"
            >
              <X size={12} /> All dates
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-[210px_1fr] md:items-start">
        <nav className="flex gap-2 overflow-x-auto pb-1 md:sticky md:top-20 md:flex-col md:gap-1.5 md:overflow-visible md:pb-0">
          {navItems.map((item) => {
            const isActive = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setTab(item.key);
                  setOpenRescheduleId(null);
                }}
                className={`flex shrink-0 items-center gap-2.5 rounded-md border px-3.5 py-2.5 text-sm font-medium transition-colors md:w-full ${
                  isActive
                    ? "border-primary/30 bg-primary-light text-primary-dark shadow-card"
                    : "border-line bg-surface text-muted hover:border-primary/30 hover:text-ink"
                }`}
              >
                <item.icon size={16} />
                <span className="flex-1 text-left">{item.label}</span>
                <span
                  className={`font-tabular text-xs ${isActive ? "text-primary-dark" : "text-faint"}`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </nav>

        <div>
          {activeList.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line py-14 text-center">
              <CalendarX2 className="text-faint" size={26} />
              <p className="text-sm text-muted">
                {dateFilter ? `No ${emptyLabel} on this date.` : `No ${emptyLabel}.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tab === "pending" &&
                pending.map((a) => (
                  <div
                    key={a.id}
                    className="card card-hover p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={() => router.push(`/doctor/consult/${a.id}`)}
                        className="flex flex-1 items-center gap-3 text-left"
                      >
                        <span
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.setData("text/plain", a.id);
                          }}
                          className="flex cursor-grab items-center gap-2 rounded-md py-0.5 pr-2 active:cursor-grabbing"
                          title="Drag onto a date to reschedule"
                        >
                          <span className="icon-tile-soft h-9 w-9">
                            <User size={16} />
                          </span>
                          <span className="text-sm font-medium text-ink">{a.patientName}</span>
                        </span>
                        <span className="hidden text-xs text-muted sm:inline">{a.reason}</span>
                      </button>
                      <div className="flex items-center gap-2">
                        <div className="text-right text-sm text-ink">
                          <p className="font-tabular">
                            {a.date} &middot; {a.time}
                          </p>
                          <p className="text-xs text-muted">₹{a.fee}</p>
                        </div>
                        <button
                          onClick={() =>
                            setOpenRescheduleId(openRescheduleId === a.id ? null : a.id)
                          }
                          aria-label="Reschedule"
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors ${
                            openRescheduleId === a.id
                              ? "border-primary bg-primary text-white"
                              : "border-line text-muted hover:border-primary hover:text-ink"
                          }`}
                        >
                          <CalendarDays size={15} />
                        </button>
                        <ChevronRight size={16} className="hidden text-faint sm:block" />
                      </div>
                    </div>

                    {openRescheduleId === a.id && (
                      <RescheduleCalendar
                        appointmentId={a.id}
                        availableDays={myAvailableDays}
                        onReschedule={handleReschedule}
                      />
                    )}
                  </div>
                ))}

              {tab === "completed" &&
                completed.map((a) => (
                  <Link
                    key={a.id}
                    href={`/doctor/consult/${a.id}`}
                    className="card card-hover flex items-center justify-between gap-3 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="icon-tile-soft h-9 w-9">
                        <User size={16} />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-ink">{a.patientName}</p>
                        <p className="text-xs text-muted">{a.diagnosis || "No diagnosis recorded"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm text-ink">
                        <p className="font-tabular">
                          {a.date} &middot; {a.time}
                        </p>
                        <p className="text-xs text-muted">₹{a.fee}</p>
                      </div>
                      <ChevronRight size={16} className="text-faint" />
                    </div>
                  </Link>
                ))}

              {tab === "cancelled" &&
                cancelled.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg p-4 opacity-80"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-light text-accent">
                        <User size={16} />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-ink">{a.patientName}</p>
                        <p className="text-xs text-muted">{a.reason}</p>
                      </div>
                    </div>
                    <p className="font-tabular text-sm text-ink">
                      {a.date} &middot; {a.time}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}