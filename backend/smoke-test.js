/**
 * API smoke test — run: npm run smoke (server must be on PORT 5000)
 */
const BASE = process.env.API_BASE || "http://localhost:5000/api";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64"
);

let cookie = "";
let passed = 0;
let failed = 0;

function fail(msg) {
  failed++;
  console.error("FAIL:", msg);
}

function ok(msg) {
  passed++;
  console.log("OK:", msg);
}

function storeCookie(res) {
  const raw = res.headers.get("set-cookie");
  if (!raw) return;
  cookie = raw.split(";")[0];
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (cookie) headers.Cookie = cookie;
  const body = options.body;
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${BASE}${path}`, {
    method: options.method || "GET",
    headers,
    body,
  });
  storeCookie(res);
  let data = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else if (ct.includes("text/csv") || ct.includes("application/pdf")) {
    data = await res.text();
  } else {
    data = await res.text();
  }
  return { res, data };
}

function signupForm(username, email, password = "Testpass1") {
  const fd = new FormData();
  fd.append("username", username);
  fd.append("email", email);
  fd.append("password", password);
  fd.append("confirmPassword", password);
  fd.append("privacyConsent", "true");
  fd.append("profilePicture", new Blob([PNG], { type: "image/png" }), "avatar.png");
  return fd;
}

async function login(login, password) {
  cookie = "";
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ login, password }),
  });
}

async function main() {
  const tag = String(Date.now()).slice(-8);
  const userA = {
    username: `sa_${tag}`,
    email: `sa_${tag}@example.com`,
    password: "Testpass1",
  };
  const userB = {
    username: `sb_${tag}`,
    email: `sb_${tag}@example.com`,
    password: "Testpass2",
  };

  let workoutId = "";
  let mealId = "";
  let progressId = "";
  let notificationId = "";
  let reminderId = "";

  // Health
  {
    const { res } = await request("/health");
    res.status === 200 ? ok("health") : fail(`health ${res.status}`);
  }

  // Signup A & B
  {
    const { res, data } = await request("/auth/signup", { method: "POST", body: signupForm(userA.username, userA.email) });
    if (res.status === 201) ok("signup A");
    else fail(`signup A ${res.status} ${JSON.stringify(data)}`);
  }
  {
    const { res } = await request("/auth/signup", {
      method: "POST",
      body: signupForm(userB.username, userB.email, userB.password),
    });
    res.status === 201 ? ok("signup B") : fail(`signup B ${res.status}`);
  }

  // Login by email & by name (username)
  {
    const { res, data } = await login(userA.email, userA.password);
    res.status === 200 && data.user?.username === userA.username ? ok("login by email") : fail("login by email");
  }
  {
    const { res } = await login(userA.username, userA.password);
    res.status === 200 ? ok("login by name") : fail("login by name");
  }

  // Me
  {
    const { res, data } = await request("/auth/me");
    res.status === 200 && data.data?.profilePicture?.startsWith("/uploads/")
      ? ok("auth me + picture path")
      : fail("auth me");
  }

  // Workout create
  {
    const { res, data } = await request("/workouts", {
      method: "POST",
      body: JSON.stringify({
        title: "Smoke workout",
        category: "strength",
        date: "2026-01-15",
        durationMin: 30,
        intensity: "medium",
        exercises: [{ name: "Bench", sets: 3, reps: 10, weightKg: 50 }],
        tags: ["test"],
      }),
    });
    if (res.status === 201) {
      workoutId = data.data._id;
      ok("create workout");
    } else fail("create workout");
  }

  // Nutrition
  {
    const { res, data } = await request("/nutrition", {
      method: "POST",
      body: JSON.stringify({
        date: "2026-01-15",
        mealType: "breakfast",
        items: [{ name: "Oats", quantity: "1 bowl", calories: 300, proteinG: 10, carbsG: 50, fatG: 5 }],
      }),
    });
    if (res.status === 201) {
      mealId = data.data._id;
      ok("create meal");
    } else fail("create meal");
  }

  // Progress
  {
    const { res, data } = await request("/progress", {
      method: "POST",
      body: JSON.stringify({ date: "2026-01-15", metric: "weight", value: 70, note: "smoke" }),
    });
    if (res.status === 201) {
      progressId = data.data._id;
      ok("create progress");
    } else fail("create progress");
  }

  // Dashboard, analytics, search
  {
    const { res } = await request("/dashboard");
    res.status === 200 ? ok("dashboard") : fail("dashboard");
  }
  {
    const { res } = await request("/analytics/workouts?range=30");
    res.status === 200 ? ok("analytics workouts") : fail("analytics workouts");
  }
  {
    const { res } = await request("/analytics/nutrition?range=7");
    res.status === 200 ? ok("analytics nutrition") : fail("analytics nutrition");
  }
  {
    const { res } = await request("/analytics/exercises");
    res.status === 200 ? ok("analytics exercises") : fail("analytics exercises");
  }
  {
    const { res } = await request(`/users/search?q=${userB.username.slice(0, 4)}`);
    res.status === 200 ? ok("user search") : fail("user search");
  }

  // Notifications & reminders
  {
    const { res, data } = await request("/notifications");
    if (res.status === 200) {
      const workoutNote = data.data.list.find((n) => n.type === "workout");
      if (workoutNote) notificationId = workoutNote._id;
      ok("list notifications");
    } else fail("notifications");
  }
  {
    const { res, data } = await request("/reminders", {
      method: "POST",
      body: JSON.stringify({ title: "Smoke reminder", type: "workout", time: "09:00", days: [1], enabled: true }),
    });
    if (res.status === 201) {
      reminderId = data.data._id;
      ok("create reminder");
    } else fail("create reminder");
  }

  // Support
  {
    const { res } = await request("/support", {
      method: "POST",
      body: JSON.stringify({
        subject: "Smoke test",
        category: "feedback",
        message: "This is a smoke test message ok",
      }),
    });
    res.status === 201 ? ok("support post") : fail("support post");
  }
  {
    const { res } = await request("/support");
    res.status === 200 ? ok("support list") : fail("support list");
  }

  // Preferences
  {
    const { res } = await request("/users/me/preferences");
    res.status === 200 ? ok("get preferences") : fail("get preferences");
  }
  {
    const { res } = await request("/users/me/preferences", {
      method: "PUT",
      body: JSON.stringify({
        units: "metric",
        theme: "light",
        notifications: { workout: true, goal: true, reminder: true },
      }),
    });
    res.status === 200 ? ok("put preferences") : fail("put preferences");
  }

  // Export
  {
    const { res, data } = await request("/users/me/export");
    const hasProfile =
      (typeof data === "string" && data.includes("profile")) ||
      (data && typeof data === "object" && data.profile);
    res.status === 200 && hasProfile ? ok("export data") : fail("export data");
  }

  // User B login — isolation
  {
    const { res } = await login(userB.email, userB.password);
    res.status === 200 ? ok("login B for isolation") : fail(`login B ${res.status}`);
  }
  {
    const { res } = await request(`/workouts/${workoutId}`);
    res.status === 404 ? ok("B cannot get A workout") : fail(`B workout access ${res.status}`);
  }
  {
    const { res } = await request(`/nutrition/${mealId}`, {
      method: "PUT",
      body: JSON.stringify({
        date: "2026-01-15",
        mealType: "lunch",
        items: [{ name: "Hack", quantity: "1", calories: 1, proteinG: 0, carbsG: 0, fatG: 0 }],
      }),
    });
    res.status === 404 ? ok("B cannot update A meal") : fail(`B meal access ${res.status}`);
  }
  {
    const { res } = await request(`/progress/${progressId}`, {
      method: "PUT",
      body: JSON.stringify({ date: "2026-01-15", metric: "weight", value: 99 }),
    });
    res.status === 404 ? ok("B cannot update A progress") : fail(`B progress access ${res.status}`);
  }

  // Back to A — update profile, picture, reports
  await login(userA.email, userA.password);
  {
    const { res } = await request("/users/me", {
      method: "PUT",
      body: JSON.stringify({
        age: 26,
        gender: "male",
        heightCm: 176,
        goal: "stay_fit",
        targetWeightKg: 68,
      }),
    });
    res.status === 200 ? ok("update profile") : fail("update profile");
  }

  {
    const fd = new FormData();
    fd.append("profilePicture", new Blob([PNG], { type: "image/png" }), "new.png");
    const { res } = await request("/users/me/picture", { method: "PUT", body: fd });
    res.status === 200 ? ok("update picture") : fail("update picture");
  }

  {
    const { res } = await request("/reports/workouts?from=2026-01-01&to=2026-12-31&format=csv");
    res.status === 200 ? ok("report csv") : fail("report csv");
  }

  if (notificationId) {
    const { res } = await request(`/notifications/${notificationId}/read`, { method: "PATCH" });
    res.status === 200 ? ok("mark notification read") : fail("mark read");
  }

  if (reminderId) {
    const { res } = await request(`/reminders/${reminderId}`, { method: "DELETE" });
    res.status === 200 ? ok("delete reminder") : fail("delete reminder");
  }

  // Delete account A
  {
    cookie = "";
    await login(userA.email, userA.password);
    const { res } = await request("/users/me", {
      method: "DELETE",
      body: JSON.stringify({ password: userA.password }),
    });
    res.status === 200 ? ok("delete account A") : fail("delete account A");
  }

  {
    const { res } = await login(userA.email, userA.password);
    res.status === 404 ? ok("deleted user cannot login") : fail("deleted user login");
  }

  // Cleanup B
  await login(userB.email, userB.password);
  await request("/users/me", { method: "DELETE", body: JSON.stringify({ password: userB.password }) });

  console.log(`\nDone: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
