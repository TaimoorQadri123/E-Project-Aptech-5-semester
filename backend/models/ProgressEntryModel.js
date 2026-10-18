import mongoose, { Schema } from "mongoose";

const METRICS = [
  "weight",
  "bodyFat",
  "chest",
  "waist",
  "hips",
  "arm",
  "thigh",
  "run5k",
  "benchPress",
  "squat",
  "deadlift",
];

const progressSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true },
    metric: { type: String, enum: METRICS, required: true },
    value: { type: Number, required: true },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

progressSchema.index({ user: 1, metric: 1, date: 1 }, { unique: true });

const ProgressEntryModel = mongoose.model("ProgressEntry", progressSchema);

export { METRICS };
export default ProgressEntryModel;
