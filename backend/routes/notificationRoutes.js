import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  deleteNotification,
  listNotifications,
  markAllRead,
  markRead,
} from "../controllers/notificationController.js";

const notificationRoute = express.Router();
notificationRoute.use(authMiddleware);

notificationRoute.get("/", listNotifications);
notificationRoute.patch("/read-all", markAllRead);
notificationRoute.patch("/:id/read", markRead);
notificationRoute.delete("/:id", deleteNotification);

export default notificationRoute;
