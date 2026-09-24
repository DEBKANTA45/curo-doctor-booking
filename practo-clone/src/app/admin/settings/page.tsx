"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Bell, Eye, EyeOff, KeyRound, Lock, LogOut, SlidersHorizontal, UserRound } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { ADMIN_IDLE_TIMEOUT_MS } from "@/lib/admin-auth";
import {
  AdminNotificationPrefs,
  DEFAULT_NOTIFICATION_PREFS,
  MIN_PASSWORD_LENGTH,
  PlatformSettings,
  changeAdminPassword,
  getNotificationPrefs,
  getPlatformSettings,
  saveNotificationPrefs,
  savePlatformSettings,
  updateAdminProfile,
} from "@/lib/admin-users";
import { logAdminAction } from "@/lib/mock-db";
import StatusBadge from "@/components/admin/StatusBadge";
import ToggleSwitch from "@/components/admin/ToggleSwitch";
import ConfirmActionModal from "@/components/admin/ConfirmActionModal";

type Tab = "profile" | "password" | "notifications" | "platform";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

const PREF_ITEMS: {
  key: "newDoctorRegistrations" | "pendingVerifications" | "failedPayments" | "reportedReviews";
  title: string;
  description: string;
}[] = [
  { key: "newDoctorRegistrations", title: "New doctor registrations", description: "When a doctor signs up on Curo." },
  { key: "pendingVerifications", title: "Pending verifications", description: "When verification requests are waiting for review." },
  { key: "failedPayments", title: "Failed payments", description: "When a booking payment fails." },
  { key: "reportedReviews", title: "Reported reviews", description: "When a review is reported and may need moderation." },
];

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

type PlatformForm = Omit<PlatformSettings, "cancellationWindowHours" | "maxAdvanceBookingDays"> & {
  cancellationWindowHours: string;
  maxAdvanceBookingDays: string;
};

