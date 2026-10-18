import ReminderModel from "../models/ReminderModel.js";
import { tryCreateNotification } from "../utils/notifications.js";
import { todayStr } from "../utils/dateHelpers.js";

function validateReminderBody(body) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const type = body.type;
  const time = body.time;
  const days = Array.isArray(body.days) ? body.days.map(Number) : [];
  const enabled = body.enabled !== false;

  if (!title) return { ok: false, message: "Title is required" };
  if (!["workout", "meal", "goal"].includes(type)) {
    return { ok: false, message: "Invalid reminder type" };
  }
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return { ok: false, message: "Time must be HH:MM" };
  }
  const validDays = days.filter((d) => d >= 0 && d <= 6);
  if (validDays.length === 0) return { ok: false, message: "Pick at least one day" };

  return { ok: true, data: { title, type, time, days: validDays, enabled } };
}

export async function listReminders(req, res) {
  try {
    const list = await ReminderModel.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ status: "success", data: list });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function createReminder(req, res) {
  try {
    const check = validateReminderBody(req.body);
    if (!check.ok) return res.status(400).json({ status: "error", message: check.message });

    const reminder = await ReminderModel.create({ ...check.data, user: req.user.id });
    return res.status(201).json({ status: "success", data: reminder });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function updateReminder(req, res) {
  try {
    const check = validateReminderBody(req.body);
    if (!check.ok) return res.status(400).json({ status: "error", message: check.message });

    const reminder = await ReminderModel.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      check.data,
      { new: true, runValidators: true }
    );
    if (!reminder) return res.status(404).json({ status: "error", message: "Reminder not found" });
    return res.status(200).json({ status: "success", data: reminder });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function deleteReminder(req, res) {
  try {
    const reminder = await ReminderModel.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!reminder) return res.status(404).json({ status: "error", message: "Reminder not found" });
    return res.status(200).json({ status: "success", message: "Reminder deleted" });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

// Called when frontend detects a reminder should fire
export async function fireReminder(req, res) {
  try {
    const reminder = await ReminderModel.findOne({ _id: req.params.id, user: req.user.id });
    if (!reminder) return res.status(404).json({ status: "error", message: "Reminder not found" });
    if (!reminder.enabled) {
      return res.status(400).json({ status: "error", message: "Reminder is disabled" });
    }

    const today = todayStr();
    if (reminder.lastFiredDate === today) {
      return res.status(200).json({ status: "success", message: "Already fired today" });
    }

    const message = `Reminder: ${reminder.title}`;
    await tryCreateNotification(req.user.id, "reminder", message);
    reminder.lastFiredDate = today;
    await reminder.save();

    return res.status(200).json({ status: "success", message });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}
