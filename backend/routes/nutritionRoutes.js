import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createMeal,
  deleteMeal,
  listMealsByDate,
  updateMeal,
} from "../controllers/nutritionController.js";

const nutritionRoute = express.Router();
nutritionRoute.use(authMiddleware);

nutritionRoute.get("/", listMealsByDate);
nutritionRoute.post("/", createMeal);
nutritionRoute.put("/:id", updateMeal);
nutritionRoute.delete("/:id", deleteMeal);

export default nutritionRoute;
