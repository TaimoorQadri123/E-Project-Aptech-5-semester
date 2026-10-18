import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createProgress,
  deleteProgress,
  listProgress,
  updateProgress,
} from "../controllers/progressController.js";

const progressRoute = express.Router();
progressRoute.use(authMiddleware);

progressRoute.get("/", listProgress);
progressRoute.post("/", createProgress);
progressRoute.put("/:id", updateProgress);
progressRoute.delete("/:id", deleteProgress);

export default progressRoute;
