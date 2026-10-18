import FeedbackModel from "../models/FeedbackModel.js";

export async function createFeedback(req, res) {
  try {
    const subject = typeof req.body.subject === "string" ? req.body.subject.trim() : "";
    const category = req.body.category;
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";

    if (!subject) return res.status(400).json({ status: "error", message: "Subject is required" });
    if (!["bug", "question", "feedback"].includes(category)) {
      return res.status(400).json({ status: "error", message: "Invalid category" });
    }
    if (!message || message.length < 10) {
      return res.status(400).json({ status: "error", message: "Message must be at least 10 characters" });
    }

    const ticket = await FeedbackModel.create({
      user: req.user.id,
      subject,
      category,
      message,
      status: "open",
    });

    return res.status(201).json({ status: "success", data: ticket });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function listMyFeedback(req, res) {
  try {
    const list = await FeedbackModel.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ status: "success", data: list });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}
