import type { NextFunction, Request, Response } from 'express';
import { getCareer, listCareers } from '../services/career.service.js';
import { AppError } from '../utils/app-error.js';

export async function listCareersController(_request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    response.status(200).json(await listCareers());
  } catch (error) {
    next(error);
  }
}

export async function getCareerController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const careerId = request.params.careerId;
    if (typeof careerId !== 'string' || careerId.length === 0) {
      throw new AppError(400, 'validation_error', 'careerId is required.');
    }
    response.status(200).json(await getCareer(careerId));
  } catch (error) {
    next(error);
  }
}
