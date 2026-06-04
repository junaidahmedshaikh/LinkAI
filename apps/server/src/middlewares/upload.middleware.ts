import multer from "multer";
import { Request } from "express";
import { ALLOWED_RESUME_TYPES, MAX_RESUME_SIZE_BYTES } from "@linkai/shared";
import { env } from "../config/env";

const memoryStorage = multer.memoryStorage();

const resumeFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_RESUME_TYPES.includes(file.mimetype as (typeof ALLOWED_RESUME_TYPES)[number])) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF, DOC, and DOCX are allowed."));
  }
};

const avatarFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images are allowed."));
  }
};

const maxSize = env.MAX_FILE_SIZE_MB * 1024 * 1024;

export const uploadResume = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_RESUME_SIZE_BYTES },
  fileFilter: resumeFilter,
}).single("resume");

export const uploadAvatar = multer({
  storage: memoryStorage,
  limits: { fileSize: maxSize },
  fileFilter: avatarFilter,
}).single("avatar");
