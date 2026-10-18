const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

const GOALS = ["lose_weight", "gain_muscle", "stay_fit", "improve_endurance"];
const GENDERS = ["male", "female", "other"];

export function validateUsername(username) {
  const value = typeof username === "string" ? username.toLowerCase().trim() : "";
  if (!USERNAME_RE.test(value)) {
    return {
      ok: false,
      message: "Name must be 3-20 characters: letters, numbers, and underscore only",
    };
  }
  return { ok: true, value };
}

export function validateSignupBody(body) {
  const errors = [];
  // Single "name" field on signup is the username
  const rawName = body.username ?? body.name;
  const usernameCheck = validateUsername(rawName);
  const username = usernameCheck.ok ? usernameCheck.value : "";
  const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
  const password = body.password || "";
  const confirmPassword = body.confirmPassword || "";
  const privacyConsent =
    body.privacyConsent === true ||
    body.privacyConsent === "true" ||
    body.privacyConsent === "on";

  if (!usernameCheck.ok) errors.push(usernameCheck.message);
  if (!email || !EMAIL_RE.test(email)) errors.push("Valid email is required");
  if (!privacyConsent) errors.push("You must agree to the privacy policy");
  if (!PASSWORD_RE.test(password)) {
    errors.push("Password must be at least 8 characters with one letter and one number");
  }
  if (password !== confirmPassword) {
    errors.push("Password and confirm password do not match");
  }

  if (errors.length) return { ok: false, message: errors.join(". ") };

  return {
    ok: true,
    data: { username, email, password },
  };
}

export function validateProfileUpdate(body) {
  const errors = [];
  const age = Number(body.age);
  const gender = body.gender;
  const heightCm = Number(body.heightCm);
  const goal = body.goal;
  let targetWeightKg = body.targetWeightKg;

  if (!Number.isFinite(age) || age < 10 || age > 120) errors.push("Age must be between 10 and 120");
  if (!GENDERS.includes(gender)) errors.push("Gender must be male, female, or other");
  if (!Number.isFinite(heightCm) || heightCm < 50 || heightCm > 260) {
    errors.push("Height must be between 50 and 260 cm");
  }
  if (!GOALS.includes(goal)) errors.push("Please select a valid fitness goal");

  if (targetWeightKg === "" || targetWeightKg == null) {
    targetWeightKg = null;
  } else {
    targetWeightKg = Number(targetWeightKg);
    if (!Number.isFinite(targetWeightKg) || targetWeightKg < 20 || targetWeightKg > 300) {
      errors.push("Target weight must be between 20 and 300 kg");
    }
  }

  if (errors.length) return { ok: false, message: errors.join(". ") };

  return { ok: true, data: { age, gender, heightCm, goal, targetWeightKg } };
}

export function ageGroupFromAge(age) {
  if (age < 18) return "Under 18";
  if (age <= 25) return "18-25";
  if (age <= 35) return "26-35";
  if (age <= 45) return "36-45";
  if (age <= 55) return "46-55";
  return "56+";
}

export function userToJSON(user) {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;
  // Display name is the username everywhere in the app
  obj.name = obj.username;
  return obj;
}
