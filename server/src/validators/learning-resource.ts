import { AppError } from "../utils/app-error.js";
import { validateCatalogLanguageQuery } from "./career.js";

export interface LearningResourceQuery {
  skill?: string;
  languageCode: string;
  limit: number;
}

export function validateLearningResourceQuery(
  query: Record<string, unknown>,
): LearningResourceQuery {
  const { languageCode } = validateCatalogLanguageQuery(query);
  const skillValue = query.skill;
  if (skillValue !== undefined && typeof skillValue !== "string") {
    throw new AppError(400, "validation_error", "skill must be a string.");
  }
  const skill = typeof skillValue === "string" ? skillValue.trim() : undefined;
  if (skill !== undefined && (skill.length === 0 || skill.length > 120)) {
    throw new AppError(
      400,
      "validation_error",
      "skill must contain between 1 and 120 characters.",
    );
  }

  const limitValue = query.limit;
  if (limitValue !== undefined && typeof limitValue !== "string") {
    throw new AppError(400, "validation_error", "limit must be a number.");
  }
  const limit = limitValue === undefined ? 20 : Number(limitValue);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new AppError(
      400,
      "validation_error",
      "limit must be an integer between 1 and 50.",
    );
  }

  return { ...(skill ? { skill } : {}), languageCode, limit };
}
