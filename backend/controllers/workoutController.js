import WorkoutModel from "../models/WorkoutModel.js";
import { tryCreateNotification } from "../utils/notifications.js";

const CATEGORIES = ["strength", "cardio", "hiit", "flexibility", "yoga", "sports", "other"];

function validateWorkoutBody(body, isCreate) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const category = body.category;
  const date = body.date;
  if (!title) return { ok: false, message: "Title is required" };
  if (!CATEGORIES.includes(category)) return { ok: false, message: "Invalid category" };
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, message: "Date must be YYYY-MM-DD" };
  }
  const exercises = Array.isArray(body.exercises) ? body.exercises : [];
  if (isCreate && exercises.length === 0) {
    return { ok: false, message: "Add at least one exercise" };
  }
  return {
    ok: true,
    data: {
      title,
      category,
      date,
      durationMin: Number(body.durationMin) || 0,
      caloriesBurned: body.caloriesBurned != null ? Number(body.caloriesBurned) : undefined,
      intensity: ["low", "medium", "high"].includes(body.intensity) ? body.intensity : "medium",
      exercises: exercises.map((ex) => ({
        name: String(ex.name || "").trim(),
        sets: Number(ex.sets) || 0,
        reps: Number(ex.reps) || 0,
        weightKg: Number(ex.weightKg) || 0,
        notes: String(ex.notes || ""),
      })).filter((ex) => ex.name),
      tags: Array.isArray(body.tags) ? body.tags.map((t) => String(t).trim()).filter(Boolean) : [],
      notes: typeof body.notes === "string" ? body.notes.trim() : "",
    },
  };
}

export async function listWorkouts(req, res) {
  try {
    const filter = { user: req.user.id };
    const { q, category, tag, from, to, sort } = req.query;

    if (category && category !== "all") filter.category = category;
    if (tag) filter.tags = tag;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    if (q) {
      const regex = new RegExp(q.trim(), "i");
      filter.$or = [
        { title: regex },
        { notes: regex },
        { tags: regex },
        { "exercises.name": regex },
      ];
    }

    const sortVal = sort === "date" ? { date: 1 } : { date: -1 };
    const workouts = await WorkoutModel.find(filter).sort(sortVal);

    return res.status(200).json({ status: "success", data: workouts });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function createWorkout(req, res) {
  try {
    const check = validateWorkoutBody(req.body, true);
    if (!check.ok) return res.status(400).json({ status: "error", message: check.message });

    const workout = await WorkoutModel.create({ ...check.data, user: req.user.id });
    await tryCreateNotification(
      req.user.id,
      "workout",
      `Workout logged: ${workout.title} on ${workout.date}`
    );
    return res.status(201).json({ status: "success", data: workout });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function getWorkout(req, res) {
  try {
    const workout = await WorkoutModel.findOne({ _id: req.params.id, user: req.user.id });
    if (!workout) return res.status(404).json({ status: "error", message: "Workout not found" });
    return res.status(200).json({ status: "success", data: workout });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function updateWorkout(req, res) {
  try {
    const check = validateWorkoutBody(req.body, false);
    if (!check.ok) return res.status(400).json({ status: "error", message: check.message });

    const workout = await WorkoutModel.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      check.data,
      { new: true, runValidators: true }
    );
    if (!workout) return res.status(404).json({ status: "error", message: "Workout not found" });
    return res.status(200).json({ status: "success", data: workout });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function deleteWorkout(req, res) {
  try {
    const workout = await WorkoutModel.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!workout) return res.status(404).json({ status: "error", message: "Workout not found" });
    return res.status(200).json({ status: "success", message: "Workout deleted" });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}
