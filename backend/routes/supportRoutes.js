import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createFeedback, listMyFeedback } from "../controllers/supportController.js";

const supportRoute = express.Router();
supportRoute.use(authMiddleware);

supportRoute.post("/", createFeedback);
supportRoute.get("/", listMyFeedback);

export default supportRoute;
