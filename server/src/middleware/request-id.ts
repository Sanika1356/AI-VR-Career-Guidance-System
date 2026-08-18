import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

export function requestId(request: Request, response: Response, next: NextFunction): void {
  const id = request.header('x-request-id') ?? randomUUID();
  response.setHeader('x-request-id', id);
  next();
}
