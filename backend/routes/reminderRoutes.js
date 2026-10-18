import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createReminder,
  deleteReminder,
  fireReminder,
  listReminders,
  updateReminder,
} from "../controllers/reminderController.js";

const reminderRoute = express.Router();
reminderRoute.use(authMiddleware);

reminderRoute.get("/", listReminders);
reminderRoute.post("/", createReminder);
reminderRoute.put("/:id", updateReminder);
reminderRoute.delete("/:id", deleteReminder);
reminderRoute.post("/:id/fire", fireReminder);

export default reminderRoute;
