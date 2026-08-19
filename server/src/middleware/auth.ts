import type { NextFunction, Response } from 'express';
import { verifyAccessToken } from '../utils/token.js';
import type { AuthenticatedRequest } from '../types/auth.js';

export function requireAuth(request: AuthenticatedRequest, response: Response, next: NextFunction): void {
  const header = request.header('authorization');
  const [scheme, token] = header?.split(' ') ?? [];

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    response.status(401).json({
      error: 'unauthorized',
      message: 'A valid bearer token is required.',
    });
    return;
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    response.status(401).json({
      error: 'unauthorized',
      message: 'The bearer token is invalid or expired.',
    });
    return;
  }

  request.userId = payload.sub;
  next();
}
