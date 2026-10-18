import UserModel from "../models/UserModel.js";
import WorkoutModel from "../models/WorkoutModel.js";
import MealModel from "../models/MealModel.js";
import ProgressEntryModel from "../models/ProgressEntryModel.js";
import NotificationModel from "../models/NotificationModel.js";
import ReminderModel from "../models/ReminderModel.js";
import FeedbackModel from "../models/FeedbackModel.js";
import { deleteProfileFile } from "./fileHelpers.js";

export async function deleteAllUserData(userId) {
  const user = await UserModel.findById(userId);
  if (!user) return false;

  deleteProfileFile(user.profilePicture);

  await Promise.all([
    WorkoutModel.deleteMany({ user: userId }),
    MealModel.deleteMany({ user: userId }),
    ProgressEntryModel.deleteMany({ user: userId }),
    NotificationModel.deleteMany({ user: userId }),
    ReminderModel.deleteMany({ user: userId }),
    FeedbackModel.deleteMany({ user: userId }),
  ]);

  await UserModel.findByIdAndDelete(userId);
  return true;
}
