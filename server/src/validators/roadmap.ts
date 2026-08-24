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
    "evidenceLinks",
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
  if (record.evidenceLinks !== undefined) {
    if (
      !Array.isArray(record.evidenceLinks) ||
      record.evidenceLinks.length > 10
    ) {
      throw new AppError(
        400,
        "validation_error",
        "evidenceLinks must contain at most 10 links.",
      );
    }
    for (const link of record.evidenceLinks) {
      if (
        !link ||
        typeof link !== "object" ||
        typeof (link as { label?: unknown }).label !== "string" ||
        typeof (link as { url?: unknown }).url !== "string" ||
        (link as { label: string }).label.trim().length === 0 ||
        (link as { label: string }).label.length > 160 ||
        (link as { url: string }).url.length > 2048
      ) {
        throw new AppError(
          400,
          "validation_error",
          "Each evidence link needs a label and a URL.",
        );
      }
      try {
        const parsedUrl = new URL((link as { url: string }).url);
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
          throw new Error("unsupported protocol");
        }
      } catch {
        throw new AppError(
          400,
          "validation_error",
          "Evidence links must use an absolute HTTP(S) URL.",
        );
      }
    }
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
    evidenceLinks: record.evidenceLinks as RoadmapStepUpdate["evidenceLinks"],
    position: record.position as number | undefined,
  };
}

export function validateReorderRoadmapPayload(payload: unknown): {
  targetPosition: number;
} {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError(
      400,
      "validation_error",
      "Request body must be an object.",
    );
  }
  const record = payload as Record<string, unknown>;
  if (Object.keys(record).some((key) => key !== "targetPosition")) {
    throw new AppError(
      400,
      "validation_error",
      "Request body contains an unsupported field.",
    );
  }
  if (
    typeof record.targetPosition !== "number" ||
    !Number.isInteger(record.targetPosition) ||
    record.targetPosition < 1 ||
    record.targetPosition > 1000
  ) {
    throw new AppError(
      400,
      "validation_error",
      "targetPosition must be a positive integer up to 1000.",
    );
  }
  return { targetPosition: record.targetPosition };
}
