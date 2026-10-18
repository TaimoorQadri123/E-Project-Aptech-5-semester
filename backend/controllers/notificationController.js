import NotificationModel from "../models/NotificationModel.js";

export async function listNotifications(req, res) {
  try {
    const list = await NotificationModel.find({ user: req.user.id }).sort({ createdAt: -1 });
    const unreadCount = list.filter((n) => !n.read).length;
    return res.status(200).json({ status: "success", data: { list, unreadCount } });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function markRead(req, res) {
  try {
    const note = await NotificationModel.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );
    if (!note) return res.status(404).json({ status: "error", message: "Notification not found" });
    return res.status(200).json({ status: "success", data: note });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function markAllRead(req, res) {
  try {
    await NotificationModel.updateMany({ user: req.user.id, read: false }, { read: true });
    return res.status(200).json({ status: "success", message: "All marked as read" });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function deleteNotification(req, res) {
  try {
    const note = await NotificationModel.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!note) return res.status(404).json({ status: "error", message: "Notification not found" });
    return res.status(200).json({ status: "success", message: "Deleted" });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}
