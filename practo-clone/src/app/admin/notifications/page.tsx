"use client";

import { useEffect, useMemo, useState } from "react";
import { Send, Users, Stethoscope, UserRound, History } from "lucide-react";
import {
  getAccounts,
  getAllPatientsForAdmin,
  sendAdminNotification,
  getBroadcastHistory,
  AdminNotificationBroadcast,
  NotificationAudience,
} from "@/lib/mock-db";
import type { Account } from "@/lib/types";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmActionModal from "@/components/admin/ConfirmActionModal";
import LoadingState from "@/components/admin/LoadingState";
import EmptyState from "@/components/admin/EmptyState";
import ErrorState from "@/components/admin/ErrorState";
import { useAdminAuth } from "@/context/AdminAuthContext";



const AUDIENCE_OPTIONS: { value: NotificationAudience; label: string; icon: typeof Users }[] = [
  { value: "all-patients", label: "All Patients", icon: Users },
  { value: "all-doctors", label: "All Doctors", icon: Stethoscope },
  { value: "selected", label: "Selected users", icon: UserRound },
];

function audienceLabel(audience: NotificationAudience) {
  if (audience === "all-patients") return "All Patients";
  if (audience === "all-doctors") return "All Doctors";
  return "Selected users";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AdminNotificationsPage() {
const { can } = useAdminAuth();
const canCreate = can("notifications", "create");
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [history, setHistory] = useState<AdminNotificationBroadcast[] | null>(null);
  const [error, setError] = useState(false);

  const [audience, setAudience] = useState<NotificationAudience>("all-patients");
  const [message, setMessage] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  function load() {
    setAccounts(null);
    setHistory(null);
    setError(false);
    setTimeout(() => {
      try {
        setAccounts(getAccounts());
        setHistory(getBroadcastHistory());
      } catch {
        setError(true);
      }
    }, 300);
  }

  useEffect(() => {
    load();
  }, []);

  const patientAccounts = useMemo(() => (accounts ?? []).filter((a) => a.role === "patient"), [accounts]);
  const doctorAccounts = useMemo(() => (accounts ?? []).filter((a) => a.role === "doctor"), [accounts]);

  const recipientPreviewCount = useMemo(() => {
    if (audience === "all-patients") return patientAccounts.length;
    if (audience === "all-doctors") return doctorAccounts.length;
    return selectedEmails.size;
  }, [audience, patientAccounts, doctorAccounts, selectedEmails]);

  function toggleSelected(email: string) {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  const canSend = message.trim().length > 0 && recipientPreviewCount > 0;

  function handleSend() {
    if (!canSend) return;
    setSending(true);
    setTimeout(() => {
      const recipientEmails =
        audience === "all-patients"
          ? patientAccounts.map((a) => a.email)
          : audience === "all-doctors"
          ? doctorAccounts.map((a) => a.email)
          : Array.from(selectedEmails);

      sendAdminNotification(message.trim(), audience, recipientEmails);
      setHistory(getBroadcastHistory());
      setSentNotice(`Sent to ${recipientEmails.length} ${recipientEmails.length === 1 ? "person" : "people"}.`);
      setMessage("");
      setSelectedEmails(new Set());
      setSending(false);
      setConfirmOpen(false);
      setTimeout(() => setSentNotice(null), 4000);
    }, 400);
  }

  return (
    <div className="p-5 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Notifications</h1>
      <p className="mt-1 text-sm text-muted">Send announcements to patients, doctors, or specific accounts.</p>

      {error ? (
        <div className="mt-6">
          <ErrorState description="Couldn't load accounts." onRetry={load} />
        </div>
      ) : accounts === null ? (
        <div className="mt-6">
          <LoadingState label="Loading Notification..." />
        </div>
      ) : (
        <>
          {/* Compose card */}
          {canCreate && (
          <div className="card mt-6 p-5">
            <p className="text-sm font-medium text-ink">Send a notification</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {AUDIENCE_OPTIONS.map((opt) => {
                const active = audience === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setAudience(opt.value)}
                    className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "border-primary/40 bg-primary-light text-primary-dark"
                        : "border-line text-muted hover:border-primary/30 hover:text-ink"
                    }`}
                  >
                    <Icon size={14} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          

            {audience === "selected" && (
              <div className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-line p-2">
                {(accounts ?? []).length === 0 ? (
                  <p className="p-2 text-sm text-muted">No accounts yet.</p>
                ) : (
                  accounts.map((a) => (
                    <label
                      key={a.email}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-bg"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmails.has(a.email)}
                        onChange={() => toggleSelected(a.email)}
                        className="h-4 w-4 shrink-0 rounded border-line accent-primary"
                      />
                      <span className="min-w-0 flex-1 truncate text-ink">{a.name}</span>
                      <StatusBadge label={a.role === "doctor" ? "Doctor" : "Patient"} />
                    </label>
                  ))
                )}
              </div>
            )}

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Write your announcement…"
              className="field mt-3 resize-none"
            />

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-muted">
                Will reach <span className="font-medium text-ink">{recipientPreviewCount}</span>{" "}
                {recipientPreviewCount === 1 ? "person" : "people"}
              </p>
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={!canSend}
                className="btn-primary btn-sm flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={13} />
                Send notification
              </button>
            </div>

            {sentNotice && <p className="mt-2 text-xs font-medium text-success">{sentNotice}</p>}
          </div>
             )}

          {/* History */}
          <div className="mt-8">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-ink">
              <History size={15} className="text-primary" /> Notification history
            </p>
            {history === null ? (
              <LoadingState label="Loading history…." />
            ) : history.length === 0 ? (
              <EmptyState title="No notifications sent yet" description="Broadcasts you send will show up here." />
            ) : (
              <div className="flex flex-col gap-2">
                {history.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink">{b.message}</p>
                      <p className="mt-1 text-xs text-muted">{formatDate(b.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge label={audienceLabel(b.audience)} />
                      <span className="text-xs text-faint">{b.recipientCount} recipients</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Send confirmation */}
      <ConfirmActionModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSend}
        loading={sending}
        title="Send this notification?"
        description={`This will notify ${recipientPreviewCount} ${
          recipientPreviewCount === 1 ? "person" : "people"
        } (${audienceLabel(audience)}). This can't be undone.`}
        confirmLabel="Send"
        variant="primary"
      />
    </div>
  );
}