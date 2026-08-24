import type { NextFunction, Response } from "express";
import {
  compareAssessmentResults,
  getAssessmentQuestions,
  getAssessmentResult,
  getNextAssessmentQuestion,
  submitAssessment,
} from "../services/assessment.service.js";
import {
  validateCompareAssessmentResultsQuery,
  validateNextAssessmentQuestionQuery,
  validateSubmitAssessmentInput,
} from "../validators/assessment.js";
import type { AuthenticatedRequest } from "../types/auth.js";
import { AppError } from "../utils/app-error.js";

function authenticatedUserId(request: AuthenticatedRequest): string {
  if (!request.userId)
    throw new AppError(401, "unauthorized", "Authentication is required.");
  return request.userId;
}

export async function getAssessmentQuestionsController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    response
      .status(200)
      .json(await getAssessmentQuestions(authenticatedUserId(request)));
  } catch (error) {
    next(error);
  }
}

export async function getNextAssessmentQuestionController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = validateNextAssessmentQuestionQuery(request.query);
    response
      .status(200)
      .json(
        await getNextAssessmentQuestion(
          authenticatedUserId(request),
          input.assessmentId,
          input.answeredQuestionIds,
        ),
      );
  } catch (error) {
    next(error);
  }
}

export async function compareAssessmentResultsController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const resultId = request.params.resultId;
    if (typeof resultId !== "string" || resultId.length === 0) {
      throw new AppError(400, "validation_error", "resultId is required.");
    }
    const input = validateCompareAssessmentResultsQuery(request.query);
    response
      .status(200)
      .json(
        await compareAssessmentResults(
          authenticatedUserId(request),
          resultId,
          input.previousResultId,
        ),
      );
  } catch (error) {
    next(error);
  }
}

export async function submitAssessmentController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = validateSubmitAssessmentInput(request.body);
    response
      .status(200)
      .json(
        await submitAssessment(
          authenticatedUserId(request),
          input.assessmentId,
          input.answers,
        ),
      );
  } catch (error) {
    next(error);
  }
}

export async function getAssessmentResultController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const resultId = request.params.resultId;
    if (typeof resultId !== "string" || resultId.length === 0) {
      throw new AppError(400, "validation_error", "resultId is required.");
    }
    response
      .status(200)
      .json(await getAssessmentResult(authenticatedUserId(request), resultId));
  } catch (error) {
    next(error);
  }
}
