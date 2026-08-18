import type { NextFunction, Request, Response } from 'express';
import { listVREnvironments } from '../services/vr.service.js';

export async function listVREnvironmentsController(_request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    response.status(200).json(await listVREnvironments());
  } catch (error) {
    next(error);
  }
}
