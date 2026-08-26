import type { Response } from "express";
import {
  analyzeResume,
  getResumeAnalysis,
  listResumeAnalyses,
} from "../services/resume-analyzer.service.js";
import type { AuthenticatedRequest } from "../types/auth.js";
import { requirePool } from "../db/pool.js";

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

  const result = await analyzeResume(
    {
      userId: request.userId as string,
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
    },
    requirePool(),
  );

  response.status(200).json(result);
}

export async function listResumeAnalysesController(
  request: AuthenticatedRequest,
  response: Response,
): Promise<void> {
  const analyses = await listResumeAnalyses(
    request.userId as string,
    requirePool(),
  );
  response.status(200).json({ analyses });
}

export async function getResumeAnalysisController(
  request: AuthenticatedRequest,
  response: Response,
): Promise<void> {
  const rawAnalysisId = request.params.analysisId;
  const analysisId =
    typeof rawAnalysisId === "string"
      ? rawAnalysisId
      : (rawAnalysisId?.[0] ?? "");
  const result = await getResumeAnalysis(
    request.userId as string,
    analysisId,
    requirePool(),
  );
  response.status(200).json(result);
}
