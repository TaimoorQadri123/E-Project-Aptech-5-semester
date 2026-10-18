import ProgressEntryModel from "../models/ProgressEntryModel.js";
import UserModel from "../models/UserModel.js";
import NotificationModel from "../models/NotificationModel.js";
import { tryCreateNotification } from "./notifications.js";

// When user logs weight, check if they reached targetWeightKg (once per user)
export async function checkWeightGoal(userId, newWeight) {
  const user = await UserModel.findById(userId);
  if (!user || user.targetWeightKg == null || user.goalWeightNotified) return;

  const first = await ProgressEntryModel.findOne({ user: userId, metric: "weight" }).sort({ date: 1 });
  if (!first) return;

  const target = user.targetWeightKg;
  const start = first.value;
  let achieved = false;

  if (target < start) achieved = newWeight <= target;
  else if (target > start) achieved = newWeight >= target;
  else achieved = newWeight === target;

  if (!achieved) return;

  const existing = await NotificationModel.findOne({ user: userId, type: "goal" });
  if (existing) {
    user.goalWeightNotified = true;
    await user.save();
    return;
  }

  await tryCreateNotification(
    userId,
    "goal",
    `Goal achieved! You reached your target weight of ${target} kg.`
  );
  user.goalWeightNotified = true;
  await user.save();
}
