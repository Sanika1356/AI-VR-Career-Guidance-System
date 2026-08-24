import type { ErrorRequestHandler } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: error.code,
      message: error.message,
    });
    return;
  }

  if (typeof error === 'object' && error !== null && 'type' in error) {
    const parserError = error as { type?: unknown };
    if (parserError.type === 'entity.too.large') {
      response.status(413).json({
        error: 'payload_too_large',
        message: 'Request body is too large.',
      });
      return;
    }
    if (parserError.type === 'entity.parse.failed') {
      response.status(400).json({
        error: 'invalid_json',
        message: 'Request body must contain valid JSON.',
      });
      return;
    }
  }

  const unknownError = error instanceof Error ? error : new Error('Unknown non-Error failure');
  console.error(JSON.stringify({
    event: 'http_error',
    requestId: response.getHeader('x-request-id') ?? null,
    method: request.method,
    path: request.path,
    statusCode: 500,
    errorName: unknownError.name,
    message: unknownError.message,
    ...(env.nodeEnv !== 'production' && unknownError.stack ? { stack: unknownError.stack } : {}),
  }));
  response.status(500).json({
    error: 'internal_server_error',
    message: 'An unexpected server error occurred.',
  });
};
