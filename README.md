# FitTrack — Fitness Tracker (MERN)

Student Aptech eProject: workouts, nutrition, progress, analytics, reports, and account privacy tools.

**Stack:** React (Vite) + Express + MongoDB + JWT cookies.

## Quick start

1. **MongoDB** — local or Atlas (see `backend/.env.example`).
2. **Backend:** `cd backend` → `npm install` → copy `.env.example` to `.env` → `npm run dev` (port **5000**).
3. **Frontend:** `cd frontend` → `npm install` → `npm run dev` (port **5173**).
4. **Smoke test:** with backend running, `cd backend` → `npm run smoke`.

**Signup:** one **Name** field (unique username, 3–20 chars, letters/numbers/underscore), email, password, confirm password, required profile photo, and privacy consent. Login with **name or email**.

## Documentation

- [User guide](docs/USER_GUIDE.md) — how to use every page
- [Developer guide](docs/DEVELOPER_GUIDE.md) — structure, models, API, auth, adding features
