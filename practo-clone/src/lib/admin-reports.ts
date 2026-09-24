import {
  getAppointments,
  getAllDoctors,
  getAllPatientsForAdmin,
  AdminPatientView,
} from "./mock-db";
import {
  getConsultationType,
  getAdminAppointmentStatus,
  getPaymentStatus,
  AdminAppointmentStatus,
  PaymentStatus,
} from "./consultation";
import type { Appointment, Doctor } from "./types";

// ---------- Month buckets ----------

export interface MonthBucket {
  key: string;
  label: string;
}

export function lastNMonthBuckets(n = 6): MonthBucket[] {
  const now = new Date();
  const out: MonthBucket[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-IN", { month: "short" }),
    });
  }
  return out;
}

function monthKeyOf(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Deterministic hash so demo records without a real timestamp still land
// on a stable month bucket — same technique already used in this app for
// payment-status and reported-review demo defaults (see mock-db.ts).
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function approximateMonthKey(id: string, real: string | undefined, buckets: MonthBucket[]): string {
  if (real) {
    const key = monthKeyOf(real);
    if (buckets.some((b) => b.key === key)) return key;
  }
  return buckets[hashString(id) % buckets.length].key;
}

// ---------- Analytics ----------

export function appointmentTrend(appointments: Appointment[], buckets = lastNMonthBuckets()) {
  const counts = new Map(buckets.map((b) => [b.key, 0]));
  appointments.forEach((a) => {
    const key = monthKeyOf(a.date);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return buckets.map((b) => ({ label: b.label, value: counts.get(b.key) ?? 0 }));
}

export function revenueTrend(appointments: Appointment[], buckets = lastNMonthBuckets()) {
  const sums = new Map(buckets.map((b) => [b.key, 0]));
  appointments
    .filter((a) => getPaymentStatus(a) === "paid")
    .forEach((a) => {
      const key = monthKeyOf(a.consultedAt ?? a.date);
      if (sums.has(key)) sums.set(key, (sums.get(key) ?? 0) + a.fee);
    });
  return buckets.map((b) => ({ label: b.label, value: sums.get(b.key) ?? 0 }));
}

// Patients created after this update carry a real createdAt and land on
// their true month. Doctors use their real registeredAt the same way.
// Any account from before these fields existed falls back to a stable
// mock placement (approximateMonthKey) purely so old demo data still
// shows up on the chart instead of disappearing.
export function registrationTrend(
  doctors: Doctor[],
  patients: AdminPatientView[],
  buckets = lastNMonthBuckets()
) {
  const doctorCounts = new Map(buckets.map((b) => [b.key, 0]));
  doctors.forEach((d) => {
    const key = approximateMonthKey(d.id, d.registeredAt, buckets);
    doctorCounts.set(key, (doctorCounts.get(key) ?? 0) + 1);
  });

  const patientCounts = new Map(buckets.map((b) => [b.key, 0]));
  patients.forEach((p) => {
    const key = approximateMonthKey(p.email, p.createdAt, buckets);
    patientCounts.set(key, (patientCounts.get(key) ?? 0) + 1);
  });

  return buckets.map((b) => ({
    label: b.label,
    doctors: doctorCounts.get(b.key) ?? 0,
    patients: patientCounts.get(b.key) ?? 0,
  }));
}
export function consultationTypeSplit(appointments: Appointment[]) {
  const online = appointments.filter((a) => getConsultationType(a) === "online").length;
  return { online, inPerson: appointments.length - online };
}

export function appointmentStatusBreakdown(appointments: Appointment[], now = new Date()) {
  const buckets: Record<AdminAppointmentStatus, number> = {
    confirmed: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
    rescheduled: 0,
  };
  appointments.forEach((a) => {
    buckets[getAdminAppointmentStatus(a, now)]++;
  });
  return buckets;
}

export function paymentStatusBreakdown(appointments: Appointment[]) {
  const buckets: Record<PaymentStatus, number> = { paid: 0, pending: 0, failed: 0, refunded: 0 };
  let totalPaid = 0;
  appointments.forEach((a) => {
    const status = getPaymentStatus(a);
    buckets[status]++;
    if (status === "paid") totalPaid += a.fee;
  });
  return { buckets, totalPaid };
}

export function verificationBreakdown(doctors: Doctor[]) {
  const buckets = { pending: 0, approved: 0, rejected: 0 };
  doctors.forEach((d) => {
    buckets[d.verificationStatus ?? "pending"]++;
  });
  return buckets;
}

// ---------- Report filtering ----------

export interface AppointmentReportFilters {
  startDate?: string;
  endDate?: string;
  status?: AdminAppointmentStatus | "";
  type?: "online" | "in-person" | "";
}

export function filterAppointmentsForReport(
  appointments: Appointment[],
  f: AppointmentReportFilters,
  now = new Date()
) {
  return appointments.filter((a) => {
    if (f.startDate && a.date < f.startDate) return false;
    if (f.endDate && a.date > f.endDate) return false;
    if (f.status && getAdminAppointmentStatus(a, now) !== f.status) return false;
    if (f.type && getConsultationType(a) !== f.type) return false;
    return true;
  });
}

export interface PaymentReportFilters {
  startDate?: string;
  endDate?: string;
  status?: PaymentStatus | "";
}

export function filterAppointmentsForPaymentReport(appointments: Appointment[], f: PaymentReportFilters) {
  return appointments.filter((a) => {
    if (f.startDate && a.date < f.startDate) return false;
    if (f.endDate && a.date > f.endDate) return false;
    if (f.status && getPaymentStatus(a) !== f.status) return false;
    return true;
  });
}

// ---------- Export (CSV / Excel / PDF) ----------

export interface ReportColumn {
  header: string;
  value: (row: any) => string;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsv(v: string) {
  return v.includes(",") || v.includes('"') || v.includes("\n") ? `"${v.replace(/"/g, '""')}"` : v;
}

export function downloadCsv(filename: string, columns: ReportColumn[], rows: any[]) {
  const lines = [
    columns.map((c) => escapeCsv(c.header)).join(","),
    ...rows.map((r) => columns.map((c) => escapeCsv(c.value(r))).join(",")),
  ];
  triggerDownload(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }), filename);
}

export async function downloadExcel(filename: string, sheetName: string, columns: ReportColumn[], rows: any[]) {
  const XLSX = await import("xlsx");
  const data = [columns.map((c) => c.header), ...rows.map((r) => columns.map((c) => c.value(r)))];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export async function downloadPdfTable(
  title: string,
  subtitle: string,
  columns: ReportColumn[],
  rows: any[],
  filename: string
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
    orientation: columns.length > 5 ? "landscape" : "portrait",
  });
  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
  const MARGIN = 36;
  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20, 110, 90);
  doc.text("Curo", MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(110, 110, 110);
  doc.text(title, MARGIN, y + 16);
  if (subtitle) doc.text(subtitle, MARGIN, y + 30);
  y += 48;

  const colWidth = (PAGE_WIDTH - MARGIN * 2) / columns.length;

  function drawHeader() {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);

  columns.forEach((c, i) => {
    doc.text(c.header, MARGIN + i * colWidth, y);
  });

  // Space between heading and line
  y += 8;

  doc.setDrawColor(220, 220, 220);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);

  // Space between line and content
  y += 10;
}

  function resetBodyStyle() {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(20, 20, 20);
  }

  drawHeader();
  resetBodyStyle();

  rows.forEach((row) => {
    if (y > PAGE_HEIGHT - MARGIN - 20) {
      doc.addPage();
      y = MARGIN;
      drawHeader();
      resetBodyStyle();
    }
    columns.forEach((c, i) => {
      const text = doc.splitTextToSize(c.value(row), colWidth - 6)[0] ?? "";
      doc.text(text, MARGIN + i * colWidth, y);
    });
    y += 14;
  });

  doc.save(filename);
}