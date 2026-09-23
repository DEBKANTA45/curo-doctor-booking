// Mock admin authentication — a single hardcoded admin account, no real
// backend. Session is just a flag in localStorage, separate from the
// patient/doctor account system since an admin isn't a patient or doctor.

const ADMIN_SESSION_KEY = "curo_admin_session";
const MOCK_ADMIN_EMAIL = "admin@curo.com";
const MOCK_ADMIN_PASSWORD = "admin@7898";
const MOCK_ADMIN_NAME = "Admin";

export function adminLogin(email: string, password: string): { ok: boolean; error?: string } {
  if (
    email.trim().toLowerCase() === MOCK_ADMIN_EMAIL &&
    password === MOCK_ADMIN_PASSWORD
  ) {
    if (typeof window !== "undefined") {
      localStorage.setItem(ADMIN_SESSION_KEY, "true");
    }
    return { ok: true };
  }
  return { ok: false, error: "Invalid admin email or password." };
}

export function adminLogout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export function getAdminName(): string {
  return MOCK_ADMIN_NAME;
}

export function getAdminEmail(): string {
  return MOCK_ADMIN_EMAIL;
}