function toForm(s: PlatformSettings): PlatformForm {
  return {
    ...s,
    cancellationWindowHours: String(s.cancellationWindowHours),
    maxAdvanceBookingDays: String(s.maxAdvanceBookingDays),
  };
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { admin, role, can, refresh, logout, sessionStartedAt } = useAdminAuth();
  const canViewPlatform = can("settings", "view");
  const canEditPlatform = can("settings", "edit");

  const tabs: { key: Tab; label: string; icon: typeof UserRound }[] = [
    { key: "profile", label: "Profile", icon: UserRound },
    { key: "password", label: "Password", icon: KeyRound },
    { key: "notifications", label: "Notifications", icon: Bell },
    ...(canViewPlatform ? [{ key: "platform" as Tab, label: "Platform", icon: SlidersHorizontal }] : []),
  ];
  const [tab, setTab] = useState<Tab>("profile");

  // ----- Profile -----
  const [name, setName] = useState(admin?.name ?? "");
  const [phone, setPhone] = useState(admin?.phone ?? "");
  const [profileError, setProfileError] = useState("");
  const [confirmLogout, setConfirmLogout] = useState(false);

  // ----- Password -----
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // ----- Notification preferences -----
  const [prefs, setPrefs] = useState<AdminNotificationPrefs>(() =>
    admin ? getNotificationPrefs(admin.id) : DEFAULT_NOTIFICATION_PREFS
  );

  // ----- Platform -----
  const [savedPlatform, setSavedPlatform] = useState<PlatformSettings>(() => getPlatformSettings());
  const [platform, setPlatform] = useState<PlatformForm>(() => toForm(getPlatformSettings()));
  const [platformError, setPlatformError] = useState("");
  const [confirmMaintenance, setConfirmMaintenance] = useState(false);

  if (!admin) return null;

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    const result = updateAdminProfile(admin!.id, { name, phone });
    if (!result.ok) {
      setProfileError(result.error ?? "Something went wrong.");
      return;
    }
    setProfileError("");
    refresh(); // header + sidebar pick up the new name
    toast.success("Profile updated.");
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword) return setPasswordError("Enter your current password.");
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return setPasswordError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    if (newPassword !== confirmPassword) return setPasswordError("New passwords don't match.");

    const result = changeAdminPassword(admin!.id, currentPassword, newPassword);
    if (!result.ok) return setPasswordError(result.error ?? "Something went wrong.");

    setPasswordError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password changed.");
  }

  function handleSavePrefs() {
    saveNotificationPrefs(admin!.id, prefs);
    toast.success("Notification preferences saved.");
  }

  function validatePlatform(): string {
    if (!platform.platformName.trim()) return "Enter a platform name.";
    if (!EMAIL_RE.test(platform.supportEmail.trim())) return "Enter a valid support email.";
    const hours = Number(platform.cancellationWindowHours);
    if (!Number.isInteger(hours) || hours < 0 || hours > 168) return "Cancellation window must be 0–168 hours.";
    const days = Number(platform.maxAdvanceBookingDays);
    if (!Number.isInteger(days) || days < 1 || days > 365) return "Advance booking must be 1–365 days.";
    return "";
  }

  function persistPlatform() {
    const next: PlatformSettings = {
      ...platform,
      platformName: platform.platformName.trim(),
      supportEmail: platform.supportEmail.trim(),
      supportPhone: platform.supportPhone.trim(),
      cancellationWindowHours: Number(platform.cancellationWindowHours),
      maxAdvanceBookingDays: Number(platform.maxAdvanceBookingDays),
    };
    savePlatformSettings(next);
    setSavedPlatform(next);
    logAdminAction("Updated platform settings", "settings", next.platformName);
    setConfirmMaintenance(false);
    toast.success("Platform settings saved.");
  }

  function handleSavePlatform(e: React.FormEvent) {
    e.preventDefault();
    const problem = validatePlatform();
    if (problem) return setPlatformError(problem);
    setPlatformError("");
    // Turning maintenance mode on affects every user — confirm first.
    if (platform.maintenanceMode && !savedPlatform.maintenanceMode) {
      setConfirmMaintenance(true);
      return;
    }
    persistPlatform();
  }

  function handleLogout() {
    logout();
    setConfirmLogout(false);
    router.push("/admin/login");
  }

  const idleMinutes = Math.round(ADMIN_IDLE_TIMEOUT_MS / 60000);

  return (
    <div className="mx-auto max-w-4xl p-5 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>
      <p className="mt-1 text-sm text-muted">Your account, your notifications and how the platform behaves.</p>

      <div className="mt-6 inline-flex flex-wrap items-center gap-1 rounded-md border border-line bg-bg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 rounded-[6px] px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-surface text-primary shadow-card" : "text-muted hover:text-ink"
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ---------- Profile ---------- */}
      {tab === "profile" && (
        <div className="mt-6 space-y-5">
          <form onSubmit={handleSaveProfile} className="card p-6">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-lg font-medium text-white">
                {admin.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-base font-semibold text-ink">{admin.name}</p>
                <div className="mt-1">
                  {role && <StatusBadge label={role.name} variant="primary" />}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="set-name" className="mb-1.5 block text-xs font-medium text-muted">
                  Full name
                </label>
                <input id="set-name" value={name} onChange={(e) => setName(e.target.value)} className="field" />
              </div>
              <div>
                <label htmlFor="set-phone" className="mb-1.5 block text-xs font-medium text-muted">
                  Phone
                </label>
                <input
                  id="set-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="field"
                  placeholder="98765 43210"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="set-email" className="mb-1.5 block text-xs font-medium text-muted">
                  Email
                </label>
                <input id="set-email" value={admin.email} readOnly className="field cursor-not-allowed opacity-70" />
                <p className="mt-1.5 text-xs text-faint">
                  Your email and role are managed by a Super Admin from Admin Users.
                </p>
              </div>
            </div>

            {profileError && <p className="mt-3 text-sm text-accent">{profileError}</p>}

            <div className="mt-5 flex justify-end border-t border-line pt-4">
              <button type="submit" className="btn-primary btn-sm">
                Save changes
              </button>
            </div>
          </form>

          <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <p className="text-sm font-medium text-ink">This session</p>
              <p className="mt-1 text-xs text-muted">
                Signed in {formatDateTime(sessionStartedAt)}. You&apos;re signed out automatically after {idleMinutes}{" "}
                minutes without activity.
              </p>
            </div>
            <button
              onClick={() => setConfirmLogout(true)}
              className="btn-sm flex items-center gap-1.5 rounded-md border border-accent/40 font-medium text-accent transition-colors hover:bg-accent-light"
            >
              <LogOut size={13} /> Log out
            </button>
          </div>
        </div>
      )}

      {/* ---------- Password ---------- */}
      {tab === "password" && (
        <form onSubmit={handleChangePassword} className="card mt-6 max-w-md p-6">
          <div className="flex items-center gap-2.5">
            <span className="icon-tile-soft">
              <Lock size={18} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">Change password</h2>
              <p className="text-xs text-muted">At least {MIN_PASSWORD_LENGTH} characters.</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {[
              { id: "cur-pw", label: "Current password", value: currentPassword, set: setCurrentPassword, auto: "current-password" },
              { id: "new-pw", label: "New password", value: newPassword, set: setNewPassword, auto: "new-password" },
              { id: "conf-pw", label: "Confirm new password", value: confirmPassword, set: setConfirmPassword, auto: "new-password" },
            ].map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="mb-1.5 block text-xs font-medium text-muted">
                  {f.label}
                </label>
                <input
                  id={f.id}
                  type={showPasswords ? "text" : "password"}
                  autoComplete={f.auto}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  className="field"
                  placeholder="••••••••"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowPasswords((v) => !v)}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink"
          >
            {showPasswords ? <EyeOff size={13} /> : <Eye size={13} />}
            {showPasswords ? "Hide passwords" : "Show passwords"}
          </button>

          {passwordError && <p className="mt-3 text-sm text-accent">{passwordError}</p>}

          <div className="mt-5 flex justify-end border-t border-line pt-4">
            <button type="submit" className="btn-primary btn-sm">
              Change password
            </button>
          </div>
        </form>
      )}

      {/* ---------- Notifications ---------- */}
      {tab === "notifications" && (
        <div className="card mt-6 p-6">
          <h2 className="text-sm font-semibold text-ink">Notify me about</h2>
          <p className="mt-0.5 text-xs text-muted">Saved for your account only.</p>

          <div className="mt-4 divide-y divide-line">
            {PREF_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="text-xs text-muted">{item.description}</p>
                </div>
                <ToggleSwitch
                  label={item.title}
                  checked={prefs[item.key]}
                  onChange={(v) => setPrefs((p) => ({ ...p, [item.key]: v }))}
                />
              </div>
            ))}

            <div className="flex items-center justify-between gap-4 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">Email summary</p>
                <p className="text-xs text-muted">A recap of platform activity.</p>
              </div>
              <select
                value={prefs.digest}
                onChange={(e) => setPrefs((p) => ({ ...p, digest: e.target.value as AdminNotificationPrefs["digest"] }))}
                className="field w-36"
                aria-label="Email summary frequency"
              >
                <option value="off">Off</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end border-t border-line pt-4">
            <button onClick={handleSavePrefs} className="btn-primary btn-sm">
              Save preferences
            </button>
          </div>
        </div>
      )}

      {/* ---------- Platform ---------- */}
      {tab === "platform" && canViewPlatform && (
        <form onSubmit={handleSavePlatform} className="card mt-6 p-6">
          <h2 className="text-sm font-semibold text-ink">Platform settings</h2>
          <p className="mt-0.5 text-xs text-muted">
            {canEditPlatform
              ? "These are saved locally for this demo and aren't wired into booking behaviour yet."
              : "You have view-only access to platform settings."}
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pl-name" className="mb-1.5 block text-xs font-medium text-muted">
                Platform name
              </label>
              <input
                id="pl-name"
                value={platform.platformName}
                disabled={!canEditPlatform}
                onChange={(e) => setPlatform((p) => ({ ...p, platformName: e.target.value }))}
                className="field disabled:opacity-60"
              />
            </div>
            <div>
              <label htmlFor="pl-email" className="mb-1.5 block text-xs font-medium text-muted">
                Support email
              </label>
              <input
                id="pl-email"
                type="email"
                value={platform.supportEmail}
                disabled={!canEditPlatform}
                onChange={(e) => setPlatform((p) => ({ ...p, supportEmail: e.target.value }))}
                className="field disabled:opacity-60"
              />
            </div>
            <div>
              <label htmlFor="pl-phone" className="mb-1.5 block text-xs font-medium text-muted">
                Support phone
              </label>
              <input
                id="pl-phone"
                value={platform.supportPhone}
                disabled={!canEditPlatform}
                onChange={(e) => setPlatform((p) => ({ ...p, supportPhone: e.target.value }))}
                className="field disabled:opacity-60"
              />
            </div>
            <div>
              <label htmlFor="pl-cancel" className="mb-1.5 block text-xs font-medium text-muted">
                Free cancellation window (hours before visit)
              </label>
              <input
                id="pl-cancel"
                type="number"
                min={0}
                value={platform.cancellationWindowHours}
                disabled={!canEditPlatform}
                onChange={(e) => setPlatform((p) => ({ ...p, cancellationWindowHours: e.target.value }))}
                className="field disabled:opacity-60"
              />
            </div>
            <div>
              <label htmlFor="pl-advance" className="mb-1.5 block text-xs font-medium text-muted">
                Max advance booking (days)
              </label>
              <input
                id="pl-advance"
                type="number"
                min={1}
                value={platform.maxAdvanceBookingDays}
                disabled={!canEditPlatform}
                onChange={(e) => setPlatform((p) => ({ ...p, maxAdvanceBookingDays: e.target.value }))}
                className="field disabled:opacity-60"
              />
            </div>
          </div>

          <div className="mt-5 divide-y divide-line border-t border-line">
            <div className="flex items-center justify-between gap-4 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">Allow new doctor registrations</p>
                <p className="text-xs text-muted">Turn off to pause self-registration for doctors.</p>
              </div>
              <ToggleSwitch
                label="Allow new doctor registrations"
                checked={platform.allowDoctorRegistrations}
                disabled={!canEditPlatform}
                onChange={(v) => setPlatform((p) => ({ ...p, allowDoctorRegistrations: v }))}
              />
            </div>
            <div className="flex items-center justify-between gap-4 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">Maintenance mode</p>
                <p className="text-xs text-muted">Shows a maintenance notice to patients and doctors.</p>
              </div>
              <ToggleSwitch
                label="Maintenance mode"
                checked={platform.maintenanceMode}
                disabled={!canEditPlatform}
                onChange={(v) => setPlatform((p) => ({ ...p, maintenanceMode: v }))}
              />
            </div>
          </div>

          {platformError && <p className="mt-2 text-sm text-accent">{platformError}</p>}

          {canEditPlatform && (
            <div className="mt-4 flex justify-end border-t border-line pt-4">
              <button type="submit" className="btn-primary btn-sm">
                Save settings
              </button>
            </div>
          )}
        </form>
      )}

      <ConfirmActionModal
        open={confirmMaintenance}
        onClose={() => setConfirmMaintenance(false)}
        onConfirm={persistPlatform}
        title="Turn on maintenance mode?"
        description="Patients and doctors will see a maintenance notice until you turn this off."
        confirmLabel="Turn on"
        variant="danger"
      />

      <ConfirmActionModal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
        title="Log out?"
        description="You'll be signed out of the Admin Portal on this device."
        confirmLabel="Log out"
        variant="danger"
      />
    </div>
  );
}