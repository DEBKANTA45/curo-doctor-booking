# Curo — Doctor Booking Website (Frontend Only)

A Practo-style doctor discovery & appointment booking website. Built with
**Next.js 14 (App Router) + TypeScript + Tailwind CSS**. There is no backend —
all doctor data comes from local JSON files, and login/registration/appointments
are simulated with the browser's `localStorage`, so the flows are fully
functional to click through and demo.

## What's included

- **Home page** (`/`) — hero search, specialties grid, top-rated doctors
- **Doctor listing** (`/doctors`) — filter by specialty, city, search, sort
- **Doctor profile** (`/doctors/[slug]`) — unique page per doctor: about, availability, reviews
- **Booking flow** (`/doctors/[slug]/book`) — pick date & time, confirm — its own route, not a modal
- **Patient login/register** (`/login`, `/register`)
- **Doctor login/register** (`/doctor/login`, `/doctor/register`)
- **Patient dashboard** (`/appointments`) — upcoming & past bookings, cancel
- **Doctor dashboard** (`/doctor/dashboard`) — bookings received

Every page is a real route (no popup/modal-only flows), matching the ask.

## Project structure

```
src/
  app/                  routes (App Router — one folder per URL)
  components/           reusable UI pieces (Navbar, DoctorCard, forms, ...)
  context/AuthContext.tsx   shares the logged-in user across the app
  data/                 mock JSON (doctors.json, specialties.json, reviews.json)
  lib/                  types, localStorage "mock database", helpers
```

---

## Step-by-step: open and run this in VS Code

### 1. Install prerequisites (one-time, skip if already installed)
- Install **Node.js LTS** (18.18+ or 20+) from https://nodejs.org — this also installs `npm`.
- Install **VS Code** from https://code.visualstudio.com
- Recommended VS Code extensions: *ES7+ React/Redux snippets*, *Tailwind CSS IntelliSense*, *ESLint*.

### 2. Unzip the project
Unzip the downloaded `curo-doctor-booking.zip` anywhere on your machine, e.g. `Desktop/curo-doctor-booking`.

### 3. Open it in VS Code
- Open VS Code
- `File → Open Folder…` → select the unzipped `curo-doctor-booking` folder

### 4. Open the integrated terminal
- Menu: `Terminal → New Terminal` (or `` Ctrl+` ``)

### 5. Install dependencies
```bash
npm install
```
This downloads Next.js, React, Tailwind, and the icon library into `node_modules`.

### 6. Run the dev server
```bash
npm run dev
```
You'll see something like:
```
▲ Next.js 14.2.5
- Local:  http://localhost:3000
```

### 7. View it
Open **http://localhost:3000** in your browser. VS Code may also show a
"Open in Browser" popup — click it.

### 8. Try the flows
- Go to **Sign up** → create a patient account (data is saved in your browser's localStorage)
- Browse **Find Doctors**, open any doctor's profile, click **Book appointment**
- Pick a date/time and confirm → see it under **My Appointments** (top-right menu)
- Log out, then go to **For Doctors → Register your practice** to see the doctor side
- **Doctor Dashboard** shows bookings made under the exact same doctor name — since there's no
  real backend, that's how the demo links a booking to a doctor account.

### 9. Make changes
- Edit any file in `src/app` or `src/components` — the browser auto-refreshes (hot reload).
- To add/edit doctors, edit `src/data/doctors.json` (each entry needs a unique `id` and `slug`).
- To change colors/fonts, edit `tailwind.config.ts` and `src/app/layout.tsx`.

### 10. Build for production (optional)
```bash
npm run build
npm run start
```

---

## Notes on the "no backend" design
- **Doctors, specialties, reviews** → static JSON in `src/data/`, imported directly.
- **Accounts, sessions, appointments** → stored in the browser via `localStorage`
  (see `src/lib/mock-db.ts`). This resets if you clear browser storage, and is
  per-browser only — there's no server or database.
- If you later want a real backend, the functions in `mock-db.ts` are the exact
  seam to replace with real API calls (e.g. `fetch('/api/...')`), since every
  page already calls through that file instead of touching `localStorage` directly.
