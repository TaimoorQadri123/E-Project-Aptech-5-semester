import mongoose, { Schema } from "mongoose";

const feedbackSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, required: true, trim: true },
    category: { type: String, enum: ["bug", "question", "feedback"], required: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

const FeedbackModel = mongoose.model("Feedback", feedbackSchema);
export default FeedbackModel;
