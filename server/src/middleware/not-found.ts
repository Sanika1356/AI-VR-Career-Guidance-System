import type { Request, Response } from 'express';

export function notFound(request: Request, response: Response): void {
  response.status(404).json({
    error: 'not_found',
    message: `Route ${request.method} ${request.path} was not found`,
  });
}
