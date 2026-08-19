import type { NextFunction, Response } from 'express';
import { getSkillGap } from '../services/skill-gap.service.js';
import type { AuthenticatedRequest } from '../types/auth.js';
import { AppError } from '../utils/app-error.js';

export async function getSkillGapController(
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
    response.status(200).json(await getSkillGap(request.userId, careerId));
  } catch (error) {
    next(error);
  }
}
