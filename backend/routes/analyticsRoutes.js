import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getExerciseNames,
  getNutritionAnalytics,
  getWorkoutAnalytics,
} from "../controllers/analyticsController.js";

const analyticsRoute = express.Router();
analyticsRoute.use(authMiddleware);

analyticsRoute.get("/workouts", getWorkoutAnalytics);
analyticsRoute.get("/exercises", getExerciseNames);
analyticsRoute.get("/nutrition", getNutritionAnalytics);

export default analyticsRoute;
