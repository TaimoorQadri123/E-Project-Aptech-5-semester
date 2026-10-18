import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getReport } from "../controllers/reportsController.js";

const reportsRoute = express.Router();
reportsRoute.use(authMiddleware);
reportsRoute.get("/:type", getReport);

export default reportsRoute;
