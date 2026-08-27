import type { Response } from "express";
import {
  analyzeResume,
  getResumeAnalysis,
  deleteResumeAnalysis,
  normalizePreferredOutputs,
  persistPuterResumeAnalysis,
  listResumeAnalyses,
} from "../services/resume-analyzer.service.js";
import type { AuthenticatedRequest } from "../types/auth.js";
import { requirePool } from "../db/pool.js";
import { recordAuditEvent, requestAuditId } from "../services/audit.service.js";

function parsePreferredOutputs(value: unknown) {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return normalizePreferredOutputs(value);
  if (typeof value === "string") {
    try {
      return normalizePreferredOutputs(JSON.parse(value));
    } catch {
      return normalizePreferredOutputs(
        value.split(",").map((item) => item.trim()),
      );
    }
  }
  return normalizePreferredOutputs(value);
}

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
      preferredOutputs: parsePreferredOutputs(request.body.preferredOutputs),
      file: {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
        size: file.size,
      },
    },
    requirePool(),
  );

  await recordAuditEvent({
    eventType: "resume_analyzed",
    userId: request.userId as string,
    requestId: requestAuditId(response),
    metadata: {
      analysisId: result.analysisId,
      provider: result.analysis.provider,
      score: result.analysis.overallScore,
      outputCount: result.analysis.preferredOutputs.length,
    },
  });
  response.status(200).json(result);
}

export async function persistPuterResumeAnalysisController(
  request: AuthenticatedRequest,
  response: Response,
): Promise<void> {
  const result = await persistPuterResumeAnalysis(
    {
      userId: request.userId as string,
      companyName:
        typeof request.body.companyName === "string"
          ? request.body.companyName
          : "",
      jobRole:
        typeof request.body.jobRole === "string" ? request.body.jobRole : "",
      preferredOutputs: parsePreferredOutputs(request.body.preferredOutputs),
      fileName:
        typeof request.body.fileName === "string" ? request.body.fileName : "",
      analysis: request.body.analysis,
    },
    requirePool(),
  );
  await recordAuditEvent({
    eventType: "resume_analyzed",
    userId: request.userId as string,
    requestId: requestAuditId(response),
    metadata: {
      analysisId: result.analysisId,
      provider: result.analysis.provider,
      score: result.analysis.overallScore,
      outputCount: result.analysis.preferredOutputs.length,
    },
  });
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

export async function deleteResumeAnalysisController(
  request: AuthenticatedRequest,
  response: Response,
): Promise<void> {
  const rawAnalysisId = request.params.analysisId;
  const analysisId =
    typeof rawAnalysisId === "string"
      ? rawAnalysisId
      : (rawAnalysisId?.[0] ?? "");
  const result = await deleteResumeAnalysis(
    request.userId as string,
    analysisId,
    requirePool(),
  );
  response.status(200).json(result);
}
