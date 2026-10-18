# Fitness Tracker — Project Audit (Read-Only)

**Audit date:** 2026-10-18  
**Scope:** Entire repository (`backend/`, `frontend/`, config). No project-root `README.md` or `.env.example` found.

---

## 1. Overview

### Tech stack (from `package.json` and source)

| Layer | Technology | Version (declared / observed) |
|--------|------------|-------------------------------|
| Runtime | Node.js | **v24.21.0** on audit machine (`node -v`); not pinned in repo |
| Backend framework | Express | `^5.3.0` (`backend/package.json`) |
| Database ODM | Mongoose | `^9.11.2` |
| Database | MongoDB (Atlas URI in `.env`) | UNVERIFIED cluster availability from all networks |
| Auth (intended) | JWT in httpOnly cookie + bcrypt | `jsonwebtoken` `^9.0.3`, `bcrypt` `^6.0.0` |
| Backend utilities (installed, mostly unused) | cors, cookie-parser, dotenv, nodemon | See `backend/package.json` |
| Frontend | React | `^18.3.1` |
| Build tool | Vite | `^5.3.1` (lock resolved **5.4.21** at build time) |
| Routing | react-router-dom | `^6.30.6` |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` | `^4.3.3` |
| Charts (in unused pages) | recharts | `^2.12.7` |
| HTTP client (installed, unused in `src/`) | axios | `^1.20.0` |
| UI component library | **None** (custom JSX + Tailwind utilities on auth screens only) |

### Folder tree (2–3 levels)

```
fitness-tracker/
├── backend/                 # Node/Express API (minimal; auth code not wired in server)
│   ├── config/db.js         # Mongoose connection using MONGO_URI
│   ├── controllers/         # authController.js only
│   ├── models/              # UserModel.js only
│   ├── routes/              # authRoutes.js only (not mounted)
│   ├── server.js            # Entry: JSON parser + DB connect + listen
│   ├── package.json
│   └── .env                 # MONGO_URI, PORT, SECRETKEY (present on disk; no .env.example)
└── frontend/                # Vite + React SPA
    ├── src/
    │   ├── pages/           # Login, Signup, Dashboard, Workouts, Nutrition, Progress, Profile
    │   ├── components/      # Navbar, FitnessIllustration
    │   ├── App.jsx          # Routes (only Login + Signup active)
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

There is **no** root `README.md`, **no** `.env.example`, and **no** backend `.gitignore` (only `frontend/.gitignore` exists).

### Steps to run on a fresh machine

**Prerequisites:** Node.js/npm, MongoDB Atlas (or local Mongo) reachable from the machine, network access.

1. **Backend**
   - `cd backend`
   - `npm install`
   - Create `backend/.env` with:
     - `MONGO_URI` — MongoDB connection string (required; see `backend/config/db.js` lines 9–13)
     - `PORT` — optional, default **5000** (`backend/server.js` line 12)
     - `SECRETKEY` — required for JWT signing in `loginController` (`backend/controllers/authController.js` lines 71–74)
   - `npm run dev` or `node server.js`
   - Expected log: `MongoDB connected successfully!` then `Server running on port 5000`

2. **Frontend**
   - `cd frontend`
   - `npm install`
   - `npm run dev` (Vite default port **5173** — UNVERIFIED exact port unless dev server is started; Vite default is standard)
   - Open the URL Vite prints in the terminal

3. **How DB connects**
   - `server.js` calls `connectDb()` from `config/db.js`, which runs `mongoose.connect(process.env.MONGO_URI)`.

**What will stop it from running or using features**

| Blocker | Evidence |
|---------|----------|
| Missing/invalid `MONGO_URI` | `db.js` throws and `process.exit(1)` on failure (lines 18–20) |
| Atlas IP not whitelisted | Observed on audit machine: connection failed with Atlas whitelist message when running `node server.js` |
| **Auth API unreachable** | `server.js` does **not** import or `app.use()` any routes — no HTTP endpoints except implicit 404 |
| **Frontend never calls backend** | No `fetch`/`axios` in `frontend/src/` (grep empty) |
| **Main app pages not routed** | Dashboard/Workouts/etc. routes commented out in `App.jsx` lines 23–27 |
| `/login` route missing | `Signup.jsx` links to `/login` (line 85) but `App.jsx` only defines `/` for Login — catch-all sends `/login` → `/` |
| `meController` broken if mounted | Uses `req.userId` with **no middleware** setting it (`authController.js` line 132) |
| JWT cookies not parsed | `cookie-parser` in dependencies but **not** used in `server.js` |
| CORS not configured | `cors` in dependencies but **not** used — browser calls from `:5173` to `:5000` would fail once wired |

