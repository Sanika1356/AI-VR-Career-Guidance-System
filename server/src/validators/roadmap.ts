import { AppError } from "../utils/app-error.js";
import type {
  RoadmapStepStatus,
  RoadmapStepUpdate,
} from "../services/roadmap.service.js";

const statuses = new Set<RoadmapStepStatus>([
  "not_started",
  "in_progress",
  "completed",
]);

export function validateUpdateRoadmapProgressPayload(
  payload: unknown,
): RoadmapStepUpdate {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError(
      400,
      "validation_error",
      "Request body must be an object.",
    );
  }
  const record = payload as Record<string, unknown>;
  const allowed = new Set([
    "completed",
    "targetDate",
    "status",
    "notes",
    "position",
  ]);
  if (Object.keys(record).some((key) => !allowed.has(key))) {
    throw new AppError(
      400,
      "validation_error",
      "Request body contains an unsupported field.",
    );
  }
  if (typeof record.completed !== "boolean") {
    throw new AppError(400, "validation_error", "completed must be a boolean.");
  }
  if (
    record.targetDate !== undefined &&
    record.targetDate !== null &&
    (typeof record.targetDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(record.targetDate) ||
      Number.isNaN(Date.parse(`${record.targetDate}T00:00:00Z`)))
  ) {
    throw new AppError(
      400,
      "validation_error",
      "targetDate must be an ISO calendar date or null.",
    );
  }
  if (
    record.status !== undefined &&
    (typeof record.status !== "string" ||
      !statuses.has(record.status as RoadmapStepStatus))
  ) {
    throw new AppError(400, "validation_error", "status is not supported.");
  }
  if (
    record.notes !== undefined &&
    (typeof record.notes !== "string" || record.notes.length > 2000)
  ) {
    throw new AppError(
      400,
      "validation_error",
      "notes must be 2000 characters or fewer.",
    );
  }
  if (
    record.position !== undefined &&
    (typeof record.position !== "number" ||
      !Number.isInteger(record.position) ||
      record.position < 1 ||
      record.position > 1000)
  ) {
    throw new AppError(
      400,
      "validation_error",
      "position must be a positive integer up to 1000.",
    );
  }
  return {
    completed: record.completed,
    targetDate: record.targetDate as string | null | undefined,
    status: record.status as RoadmapStepStatus | undefined,
    notes: record.notes as string | undefined,
    position: record.position as number | undefined,
  };
}
