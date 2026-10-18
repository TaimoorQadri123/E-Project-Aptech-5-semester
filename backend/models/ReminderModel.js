import mongoose, { Schema } from "mongoose";

const reminderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ["workout", "meal", "goal"], required: true },
    time: { type: String, required: true },
    days: { type: [Number], default: [] },
    enabled: { type: Boolean, default: true },
    lastFiredDate: { type: String, default: "" },
  },
  { timestamps: true }
);

const ReminderModel = mongoose.model("Reminder", reminderSchema);
export default ReminderModel;
