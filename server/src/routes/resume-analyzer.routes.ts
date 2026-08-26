import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import multer from "multer";
import { env } from "../config/env.js";
import { analyzeResumeController } from "../controllers/resume-analyzer.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { createRateLimiter } from "../middleware/rate-limit.js";
import { resumeAnalyzerLimits } from "../services/resume-analyzer.service.js";

export const resumeAnalyzerRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: resumeAnalyzerLimits.maxFileBytes, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (
      file.mimetype !== "application/pdf" ||
      !/\.pdf$/i.test(file.originalname)
    ) {
      callback(new Error("A PDF resume is required."));
      return;
    }
    callback(null, true);
  },
});

function uploadResumeFile(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  upload.single("resume")(request, response, (error: unknown) => {
    if (!error) {
      next();
      return;
    }
    if (
      error instanceof multer.MulterError &&
      error.code === "LIMIT_FILE_SIZE"
    ) {
      response.status(413).json({
        error: "resume_file_too_large",
        message: "Your PDF must be 8 MB or smaller.",
      });
      return;
    }
    response.status(415).json({
      error: "resume_pdf_required",
      message: "Upload your resume as a PDF file.",
    });
  });
}

const resumeRateLimiter = createRateLimiter({
  name: "resume-analyzer",
  windowMs: env.aiRateLimitWindowMs,
  maxRequests: Math.min(env.aiRateLimitMax, 10),
});

resumeAnalyzerRouter.post(
  "/analyze",
  requireAuth,
  resumeRateLimiter,
  uploadResumeFile,
  analyzeResumeController,
);
