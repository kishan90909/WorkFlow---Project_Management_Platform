import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { ApiError } from "../utils/ApiError.js";
import { uploadsDirectory } from "../config/uploadPaths.js";

fs.mkdirSync(uploadsDirectory, { recursive: true });
const allowed = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDirectory),
  filename: (_req, file, cb) =>
    cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    allowed.has(file.mimetype)
      ? cb(null, true)
      : cb(
          new ApiError(
            400,
            "Unsupported file type. Upload PDF, image, text, ZIP, DOCX, or XLSX files.",
          ),
        ),
});
