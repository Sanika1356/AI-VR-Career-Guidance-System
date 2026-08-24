import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../types/auth.js";
import { chatAdvisor } from "../services/advisor.service.js";
import { recordAdvisorFeedback } from "../services/advisor-feedback.service.js";
import { clearAdvisorHistory } from "../services/advisor-memory.service.js";
import {
  validateAdvisorChatInput,
  validateAdvisorFeedbackInput,
  validateConversationId,
} from "../validators/advisor.js";
import { AppError } from "../utils/app-error.js";
import { recordAuditEvent, requestAuditId } from "../services/audit.service.js";

function authenticatedUserId(request: AuthenticatedRequest): string {
  const userId = request.userId;
  if (!userId)
    throw new AppError(401, "unauthorized", "Authentication is required.");
  return userId;
}

export async function clearAdvisorHistoryController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = authenticatedUserId(request);
    const conversationId = validateConversationId(
      request.params.conversationId,
    );
    const result = await clearAdvisorHistory(userId, conversationId);
    await recordAuditEvent({
      eventType: "advisor_history_cleared",
      userId,
      requestId: requestAuditId(response),
      metadata: { deletedMessageCount: result.deletedMessageCount },
    });
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function recordAdvisorFeedbackController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = authenticatedUserId(request);
    const input = validateAdvisorFeedbackInput(request.body);
    const result = await recordAdvisorFeedback(userId, input);
    await recordAuditEvent({
      eventType: "advisor_feedback_submitted",
      userId,
      requestId: requestAuditId(response),
      metadata: { helpful: input.helpful, reason: input.reason ?? null },
    });
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function chatAdvisorController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = validateAdvisorChatInput(request.body);
    const userId = authenticatedUserId(request);
    const result = await chatAdvisor(userId, input);
    await recordAuditEvent({
      eventType: "advisor_requested",
      userId,
      requestId: requestAuditId(response),
      metadata: {
        careerSelected: Boolean(input.careerId),
        conversationContinued: Boolean(input.conversationId),
      },
    });
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
