import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/auth.js";
import { analyzeResume } from "../services/resume-analyzer.service.js";

export async function analyzeResumeController(
  request: AuthenticatedRequest,
  response: Response,
): Promise<void> {
  const file = request.file;
  if (!file) {
    response.status(400).json({
      error: "resume_file_required",
      message: "Upload a PDF resume before starting the analysis.",
    });
    return;
  }

  const analysis = await analyzeResume({
    companyName:
      typeof request.body.companyName === "string"
        ? request.body.companyName
        : "",
    jobRole:
      typeof request.body.jobRole === "string" ? request.body.jobRole : "",
    jobDescription:
      typeof request.body.jobDescription === "string"
        ? request.body.jobDescription
        : "",
    file: {
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalname: file.originalname,
      size: file.size,
    },
  });

  response.status(200).json({
    analysis,
    analyzedAt: new Date().toISOString(),
  });
}
