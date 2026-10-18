import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import connectDb from "./config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import authRoute from "./routes/authRoutes.js";
import userRoute from "./routes/userRoutes.js";
import workoutRoute from "./routes/workoutRoutes.js";
import nutritionRoute from "./routes/nutritionRoutes.js";
import progressRoute from "./routes/progressRoutes.js";
import dashboardRoute from "./routes/dashboardRoutes.js";
import analyticsRoute from "./routes/analyticsRoutes.js";
import notificationRoute from "./routes/notificationRoutes.js";
import reminderRoute from "./routes/reminderRoutes.js";
import reportsRoute from "./routes/reportsRoutes.js";
import supportRoute from "./routes/supportRoutes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/workouts", workoutRoute);
app.use("/api/nutrition", nutritionRoute);
app.use("/api/progress", progressRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/analytics", analyticsRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/reminders", reminderRoute);
app.use("/api/reports", reportsRoute);
app.use("/api/support", supportRoute);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDb();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
