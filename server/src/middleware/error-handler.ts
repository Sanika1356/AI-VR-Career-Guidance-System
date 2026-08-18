import type { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/app-error.js';

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: error.code,
      message: error.message,
    });
    return;
  }

  console.error(`[${request.method} ${request.path}]`, error);
  response.status(500).json({
    error: 'internal_server_error',
    message: 'An unexpected server error occurred.',
  });
};