**Build check:** `npm run build` in `frontend/` succeeded (38 modules — only Login/Signup bundle, not feature pages).

---

## 2. Backend inventory

### Mongoose models

| Model | Collection name | Field | Type | Required | Unique | Notes |
|-------|-------------------|-------|------|----------|--------|-------|
| **User** (`UserModel.js`) | `users` | `name` | String | No | No | Not validated in schema |
| | | `email` | String | No | Yes (`unique: true`) | Trimmed in controller, not schema |
| | | `password` | String | No | No | Hashed in `signupController` |
| | | `role` | String | No | No | `enum: ["admin","user"]`, default `"user"` |

**No other models** (no Workout, Nutrition, Progress, Notification, etc.).

### API routes

Routes are **defined** in `backend/routes/authRoutes.js` but **NOT registered** on the Express app in `server.js`. If mounted at e.g. `/api/auth`, they would be:

| Method | Path (as defined) | Controller | Protected? | Role restrictions |
|--------|---------------------|------------|------------|-------------------|
| POST | `/signup` | `signupController` | Public | None |
| POST | `/login` | `loginController` | Public | None |
| POST | `/logout` | `logoutController` | Public | None |
| POST | `/me` | `meController` | **Intended protected** | **Broken:** no auth middleware; `req.userId` never set |

**Effective live routes today:** **None** (empty Express app with JSON middleware only).

### Middleware, validation, security plumbing

| Concern | Status | Evidence |
|---------|--------|----------|
| JSON body parser | Present | `server.js` line 10 |
| CORS | **Missing** (package installed) | Not in `server.js` |
| Cookie parser | **Missing** (package installed) | Login sets cookie (`authController.js` 78–83) but server never parses cookies |
| Auth middleware (JWT verify) | **Missing** | No file under `backend/`; `meController` expects `req.userId` |
| Input validation library (e.g. Joi/Zod) | **Missing** | Manual `if (!name \|\| !email \|\| !password)` only |
| Central error handler | **Missing** | try/catch per controller only |
| File upload | **Missing** | No multer or similar |
| Password hashing | **Present** | `bcrypt.hash` / `bcrypt.compare` in `authController.js` |
| Token handling | **Partial** | JWT signed on login; httpOnly cookie; no verify middleware; logout clears cookie |

---

## 3. Frontend inventory

### Routing (`App.jsx`)

| Path | Component | Public / Protected | Active? |
|------|-----------|-------------------|---------|
| `/` | `Login` | Public | Yes |
| `/signup` | `Signup` | Public | Yes |
| `/` (dashboard) | `Dashboard` + `Private` | Protected | **Commented out** (lines 23–27) |
| `/workouts` | `Workouts` | Protected | Commented out |
| `/nutrition` | `Nutrition` | Protected | Commented out |
| `/progress` | `Progress` | Protected | Commented out |
| `/profile` | `Profile` | Protected | Commented out |
| `*` | Redirect to `/` | — | Yes |

**Protection mechanism:** `Private` checks `localStorage.getItem("user")` (`App.jsx` lines 6–8). Not server session/JWT.

### Shared components

| Component | File | Role |
|-----------|------|------|
| `Navbar` | `components/Navbar.jsx` | Nav links, mobile menu toggle, logout clears localStorage |
| `FitnessIllustration` | `components/FitnessIllustration.jsx` | SVG on auth pages |

### State management & API

- **State:** React `useState` per page only. No Context, Redux, or React Query.
- **API calls:** **None** in `frontend/src/`. `axios` is in `package.json` but unused.
- **Persistence:** `localStorage` key `"user"` for fake auth and partial profile.

### Page classification

| Page | Status | Proof |
|------|--------|-------|
| **Login** | **FAKE** | `handleSubmit` writes `localStorage` only; no password check (`Login.jsx` 12–16) |
| **Signup** | **FAKE** | Same pattern; password never sent to server (`Signup.jsx` 11–14) |
| **Dashboard** | **FAKE** | Hard-coded `calories`, `recentWorkouts`, `recentMeals` arrays; comment "Dummy data" (`Dashboard.jsx` 3–17); not in router |
| **Workouts** | **FAKE** | `startData` seed + in-memory CRUD (`Workouts.jsx` 3–26); not in router |
| **Nutrition** | **FAKE** | `startData` + local state (`Nutrition.jsx` 3–23); not in router |
| **Progress** | **FAKE** | `startData` + local chart (`Progress.jsx` 4–21); not in router |
| **Profile** | **PARTIAL / FAKE** | Extra fields (age, height, goalWeight, units) only in component state; save writes name/email to localStorage only (`Profile.jsx` 5–14); not in router |

