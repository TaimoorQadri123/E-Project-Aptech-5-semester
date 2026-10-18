import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getDashboard } from "../controllers/dashboardController.js";

const dashboardRoute = express.Router();
dashboardRoute.use(authMiddleware);
dashboardRoute.get("/", getDashboard);

export default dashboardRoute;
