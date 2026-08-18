import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types/auth.js';
import { chatAdvisor } from '../services/advisor.service.js';
import { validateAdvisorChatInput } from '../validators/advisor.js';
import { AppError } from '../utils/app-error.js';

function authenticatedUserId(request: AuthenticatedRequest): string {
  const userId = request.userId;
  if (!userId) throw new AppError(401, 'unauthorized', 'Authentication is required.');
  return userId;
}

export async function chatAdvisorController(request: AuthenticatedRequest, response: Response, next: NextFunction): Promise<void> {
  try {
    const input = validateAdvisorChatInput(request.body);
    const result = await chatAdvisor(authenticatedUserId(request), input);
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