**Styling note:** Auth pages use Tailwind utility classes. Other pages use custom class names (`card`, `navbar`, `page-title`, etc.) but `index.css` only contains `@import "tailwindcss";` — **no definitions** for those classes. If routes were enabled, layout would likely look broken unless Tailwind scans those names (they are not Tailwind utilities).

---

## 4. Feature checklist (FR-1 – FR-24)

Scoring legend: **DONE** = end-to-end with real backend; **PARTIAL** = some pieces exist; **FAKE** = UI/mock/local only; **NOT STARTED** = no meaningful code.

| ID | Requirement | Status | Evidence | What's missing |
|----|-------------|--------|----------|----------------|
| FR-1 | User registration | **PARTIAL** | Backend: `signupController`, `UserModel`, route in `authRoutes.js`. Frontend: `Signup.jsx` fakes signup | Mount routes; CORS/cookies; wire Signup to POST `/signup`; real validation/errors in UI |
| FR-2 | Registration profile data | **NOT STARTED** | Signup collects name/email/password only (`Signup.jsx`, `UserModel`) | Schema fields (age, goals, etc.); API + form |
| FR-3 | User login | **PARTIAL** | Backend: `loginController` with bcrypt + JWT cookie. Frontend: `Login.jsx` fakes login | Wire Login to API; cookie credentials; protected routes using server auth |
| FR-4 | User profile | **PARTIAL** | Backend: `meController` (broken). Frontend: `Profile.jsx` (localStorage) | Auth middleware; GET profile route; mount routes; connect Profile UI |
| FR-5 | Profile update | **NOT STARTED** | Profile save only updates localStorage (`Profile.jsx` 10–14) | PUT/PATCH user API; persist extended fields in MongoDB |
| FR-6 | Workout routines (CRUD) | **FAKE** | `Workouts.jsx`: add/list/delete in memory; **no edit**; not “routines” (single exercises) | Backend model/routes; edit; persist; enable routes |
| FR-7 | Routine contents (name, sets, reps, weights, notes) | **PARTIAL** | Sets/reps/weight in `Workouts.jsx`; **no notes** field | Notes; nested routine/exercises model; backend |
| FR-8 | Categories and tags | **PARTIAL** | Category select on workouts (`Workouts.jsx` 43–48); no tags | Tags; backend; nutrition/workout taxonomy |
| FR-9 | Food logging by meal type | **FAKE** | `Nutrition.jsx` mealType select + mock data | API + persistence |
| FR-10 | Nutrition entry details | **FAKE** | Form for food, cal, macros (`Nutrition.jsx`) | Backend; daily aggregation |
| FR-11 | Progress records | **FAKE** | Weight/waist in `Progress.jsx` | Body measurements API; performance metrics |
| FR-12 | Progress graphs | **FAKE** | Recharts line chart on local data (`Progress.jsx` 36–48) | Data from DB; time range |
| FR-13 | Personal dashboard | **FAKE** | `Dashboard.jsx` exists; route disabled | Route + real API data |
| FR-14 | Dashboard content (recent workouts, nutrition, progress) | **FAKE** | Static lists in `Dashboard.jsx` 8–17, 48–67 | Backend aggregation endpoints |
| FR-15 | Workout analytics | **NOT STARTED** | No charts on Workouts page | History APIs; chart components |
| FR-16 | Nutrition analytics | **FAKE** | Dashboard bar chart uses dummy `calories` array (`Dashboard.jsx` 4–7, 33–45) | Real daily trends API |
| FR-17 | Activity notifications | **NOT STARTED** | No code | Models, triggers, UI |
| FR-18 | Alerts and reminders | **NOT STARTED** | No code | Scheduling, preferences |
| FR-19 | Search | **PARTIAL** | Workout name search client-side (`Workouts.jsx` 29–33) | Nutrition/user search; server-side search |
| FR-20 | Filters | **PARTIAL** | Category filter on workouts (`Workouts.jsx` 58–63) | Filters elsewhere; API query params |
| FR-21 | Mobile responsiveness | **PARTIAL** | Auth: `md:flex-row` (`Login.jsx` 20); Navbar hamburger (`Navbar.jsx` 17–19) | Feature pages unrouted; dashboard CSS classes unclear |
| FR-22 | Reports and export (PDF/CSV) | **NOT STARTED** | No libraries or routes | Export endpoints + UI |
| FR-23 | User preferences | **PARTIAL** | Units select in Profile (`Profile.jsx` 37–41); not persisted fully | Notifications, theme; backend prefs |
| FR-24 | User support | **NOT STARTED** | No help/feedback pages | Support UI + optional ticket API |

