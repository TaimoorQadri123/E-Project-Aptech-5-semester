import fs from "fs";
import path from "path";
import { uploadsDir } from "../middleware/uploadMiddleware.js";

export function deleteProfileFile(storedPath) {
  if (!storedPath || !storedPath.startsWith("/uploads/")) return;
  const filename = path.basename(storedPath);
  const full = path.join(uploadsDir, filename);
  if (fs.existsSync(full)) {
    fs.unlinkSync(full);
  }
}
