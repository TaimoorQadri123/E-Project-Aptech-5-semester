# FitTrack Developer Guide

## Project structure

```
backend/          Express API, Mongoose models, uploads/
frontend/src/     React pages, AuthContext, api/client.js
docs/             User and developer guides
```

## Run locally

1. MongoDB running (example URI: `mongodb://127.0.0.1:27017/fitness_tracker`).
2. `backend/.env`: `MONGO_URI`, `PORT` (5000), `SECRETKEY`.
3. `npm run dev` in `backend` and `frontend`.
4. CORS origin is `http://localhost:5173`.

## Environment variables

| Variable | Purpose |
|----------|---------|
| MONGO_URI | MongoDB connection string |
| PORT | API port (default 5000) |
| SECRETKEY | JWT signing secret |

## Database models (main fields)

| Model | Key fields |
|-------|------------|
| **User** | username (unique display name), email, password, profilePicture, age, gender, heightCm, goal, targetWeightKg, preferences, role |
| **Workout** | user, title, category, date, durationMin, exercises[], tags[] |
| **Meal** | user, date, mealType, items[], totals |
| **ProgressEntry** | user, date, metric, value, note (unique user+metric+date) |
| **Notification** | user, type (workout \| goal \| reminder), message, read |
| **Reminder** | user, title, type, time, days[], enabled, lastFiredDate |
| **Feedback** | user, subject, category, message, status |

## Authentication

- Signup: `POST /api/auth/signup` multipart — `username`, `email`, `password`, `confirmPassword`, `privacyConsent`, `profilePicture` (required). Profile fields use schema defaults until the user updates Profile.
- Login: `POST /api/auth/login` with `{ login, password }` — `login` is email or username (the signup **Name**).
- API responses include `name` as an alias of `username` via `userToJSON()` for backward compatibility.
- JWT stored in httpOnly cookie `token` (7 days).
- `middleware/authMiddleware.js` verifies cookie and sets `req.user.id`.

## API endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | /api/health | No |
| POST | /api/auth/signup | No (multipart) |
| POST | /api/auth/login, /logout | No |
| GET | /api/auth/me | Yes |
| GET | /api/users/search?q= | Yes |
| GET | /api/users/me/export | Yes |
| DELETE | /api/users/me | Yes (body: password) |
| GET/PUT | /api/users/me/preferences | Yes |
| PUT | /api/users/me/picture | Yes (multipart) |
| GET/PUT | /api/users/me, PUT .../password | Yes |
| CRUD | /api/workouts, /api/nutrition, /api/progress | Yes |
| GET | /api/dashboard, /api/analytics/* | Yes |
| GET/PATCH/DELETE | /api/notifications/* | Yes |
| CRUD | /api/reminders, POST .../:id/fire | Yes |
| GET | /api/reports/:type?from&to&format | Yes |
| POST/GET | /api/support | Yes |

Static files: `GET /uploads/:filename` from `backend/uploads/`.

## Adding a new feature (pattern)

1. **Model** in `backend/models/`.
2. **Controller** with `user: req.user.id` on every query.
3. **Route** in `backend/routes/`, mount in `server.js` under `/api/...`.
4. **Frontend page** using `client` from `src/api/client.js` (`withCredentials: true`).
5. Add route in `App.jsx` and Navbar link if needed.
6. Extend `backend/smoke-test.js` for one happy-path call.

## Tests

```bash
cd backend
npm run smoke
```

Requires the API running on port 5000.
