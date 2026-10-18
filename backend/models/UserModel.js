import mongoose, { Schema } from "mongoose";

const preferencesSchema = new Schema(
  {
    units: { type: String, enum: ["metric", "imperial"], default: "metric" },
    theme: { type: String, enum: ["light", "dark"], default: "light" },
    notifications: {
      workout: { type: Boolean, default: true },
      goal: { type: Boolean, default: true },
      reminder: { type: Boolean, default: true },
    },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    profilePicture: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    age: { type: Number, default: 18 },
    gender: { type: String, enum: ["male", "female", "other"], default: "other" },
    heightCm: { type: Number, default: 170 },
    goal: {
      type: String,
      enum: ["lose_weight", "gain_muscle", "stay_fit", "improve_endurance"],
      default: "stay_fit",
    },
    targetWeightKg: { type: Number, default: null },
    goalWeightNotified: { type: Boolean, default: false },
    preferences: {
      type: preferencesSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", userSchema);

export default UserModel;
