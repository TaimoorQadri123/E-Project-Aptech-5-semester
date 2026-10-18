import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED = [".jpg", ".jpeg", ".png", ".webp"];

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED.includes(ext)) {
    cb(new Error("Only JPG, PNG or WEBP images are allowed"));
    return;
  }
  cb(null, true);
}

export const uploadProfilePicture = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
}).single("profilePicture");

// Turn multer errors into JSON responses
export function handleUploadError(err, req, res, next) {
  if (!err) return next();
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ status: "error", message: "Image must be 2 MB or smaller" });
  }
  return res.status(400).json({ status: "error", message: err.message || "Upload failed" });
}