### Summary counts

| Status | Count |
|--------|------:|
| DONE | 0 |
| PARTIAL | 11 |
| FAKE | 8 |
| NOT STARTED | 5 |

*(24 total)*

---

## 5. Non-functional check

| Area | Assessment |
|------|------------|
| **Responsive design** | Auth screens use responsive Tailwind; Navbar has mobile menu. Feature pages unverified in browser (routes off). |
| **Security** | Passwords hashed on signup (good). JWT secret from env (good if strong). **High risk:** `backend/.env` with live `MONGO_URI` and weak `SECRETKEY=change_this_to_a_long_random_secret` on disk; no root/backend `.gitignore`. `db.js` error text embeds a sample Atlas URI with username (line 12). No authorization layer for user-owned data (no resource APIs yet). Frontend auth is trivially bypassed via localStorage. |
| **Input validation** | Minimal server checks; no email format/password strength; Mongoose schema does not enforce required fields. |
| **Performance** | N/A at current scale; no pagination, indexes beyond unique email. |
| **Error handling** | Per-controller try/catch; no global handler; frontend no API error UX. |
| **Code quality** | Small codebase; dead backend routes; duplicated fake-auth pattern; inconsistent routing (`/` vs `/login`). |
| **Documentation** | No project README or setup guide in repo. |
| **Tests** | `backend/package.json` script exits with error; no test files in app source. |

---

## 6. Completion estimate

### Method

- Each **DONE** = 100%, **PARTIAL** = 50%, **FAKE** = 0%, **NOT STARTED** = 0% (strict: FAKE is not counted as delivered).
- FR group score = average of FR items in that group.

### Functional requirements (24 items)

| Group | Items | Calculation | % |
|-------|-------|-------------|---|
| Auth & profile (FR-1–5) | 5 | (0.5×4 + 0) / 5 | **40%** |
| Workouts (FR-6–8) | 3 | (0 + 0.5 + 0.5) / 3 | **33%** |
| Nutrition (FR-9–10) | 2 | 0 | **0%** |
| Progress (FR-11–12) | 2 | 0 | **0%** |
| Dashboard (FR-13–14) | 2 | 0 | **0%** |
| Analytics (FR-15–16) | 2 | 0 | **0%** |
| Notifications (FR-17–18) | 2 | 0 | **0%** |
| Search/filters (FR-19–20) | 2 | (0.5 + 0.5) / 2 | **50%** |
| UX/misc (FR-21–24) | 5 | (0.5 + 0 + 0 + 0.5 + 0) / 5 | **20%** |
| **All FR-1–24** | 24 | 11×0.5 / 24 | **≈23%** |

### Layer estimates

| Layer | Rationale | % |
|-------|-----------|---|
| **Backend** | 1 model; auth controllers ~complete but unrouted; no domain APIs; missing middleware/CORS/cookies | **≈15%** |
| **Frontend** | Polished auth UI; 5 feature prototypes with mock data; no API layer; main routes disabled | **≈30%** |
| **Integration** | Zero frontend→backend calls; auth systems disconnected | **0%** |

### Overall

Weighted: **40% backend + 40% frontend + 20% integration**  
→ 0.4×15 + 0.4×30 + 0.2×0 = **≈18% overall**

(Rounded headline: **~18–23%** depending on weighting; FR-only average **~23%**.)

---

## 7. Problems found (ranked)

### High

1. **Auth routes not mounted** — `authRoutes.js` never imported in `server.js`; entire backend API is dead on startup.
2. **Frontend/backend disconnected** — Login/Signup use `localStorage` only; no HTTP client usage despite `axios` installed.
3. **Secrets in repo workspace** — `backend/.env` contains database credentials and weak JWT secret; no `.env.example`; backend not in `.gitignore`.
4. **`meController` cannot work** — Expects `req.userId` with no JWT middleware (`authController.js` 130–132).
5. **Fake authentication** — Any email/password “logs in”; no security for future protected pages (`Login.jsx` 12–16).

