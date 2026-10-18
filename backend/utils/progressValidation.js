const RANGES = {
  weight: [20, 300],
  bodyFat: [2, 60],
  chest: [50, 200],
  waist: [40, 200],
  hips: [50, 200],
  arm: [15, 80],
  thigh: [30, 100],
  run5k: [10, 120],
  benchPress: [0, 500],
  squat: [0, 500],
  deadlift: [0, 500],
};

export function validateProgressEntry(body) {
  const date = body.date;
  const metric = body.metric;
  const value = Number(body.value);
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, message: "Date must be YYYY-MM-DD" };
  }
  if (!RANGES[metric]) {
    return { ok: false, message: "Invalid metric" };
  }
  const [min, max] = RANGES[metric];
  if (!Number.isFinite(value) || value < min || value > max) {
    return { ok: false, message: `Value for ${metric} must be between ${min} and ${max}` };
  }

  return { ok: true, data: { date, metric, value, note } };
}
