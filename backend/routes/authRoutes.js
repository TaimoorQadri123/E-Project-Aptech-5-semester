import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { uploadProfilePicture, handleUploadError } from "../middleware/uploadMiddleware.js";
import {
  loginController,
  logoutController,
  meController,
  signupController,
} from "../controllers/authController.js";

const authRoute = express.Router();

authRoute.post(
  "/signup",
  (req, res, next) => {
    uploadProfilePicture(req, res, (err) => {
      if (err) return handleUploadError(err, req, res, next);
      next();
    });
  },
  signupController
);
authRoute.post("/login", loginController);
authRoute.post("/logout", logoutController);
authRoute.get("/me", authMiddleware, meController);

export default authRoute;