### Medium

6. **Feature routes commented out** — Users cannot reach Dashboard/Workouts/Nutrition/Progress/Profile (`App.jsx` 23–27).
7. **CORS and cookie-parser unused** — Will block cookie-based login from Vite dev origin once wired.
8. **Missing `/login` route** — Links in `Signup.jsx` / `Navbar.jsx` use `/login` but router only has `/` for login.
9. **User schema weak** — No required fields; profile/registration data not modeled.
10. **Workout “routines”** — Single-exercise log entries; no edit; data lost on refresh.

### Low

11. **Custom CSS classes undefined** — `card`, `navbar`, etc. not in `index.css` (only Tailwind import).
12. **Unused dependencies** — axios, cors, cookie-parser add noise.
13. **MongoDB error message leaks connection hint** — `db.js` line 12.
14. **No tests, no README, no `.env.example`** — Onboarding and exam readiness suffer.
15. **`/me` as POST** — Unusual vs GET; minor API design inconsistency.

---

## 8. Extra features (not in requirements)

No social/follow, forum, or admin UI beyond unused `role` field on User schema.

**In-repo extras (cosmetic / dev):**

- Animated SVG `FitnessIllustration` on auth pages.
- Urdu/English mixed UI copy on Signup (`Signup.jsx` 43, 83–88).
- `role: admin | user` on user schema with no admin routes.

---

## 9. Remaining work (prioritized)

| Priority | Task | Effort | Files to create or change |
|----------|------|--------|---------------------------|
| P0 | Mount auth routes, CORS, cookie-parser, env docs | **Small** | `backend/server.js`; add `backend/.env.example`; add `backend/.gitignore` |
| P0 | JWT auth middleware + fix `/me` | **Medium** | Create `backend/middleware/authMiddleware.js`; update `authRoutes.js`, `authController.js` |
| P0 | Wire Login/Signup to API (`credentials: 'include'`) | **Medium** | `frontend/src/pages/Login.jsx`, `Signup.jsx`; create `frontend/src/api/client.js` (axios instance) |
| P0 | Uncomment and fix routes (`/login`, dashboard paths) | **Small** | `frontend/src/App.jsx` |
| P1 | User profile fields + update API | **Medium** | `backend/models/UserModel.js`; new `userController.js`, `userRoutes.js`; `Profile.jsx` |
| P1 | Workout model + CRUD API + connect Workouts page | **Large** | New `models/WorkoutModel.js`, `controllers/workoutController.js`, `routes/workoutRoutes.js`; `Workouts.jsx` |
| P1 | Nutrition model + API + page wiring | **Large** | New nutrition model/routes/controller; `Nutrition.jsx` |
| P1 | Progress model + API + charts from DB | **Large** | New progress model/routes/controller; `Progress.jsx`, `Dashboard.jsx` |
| P2 | Dashboard aggregation endpoints | **Medium** | New `dashboardController.js`; update `Dashboard.jsx` |
| P2 | Analytics (FR-15–16), notifications (FR-17–18) | **Large** | Multiple new modules |
| P2 | Search/filter on server | **Medium** | Query params on list endpoints; UI updates |
| P3 | Export PDF/CSV, support pages, tests | **Large** | New routes, libraries, `README.md` |
| P3 | Restore styling for app pages | **Small** | `frontend/src/index.css` or convert pages to Tailwind utilities |

---

## 10. Learning section (MongoDB background)

### One full request: backend signup (the only real server flow implemented)

This is what **should** happen when registration is wired; today the React app **does not** call it.

1. **User submits form** — Would be `Signup.jsx` `handleSubmit` (currently skips the network).
2. **HTTP request** — Would be `POST http://localhost:5000/.../signup` with JSON `{ name, email, password }` (exact prefix depends on how you mount `authRoute` in `server.js` — **not configured yet**).
3. **Express route** — `authRoutes.js` line 10 → `signupController`.
4. **Controller** — `authController.js` `signupController`: validates body (lines 8–13), normalizes email (15–16), checks duplicate (16–17), hashes password with bcrypt (19), creates `UserModel` document (21–27), `save()` to MongoDB.
5. **MongoDB** — Mongoose writes to the `users` collection (model name `"users"` in `UserModel.js` line 26).
6. **Response** — `201` JSON `{ status: "success", message: "Account Created Successfully" }` (lines 28–31).
7. **UI update** — Would show success and redirect to login; **not implemented**.

