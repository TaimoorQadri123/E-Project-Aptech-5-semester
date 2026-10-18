import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createWorkout,
  deleteWorkout,
  getWorkout,
  listWorkouts,
  updateWorkout,
} from "../controllers/workoutController.js";

const workoutRoute = express.Router();
workoutRoute.use(authMiddleware);

workoutRoute.get("/", listWorkouts);
workoutRoute.post("/", createWorkout);
workoutRoute.get("/:id", getWorkout);
workoutRoute.put("/:id", updateWorkout);
workoutRoute.delete("/:id", deleteWorkout);

export default workoutRoute;
