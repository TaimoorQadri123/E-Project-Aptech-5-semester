import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { uploadProfilePicture, handleUploadError } from "../middleware/uploadMiddleware.js";
import {
  changePasswordController,
  getMeController,
  updateMeController,
  searchUsersController,
  getPreferencesController,
  updatePreferencesController,
  updatePictureController,
  exportMeController,
  deleteMeController,
} from "../controllers/userController.js";

const userRoute = express.Router();

userRoute.use(authMiddleware);

userRoute.get("/search", searchUsersController);
userRoute.get("/me/export", exportMeController);
userRoute.delete("/me", deleteMeController);
userRoute.get("/me/preferences", getPreferencesController);
userRoute.put("/me/preferences", updatePreferencesController);
userRoute.put(
  "/me/picture",
  (req, res, next) => {
    uploadProfilePicture(req, res, (err) => {
      if (err) return handleUploadError(err, req, res, next);
      next();
    });
  },
  updatePictureController
);
userRoute.get("/me", getMeController);
userRoute.put("/me", updateMeController);
userRoute.put("/me/password", changePasswordController);

export default userRoute;
