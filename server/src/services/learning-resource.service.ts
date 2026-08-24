import { requirePool } from "../db/pool.js";
import type { DatabasePool } from "../db/types.js";
import { AppError } from "../utils/app-error.js";

export type LearningResourceCost = "free" | "freemium" | "paid" | "unknown";
export type LearningResourceLevel =
  "beginner" | "intermediate" | "advanced" | "all";
export type LearningResourceFormat =
  "reading" | "video" | "interactive" | "project" | "reference";
export type LearningResourceVerification = "verified" | "unverified";
export type LearningResourceSourceType = "catalog" | "ai-suggestion";

export interface ResourceAccessibility {
  captions?: boolean;
  transcript?: boolean;
  textAlternative?: boolean;
  keyboardFriendly?: boolean;
  screenReaderFriendly?: boolean;
}

export interface LearningResourceRecord {
  id: string;
  careerId: string;
  skillId: string | null;
  skillName: string | null;
  title: string;
  description: string;
  url: string;
  provider: string;
  sourceType: LearningResourceSourceType;
  resourceType: string;
  costModel: LearningResourceCost;
  durationMinutes: number | null;
  level: LearningResourceLevel;
  format: LearningResourceFormat;
  languageCode: string;
  accessibility: ResourceAccessibility;
  freshnessDate: string | null;
  licenseName: string;
  verification: LearningResourceVerification;
  rank: number;
  rankingReason: string;
}

export interface LearningResourceResponse {
  careerId: string;
  targetSkill: string | null;
  languageCode: string;
  resources: LearningResourceRecord[];
}

interface LearningResourceRow {
  id: string;
  career_id: string;
  skill_id: string | null;
  skill_name: string | null;
  title: string;
  description: string;
  url: string;
  provider: string;
  source_type: LearningResourceSourceType;
  resource_type: string;
  cost_model: LearningResourceCost;
  duration_minutes: number | string | null;
  level: LearningResourceLevel;
  format: LearningResourceFormat;
  language_code: string;
  accessibility: ResourceAccessibility | string | null;
  freshness_date: string | Date | null;
  license_name: string;
  verified: boolean;
  display_order: number | string;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function parseAccessibility(
  value: ResourceAccessibility | string | null,
): ResourceAccessibility {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    return parsed as ResourceAccessibility;
  } catch {
    return {};
  }
}

function formatDate(value: string | Date | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function languageScore(languageCode: string, requested: string): number {
  if (languageCode === requested) return 3;
  if (languageCode === requested.split("-")[0]) return 2;
  return languageCode === "en" ? 1 : 0;
}

function rankResource(
  row: LearningResourceRow,
  targetSkill: string | null,
  requestedLanguage: string,
): { score: number; reason: string } {
  const targetMatched =
    targetSkill !== null &&
    row.skill_name !== null &&
    normalize(row.skill_name) === normalize(targetSkill);
  const reasons: string[] = [];
  let score = 0;

  if (targetMatched) {
    score += 100;
    reasons.push("matches the selected skill");
  }
  if (row.verified) {
    score += 20;
    reasons.push("has an authored source verification record");
  }
  if (row.cost_model === "free") {
    score += 10;
    reasons.push("is marked free");
  }
  const languagePoints = languageScore(row.language_code, requestedLanguage);
  score += languagePoints;
  if (languagePoints === 3) reasons.push("matches the requested language");
  else if (languagePoints === 2)
    reasons.push("uses the requested base language");

  return {
    score,
    reason:
      reasons.length > 0
        ? `${reasons.join(", ")}.`
        : "No additional ranking signal was available; catalog order is retained.",
  };
}

export async function listLearningResources(
  careerId: string,
  options: { skill?: string; languageCode?: string; limit?: number } = {},
  database: DatabasePool = requirePool(),
): Promise<LearningResourceResponse> {
  const languageCode = options.languageCode ?? "en";
  const targetSkill = options.skill?.trim() || null;
  const limit = options.limit ?? 20;
  const client = await database.connect();

  try {
    const careerResult = await client.query<{ id: string }>(
      "SELECT id FROM careers WHERE id = $1",
      [careerId],
    );
    if (careerResult.rows.length === 0) {
      throw new AppError(
        404,
        "career_not_found",
        "The selected career does not exist.",
      );
    }

    const result = await client.query<LearningResourceRow>(
      `
      SELECT
        lr.id,
        lr.career_id,
        lr.skill_id,
        s.name AS skill_name,
        lr.title,
        lr.description,
        lr.url,
        lr.provider,
        lr.source_type,
        lr.resource_type,
        lr.cost_model,
        lr.duration_minutes,
        lr.level,
        lr.format,
        lr.language_code,
        lr.accessibility,
        lr.freshness_date,
        lr.license_name,
        lr.verified,
        lr.display_order
      FROM learning_resources lr
      LEFT JOIN skills s ON s.id = lr.skill_id
      WHERE lr.career_id = $1
        AND lr.language_code IN ($2, split_part($2, '-', 1), 'en')
      ORDER BY lr.display_order, lr.id
      `,
      [careerId, languageCode],
    );

    const ranked = result.rows
      .map((row) => ({ row, ...rankResource(row, targetSkill, languageCode) }))
      .sort(
        (left, right) =>
          right.score - left.score ||
          Number(left.row.display_order) - Number(right.row.display_order) ||
          left.row.title.localeCompare(right.row.title),
      )
      .slice(0, limit);

    return {
      careerId,
      targetSkill,
      languageCode,
      resources: ranked.map(({ row, reason }, index) => ({
        id: row.id,
        careerId: row.career_id,
        skillId: row.skill_id,
        skillName: row.skill_name,
        title: row.title,
        description: row.description,
        url: row.url,
        provider: row.provider,
        sourceType: row.source_type,
        resourceType: row.resource_type,
        costModel: row.cost_model,
        durationMinutes:
          row.duration_minutes === null ? null : Number(row.duration_minutes),
        level: row.level,
        format: row.format,
        languageCode: row.language_code,
        accessibility: parseAccessibility(row.accessibility),
        freshnessDate: formatDate(row.freshness_date),
        licenseName: row.license_name,
        verification: row.verified ? "verified" : "unverified",
        rank: index + 1,
        rankingReason: reason,
      })),
    };
  } finally {
    client.release();
  }
}
