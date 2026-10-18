import ProgressEntryModel from "../models/ProgressEntryModel.js";
import { validateProgressEntry } from "../utils/progressValidation.js";
import { checkWeightGoal } from "../utils/goalCheck.js";

export async function listProgress(req, res) {
  try {
    const filter = { user: req.user.id };
    if (req.query.metric) filter.metric = req.query.metric;

    const entries = await ProgressEntryModel.find(filter).sort({ date: 1 });
    return res.status(200).json({ status: "success", data: entries });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function createProgress(req, res) {
  try {
    const check = validateProgressEntry(req.body);
    if (!check.ok) return res.status(400).json({ status: "error", message: check.message });

    const entry = await ProgressEntryModel.create({ ...check.data, user: req.user.id });
    if (check.data.metric === "weight") {
      await checkWeightGoal(req.user.id, check.data.value);
    }
    return res.status(201).json({ status: "success", data: entry });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: "error",
        message: "You already have an entry for this metric on this date",
      });
    }
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function updateProgress(req, res) {
  try {
    const check = validateProgressEntry(req.body);
    if (!check.ok) return res.status(400).json({ status: "error", message: check.message });

    const entry = await ProgressEntryModel.findOne({ _id: req.params.id, user: req.user.id });
    if (!entry) return res.status(404).json({ status: "error", message: "Entry not found" });

    entry.date = check.data.date;
    entry.metric = check.data.metric;
    entry.value = check.data.value;
    entry.note = check.data.note;
    await entry.save();

    if (check.data.metric === "weight") {
      await checkWeightGoal(req.user.id, check.data.value);
    }

    return res.status(200).json({ status: "success", data: entry });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: "error",
        message: "You already have an entry for this metric on this date",
      });
    }
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function deleteProgress(req, res) {
  try {
    const entry = await ProgressEntryModel.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!entry) return res.status(404).json({ status: "error", message: "Entry not found" });
    return res.status(200).json({ status: "success", message: "Entry deleted" });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}
