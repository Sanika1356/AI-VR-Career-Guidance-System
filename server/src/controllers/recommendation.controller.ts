import type { NextFunction, Response } from "express";
import { getRecommendations } from "../services/recommendation.service.js";
import type { AuthenticatedRequest } from "../types/auth.js";
import { AppError } from "../utils/app-error.js";
import { recordAuditEvent, requestAuditId } from "../services/audit.service.js";

export async function getRecommendationsController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!request.userId)
      throw new AppError(401, "unauthorized", "Authentication is required.");
    const resultId = request.query.resultId;
    if (resultId !== undefined && typeof resultId !== "string") {
      throw new AppError(
        400,
        "validation_error",
        "resultId must be a single string.",
      );
    }
    const result = await getRecommendations(request.userId, resultId);
    await recordAuditEvent({
      eventType: "recommendation_generated",
      userId: request.userId,
      requestId: requestAuditId(response),
      metadata: {
        resultId: result.resultId,
        recommendationCount: result.recommendations.length,
      },
    });
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
