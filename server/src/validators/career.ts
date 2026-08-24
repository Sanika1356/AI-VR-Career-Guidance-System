import { AppError } from "../utils/app-error.js";

export interface CompareCareersInput {
  careerIds: string[];
}

function requiredId(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.trim().length > 120
  ) {
    throw new AppError(
      400,
      "validation_error",
      "Each careerId must be a non-empty string.",
    );
  }
  return value.trim();
}

export function validateCompareCareersQuery(
  query: unknown,
): CompareCareersInput {
  if (typeof query !== "object" || query === null || Array.isArray(query)) {
    throw new AppError(
      400,
      "validation_error",
      "Query parameters must be an object.",
    );
  }
  const rawCareerIds = (query as Record<string, unknown>).careerIds;
  if (typeof rawCareerIds !== "string") {
    throw new AppError(
      400,
      "validation_error",
      "careerIds must be a comma-separated string.",
    );
  }
  const careerIds = rawCareerIds.split(",").map(requiredId);
  if (careerIds.length < 2 || careerIds.length > 5) {
    throw new AppError(
      400,
      "validation_error",
      "careerIds must contain between 2 and 5 items.",
    );
  }
  if (new Set(careerIds).size !== careerIds.length) {
    throw new AppError(
      400,
      "validation_error",
      "careerIds must not contain duplicates.",
    );
  }
  return { careerIds };
}
