import type { NextFunction, Response } from 'express';
import { getRoadmap, updateRoadmapProgress } from '../services/roadmap.service.js';
import type { AuthenticatedRequest } from '../types/auth.js';
import { validateUpdateRoadmapProgressPayload } from '../validators/roadmap.js';
import { AppError } from '../utils/app-error.js';

export async function getRoadmapController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!request.userId) throw new AppError(401, 'unauthorized', 'Authentication is required.');
    const careerId = request.params.careerId;
    if (typeof careerId !== 'string' || careerId.length === 0) {
      throw new AppError(400, 'validation_error', 'careerId is required.');
    }
    response.status(200).json(await getRoadmap(request.userId, careerId));
  } catch (error) {
    next(error);
  }
}

export async function updateRoadmapProgressController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!request.userId) throw new AppError(401, 'unauthorized', 'Authentication is required.');
    const stepId = request.params.stepId;
    if (typeof stepId !== 'string' || stepId.length === 0) {
      throw new AppError(400, 'validation_error', 'stepId is required.');
    }
    const { completed } = validateUpdateRoadmapProgressPayload(request.body);
    response.status(200).json(await updateRoadmapProgress(request.userId, stepId, completed));
  } catch (error) {
    next(error);
  }
}
