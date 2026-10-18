import NotificationModel from "../models/NotificationModel.js";
import UserModel from "../models/UserModel.js";

// Create a notification if the user has that type enabled in preferences
export async function tryCreateNotification(userId, type, message) {
  const user = await UserModel.findById(userId);
  if (!user) return null;

  const prefs = user.preferences?.notifications || {
    workout: true,
    goal: true,
    reminder: true,
  };

  const map = { workout: "workout", goal: "goal", reminder: "reminder" };
  const key = map[type];
  if (key && prefs[key] === false) return null;

  return NotificationModel.create({ user: userId, type, message });
}
