
import multer from "multer";
import type { Request } from "express";

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  const isCsvExtension = file.originalname.toLowerCase().endsWith(".csv");

  const isCsvMimeType = [
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "text/plain",
  ].includes(file.mimetype);

  if (!isCsvExtension || !isCsvMimeType) {
    return callback(new Error("Only CSV files are allowed"));
  }

  callback(null, true);
};

export const uploadCsv = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
}).single("file");
