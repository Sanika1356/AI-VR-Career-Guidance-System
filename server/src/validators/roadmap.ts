import { AppError } from '../utils/app-error.js';

export interface UpdateRoadmapProgressInput {
  completed: boolean;
}

export function validateUpdateRoadmapProgressPayload(payload: unknown): UpdateRoadmapProgressInput {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new AppError(400, 'validation_error', 'Request body must be an object.');
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.completed !== 'boolean' || Object.keys(record).some((key) => key !== 'completed')) {
    throw new AppError(400, 'validation_error', 'Request body must contain only a boolean completed field.');
  }

  return { completed: record.completed };
}
