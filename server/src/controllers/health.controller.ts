import type { NextFunction, Request, Response } from 'express';
import { getDependencyHealth } from '../services/health.service.js';

export function getHealth(_request: Request, response: Response): void {
  response.status(200).json({
    status: 'ok',
    service: 'career-guidance-api',
  });
}

export async function getDependencyHealthController(_request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const health = await getDependencyHealth();
    response.status(health.status === 'ok' ? 200 : 503).json(health);
  } catch (error) {
    next(error);
  }
}
