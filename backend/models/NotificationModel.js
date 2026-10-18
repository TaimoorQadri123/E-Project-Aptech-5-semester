import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["workout", "goal", "reminder"], required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const NotificationModel = mongoose.model("Notification", notificationSchema);
export default NotificationModel;
