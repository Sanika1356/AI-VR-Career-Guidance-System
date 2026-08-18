import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  console.error(`[${request.method} ${request.path}]`, error);
  response.status(500).json({
    error: 'internal_server_error',
    message: 'An unexpected server error occurred.',
  });
};