**Login flow (backend only):** `loginController` finds user, compares bcrypt hash, signs JWT with `SECRETKEY`, sets httpOnly `token` cookie, returns user JSON (`authController.js` 47–93).

### Glossary

| Term | Meaning in this project |
|------|-------------------------|
| **Express** | Node web server framework; `server.js` creates the app. |
| **Route** | URL + HTTP method mapped to a controller function (`authRoutes.js`). |
| **Controller** | Function that handles request logic (`authController.js`). |
| **Mongoose model** | JavaScript schema for a MongoDB collection (`UserModel.js`). |
| **Middleware** | Function that runs before a controller (e.g. JWT verify) — **missing here**. |
| **JWT** | JSON Web Token; server signs `{ id: user._id }` on login. |
| **bcrypt** | Library to hash passwords before storing in MongoDB. |
| **CORS** | Browser security; needed for React (port 5173) calling API (5000). |
| **httpOnly cookie** | Cookie JavaScript cannot read; used for `token` on login. |
| **React component** | UI function, e.g. `Login.jsx`. |
| **Hook** | `useState`, `useNavigate` — React state and routing helpers. |
| **react-router-dom** | Client-side pages (`App.jsx` `Routes`). |
| **localStorage** | Browser key-value store; used for fake “logged in user”. |
| **Vite** | Frontend dev server and bundler (`npm run dev`). |
| **SPA** | Single-page app; one `index.html`, JS swaps pages. |

### 15 examiner-style Q&A (from this codebase)

1. **Which database does the project use?** MongoDB, accessed via Mongoose in `backend/config/db.js`.
2. **What is the only Mongoose model?** `UserModel` in `backend/models/UserModel.js` (collection `users`).
3. **How are passwords stored?** Hashed with bcrypt in `signupController` before `userDoc.save()`.
4. **Does the React login page call the API?** No; it only sets `localStorage` (`Login.jsx` 14–15).
5. **Where are auth routes registered?** They are not; `server.js` only starts DB and listens.
6. **What port does the backend default to?** 5000 (`server.js` line 12).
7. **How does the app decide if a user is “logged in” on the frontend?** `Private` checks `localStorage.getItem("user")` in `App.jsx`.
8. **What env variable is required for JWT?** `SECRETKEY` in `loginController` (`authController.js` 73).
9. **Are workout records saved to MongoDB?** No; only in React state in `Workouts.jsx`.
10. **Which library draws charts?** `recharts` in `Dashboard.jsx` and `Progress.jsx`.
11. **Can users edit a workout after adding?** No; only add and delete in `Workouts.jsx`.
12. **What meal types does nutrition support in the UI?** breakfast, lunch, dinner, snack (`Nutrition.jsx` 42–46).
13. **Is there an admin panel?** No; `role` exists on schema but no admin routes.
14. **Why would `meController` fail today?** `req.userId` is never set; no auth middleware.
15. **Which pages are reachable in the running app?** Only `/` (login) and `/signup` per active routes in `App.jsx`.

---

## 11. Final summary (Roman Urdu)

1. Ye project abhi **kam complete** hai — overall lagbhag **18–23%** ka kaam hua hai.  
2. **Frontend** par login aur signup ke **khoobsurat screens** hain lekin ye **asli server se baat nahi karte**, sirf browser ki **localStorage** use hoti hai.  
3. **Backend** par signup/login ka code likha hai aur **MongoDB user save** ho sakta hai, lekin **routes server.js se connect hi nahi** hain.  
4. Dashboard, workouts, nutrition, progress, profile ke **pages bane hue hain** magar **routes band** hain aur **naqli (dummy) data** par chalte hain.  
5. **MongoDB se sirf users** ka model hai; workouts ya khana ka **koi database schema nahi**.  
6. **JWT aur bcrypt** backend par tayyar hain, lekin **frontend integration zero** hai.  
7. **Requirements ka zyada tar hissa** — analytics, notifications, export, support — **shuru bhi nahi** hua.  
8. **`.env` file mein secrets** hain aur **README / .env.example nahi** — nayi machine par setup mushkil hai.  
9. Agar Atlas par **IP whitelist** na ho to backend **start hote hi band** ho jata hai (audit machine par ye hua).  
10. Sab se **bada masla**: do alag duniya — **React fake login** aur **Express auth jo chalta hi nahi** — jab tak ye **jodna** na ho, project demo ke liye **poora nahi** mana ja sakta.

---

*End of audit.*
