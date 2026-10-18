import mongoose, { Schema } from "mongoose";

const exerciseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sets: { type: Number, default: 0 },
    reps: { type: Number, default: 0 },
    weightKg: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const workoutSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["strength", "cardio", "hiit", "flexibility", "yoga", "sports", "other"],
      required: true,
    },
    date: { type: String, required: true },
    durationMin: { type: Number, default: 0 },
    caloriesBurned: { type: Number },
    intensity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    exercises: { type: [exerciseSchema], default: [] },
    tags: { type: [String], default: [] },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const WorkoutModel = mongoose.model("Workout", workoutSchema);

export default WorkoutModel;
