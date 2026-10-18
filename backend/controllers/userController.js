import bcrypt from "bcrypt";
import UserModel from "../models/UserModel.js";
import WorkoutModel from "../models/WorkoutModel.js";
import MealModel from "../models/MealModel.js";
import ProgressEntryModel from "../models/ProgressEntryModel.js";
import NotificationModel from "../models/NotificationModel.js";
import ReminderModel from "../models/ReminderModel.js";
import FeedbackModel from "../models/FeedbackModel.js";
import { validateProfileUpdate, userToJSON, ageGroupFromAge } from "../utils/userValidation.js";
import { deleteProfileFile } from "../utils/fileHelpers.js";
import { deleteAllUserData } from "../utils/deleteUserData.js";

const PASSWORD_CHECK = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export async function getMeController(req, res) {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }
    return res.status(200).json({ status: "success", data: userToJSON(user) });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message || "Server error" });
  }
}

export async function updateMeController(req, res) {
  try {
    const check = validateProfileUpdate(req.body);
    if (!check.ok) {
      return res.status(400).json({ status: "error", message: check.message });
    }

    const existing = await UserModel.findById(req.user.id);
    if (!existing) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    if (check.data.targetWeightKg !== existing.targetWeightKg) {
      existing.goalWeightNotified = false;
    }

    Object.assign(existing, check.data);
    await existing.save();
    const user = existing;

    return res.status(200).json({
      status: "success",
      message: "Profile updated",
      data: userToJSON(user),
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message || "Server error" });
  }
}

export async function searchUsersController(req, res) {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q.length < 2) {
      return res.status(400).json({ status: "error", message: "Search must be at least 2 characters" });
    }

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const usernameRegex = new RegExp(escaped, "i");
    const emailRegex = new RegExp("^" + escaped, "i");
    const users = await UserModel.find({
      _id: { $ne: req.user.id },
      $or: [{ username: usernameRegex }, { email: emailRegex }],
    })
      .limit(20)
      .select("username age goal");

    const data = users.map((u) => ({
      id: u._id,
      username: u.username,
      name: u.username,
      goal: u.goal,
      ageGroup: ageGroupFromAge(u.age),
    }));

    return res.status(200).json({ status: "success", data });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message || "Server error" });
  }
}

export async function getPreferencesController(req, res) {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ status: "error", message: "User not found" });
    return res.status(200).json({ status: "success", data: user.preferences });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function updatePreferencesController(req, res) {
  try {
    const body = req.body || {};
    const units = body.units;
    const theme = body.theme;
    const notifications = body.notifications || {};

    if (!["metric", "imperial"].includes(units)) {
      return res.status(400).json({ status: "error", message: "units must be metric or imperial" });
    }
    if (!["light", "dark"].includes(theme)) {
      return res.status(400).json({ status: "error", message: "theme must be light or dark" });
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ status: "error", message: "User not found" });

    user.preferences = {
      units,
      theme,
      notifications: {
        workout: notifications.workout !== false,
        goal: notifications.goal !== false,
        reminder: notifications.reminder !== false,
      },
    };
    await user.save();

    return res.status(200).json({ status: "success", data: user.preferences });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function updatePictureController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "Please choose an image (JPG, PNG or WEBP, max 2 MB)" });
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ status: "error", message: "User not found" });

    const newPath = `/uploads/${req.file.filename}`;
    deleteProfileFile(user.profilePicture);
    user.profilePicture = newPath;
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Profile picture updated",
      data: userToJSON(user),
    });
  } catch (error) {
    if (req.file) deleteProfileFile(`/uploads/${req.file.filename}`);
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function exportMeController(req, res) {
  try {
    const userId = req.user.id;
    const user = await UserModel.findById(userId).select("-password");
    if (!user) return res.status(404).json({ status: "error", message: "User not found" });

    const [workouts, meals, progress, notifications, reminders, feedback] = await Promise.all([
      WorkoutModel.find({ user: userId }),
      MealModel.find({ user: userId }),
      ProgressEntryModel.find({ user: userId }),
      NotificationModel.find({ user: userId }),
      ReminderModel.find({ user: userId }),
      FeedbackModel.find({ user: userId }),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      profile: userToJSON(user),
      workouts,
      meals,
      progress,
      notifications,
      reminders,
      feedback,
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", 'attachment; filename="my-fittrack-data.json"');
    return res.send(JSON.stringify(payload, null, 2));
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function deleteMeController(req, res) {
  try {
    const password = req.body.password || "";
    if (!password) {
      return res.status(400).json({ status: "error", message: "Password is required to delete your account" });
    }

    const user = await UserModel.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json({ status: "error", message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ status: "error", message: "Incorrect password" });
    }

    await deleteAllUserData(user._id);

    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({ status: "success", message: "Account deleted" });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function changePasswordController(req, res) {
  try {
    const currentPassword = req.body.currentPassword || "";
    const newPassword = req.body.newPassword || "";

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ status: "error", message: "Current and new password are required" });
    }
    if (!PASSWORD_CHECK.test(newPassword)) {
      return res.status(400).json({
        status: "error",
        message: "New password must be at least 8 characters with one letter and one number",
      });
    }

    const user = await UserModel.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ status: "error", message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ status: "success", message: "Password changed successfully" });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message || "Server error" });
  }
}
