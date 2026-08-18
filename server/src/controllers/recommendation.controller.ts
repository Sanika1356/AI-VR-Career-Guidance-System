import type { NextFunction, Response } from 'express';
import { getRecommendations } from '../services/recommendation.service.js';
import type { AuthenticatedRequest } from '../types/auth.js';
import { AppError } from '../utils/app-error.js';

export async function getRecommendationsController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!request.userId) throw new AppError(401, 'unauthorized', 'Authentication is required.');
    const resultId = request.query.resultId;
    if (resultId !== undefined && typeof resultId !== 'string') {
      throw new AppError(400, 'validation_error', 'resultId must be a single string.');
    }
    response.status(200).json(await getRecommendations(request.userId, resultId));
  } catch (error) {
    next(error);
  }
}
