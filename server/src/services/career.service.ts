import { requirePool } from "../db/pool.js";
import type { DatabasePool } from "../db/types.js";
import { AppError } from "../utils/app-error.js";

export interface LearningResource {
  title: string;
  url: string;
  type: string;
  free: boolean;
}

export interface CareerSummary {
  id: string;
  name: string;
  description: string;
  skills: string[];
  environmentKey: string | null;
}

export interface CareerComparison {
  id: string;
  name: string;
  domain: string;
  description: string;
  skills: string[];
  workActivities: string[];
  learningEffort: {
    label: string;
    roadmapStepCount: number;
    resourceCount: number;
  };
  transferableSkills: string[];
  environment: {
    key: string;
    title: string;
    available: boolean;
  } | null;
  uncertainty: string[];
}

interface CareerComparisonRow {
  id: string;
  name: string;
  domain: string;
  description: string;
  environment_key: string | null;
  environment_title: string | null;
  environment_available: boolean | null;
  skills: string[] | string | null;
  work_activities: string[] | string | null;
  learning_effort: string;
  transferable_skills: string[] | string | null;
  uncertainty_notes: string[] | string | null;
  roadmap_step_count: number | string;
  resource_count: number | string;
}

export interface CareerDetail extends CareerSummary {
  learningResources: LearningResource[];
  environment: {
    key: string;
    title: string;
    description: string;
    available: boolean;
  } | null;
  roadmap: Array<{
    id: string;
    title: string;
    description: string;
    skill: string;
    displayOrder: number;
  }>;
}

interface CareerSummaryRow {
  id: string;
  name: string;
  description: string;
  environment_key: string | null;
  skills: string[] | null;
}

interface RoadmapRow {
  id: string;
  title: string;
  description: string;
  skill: string;
  display_order: number;
}

interface CareerDetailRow extends CareerSummaryRow {
  learning_resources: LearningResource[] | string | null;
  environment_title: string | null;
  environment_description: string | null;
  environment_available: boolean | null;
  roadmap: RoadmapRow[] | string | null;
}

function jsonArray<T>(value: T[] | string | null): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function toSummary(row: CareerSummaryRow): CareerSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    skills: row.skills ?? [],
    environmentKey: row.environment_key,
  };
}

export async function listCareers(
  database: DatabasePool = requirePool(),
  languageCode = "en",
): Promise<CareerSummary[]> {
  const client = await database.connect();
  try {
    const result = await client.query<CareerSummaryRow>(
      `
      SELECT
        c.id,
        COALESCE(requested.name, base.name, fallback.name, c.name) AS name,
        COALESCE(requested.description, base.description, fallback.description, c.description) AS description,
        c.environment_key,
        COALESCE((
          SELECT jsonb_agg(COALESCE(skill_requested.name, skill_base.name, skill_fallback.name, s.name) ORDER BY COALESCE(skill_requested.name, skill_base.name, skill_fallback.name, s.name))
          FROM career_skills cs
          JOIN skills s ON s.id = cs.skill_id
          LEFT JOIN skill_labels skill_requested ON skill_requested.skill_id = s.id AND skill_requested.language_code = $1
          LEFT JOIN skill_labels skill_base ON skill_base.skill_id = s.id AND skill_base.language_code = split_part($1, '-', 1)
          LEFT JOIN skill_labels skill_fallback ON skill_fallback.skill_id = s.id AND skill_fallback.language_code = 'en'
          WHERE cs.career_id = c.id
        ), '[]'::jsonb) AS skills
      FROM careers c
      LEFT JOIN career_labels requested ON requested.career_id = c.id AND requested.language_code = $1
      LEFT JOIN career_labels base ON base.career_id = c.id AND base.language_code = split_part($1, '-', 1)
      LEFT JOIN career_labels fallback ON fallback.career_id = c.id AND fallback.language_code = 'en'
      ORDER BY COALESCE(requested.name, base.name, fallback.name, c.name)
    `,
      [languageCode],
    );
    return result.rows.map(toSummary);
  } finally {
    client.release();
  }
}

export async function compareCareers(
  careerIds: string[],
  database: DatabasePool = requirePool(),
  languageCode = "en",
): Promise<{ careers: CareerComparison[] }> {
  const client = await database.connect();
  try {
    const result = await client.query<CareerComparisonRow>(
      `
      SELECT
        c.id,
        COALESCE(requested.name, base.name, fallback.name, c.name) AS name,
        c.domain,
        COALESCE(requested.description, base.description, fallback.description, c.description) AS description,
        c.environment_key,
        ve.title AS environment_title,
        ve.available AS environment_available,
        COALESCE((
          SELECT jsonb_agg(COALESCE(skill_requested.name, skill_base.name, skill_fallback.name, s.name) ORDER BY COALESCE(skill_requested.name, skill_base.name, skill_fallback.name, s.name))
          FROM career_skills cs
          JOIN skills s ON s.id = cs.skill_id
          LEFT JOIN skill_labels skill_requested ON skill_requested.skill_id = s.id AND skill_requested.language_code = $2
          LEFT JOIN skill_labels skill_base ON skill_base.skill_id = s.id AND skill_base.language_code = split_part($2, '-', 1)
          LEFT JOIN skill_labels skill_fallback ON skill_fallback.skill_id = s.id AND skill_fallback.language_code = 'en'
          WHERE cs.career_id = c.id
        ), '[]'::jsonb) AS skills,
        c.work_activities,
        c.learning_effort,
        COALESCE(
          (
            SELECT jsonb_agg(DISTINCT COALESCE(transferable_requested.name, transferable_base.name, transferable_fallback.name, transferable.name) ORDER BY COALESCE(transferable_requested.name, transferable_base.name, transferable_fallback.name, transferable.name))
            FROM career_skills required
            JOIN skills source_skill ON source_skill.id = required.skill_id
            CROSS JOIN LATERAL jsonb_array_elements_text(source_skill.transferable_skills) AS transferable_id(skill_id)
            JOIN skills transferable ON transferable.id = transferable_id.skill_id
            LEFT JOIN skill_labels transferable_requested ON transferable_requested.skill_id = transferable.id AND transferable_requested.language_code = $2
            LEFT JOIN skill_labels transferable_base ON transferable_base.skill_id = transferable.id AND transferable_base.language_code = split_part($2, '-', 1)
            LEFT JOIN skill_labels transferable_fallback ON transferable_fallback.skill_id = transferable.id AND transferable_fallback.language_code = 'en'
            WHERE required.career_id = c.id
          ),
          '[]'::jsonb
        ) AS transferable_skills,
        c.uncertainty_notes,
        (SELECT COUNT(*) FROM roadmap_steps rs WHERE rs.career_id = c.id) AS roadmap_step_count,
        jsonb_array_length(c.learning_resources) AS resource_count
      FROM careers c
      LEFT JOIN career_labels requested ON requested.career_id = c.id AND requested.language_code = $2
      LEFT JOIN career_labels base ON base.career_id = c.id AND base.language_code = split_part($2, '-', 1)
      LEFT JOIN career_labels fallback ON fallback.career_id = c.id AND fallback.language_code = 'en'
      LEFT JOIN vr_environments ve ON ve.key = c.environment_key
      WHERE c.id = ANY($1::text[])
      GROUP BY c.id, requested.name, requested.description, base.name, base.description, fallback.name, fallback.description, ve.key, ve.title, ve.available
    `,
      [careerIds, languageCode],
    );
    const byId = new Map(result.rows.map((row) => [row.id, row]));
    const missingCareerId = careerIds.find((careerId) => !byId.has(careerId));
    if (missingCareerId) {
      throw new AppError(
        404,
        "career_not_found",
        "The requested career was not found.",
      );
    }
    return {
      careers: careerIds.map((careerId) => {
        const row = byId.get(careerId)!;
        return {
          id: row.id,
          name: row.name,
          domain: row.domain,
          description: row.description,
          skills: jsonArray<string>(row.skills),
          workActivities: jsonArray<string>(row.work_activities),
          learningEffort: {
            label: row.learning_effort,
            roadmapStepCount: Number(row.roadmap_step_count),
            resourceCount: Number(row.resource_count),
          },
          transferableSkills: jsonArray<string>(row.transferable_skills),
          environment:
            row.environment_key && row.environment_title
              ? {
                  key: row.environment_key,
                  title: row.environment_title,
                  available: row.environment_available ?? false,
                }
              : null,
          uncertainty: jsonArray<string>(row.uncertainty_notes),
        };
      }),
    };
  } finally {
    client.release();
  }
}

export async function getCareer(
  careerId: string,
  database: DatabasePool = requirePool(),
  languageCode = "en",
): Promise<CareerDetail> {
  const client = await database.connect();
  try {
    const result = await client.query<CareerDetailRow>(
      `SELECT
         c.id,
         COALESCE(requested.name, base.name, fallback.name, c.name) AS name,
         COALESCE(requested.description, base.description, fallback.description, c.description) AS description,
         c.environment_key,
         c.learning_resources,
         COALESCE((
           SELECT jsonb_agg(COALESCE(skill_requested.name, skill_base.name, skill_fallback.name, s.name) ORDER BY COALESCE(skill_requested.name, skill_base.name, skill_fallback.name, s.name))
           FROM career_skills cs
           JOIN skills s ON s.id = cs.skill_id
           LEFT JOIN skill_labels skill_requested ON skill_requested.skill_id = s.id AND skill_requested.language_code = $2
           LEFT JOIN skill_labels skill_base ON skill_base.skill_id = s.id AND skill_base.language_code = split_part($2, '-', 1)
           LEFT JOIN skill_labels skill_fallback ON skill_fallback.skill_id = s.id AND skill_fallback.language_code = 'en'
           WHERE cs.career_id = c.id
         ), '[]'::jsonb) AS skills,
         ve.title AS environment_title,
         ve.description AS environment_description,
         ve.available AS environment_available,
         COALESCE(
           (
             SELECT jsonb_agg(
               jsonb_build_object(
                 'id', rs.id,
                 'title', rs.title,
                 'description', rs.description,
                 'skill', rs.skill,
                 'display_order', rs.display_order
               ) ORDER BY rs.display_order
             )
             FROM roadmap_steps rs
             WHERE rs.career_id = c.id
           ),
           '[]'::jsonb
         ) AS roadmap
       FROM careers c
       LEFT JOIN career_labels requested ON requested.career_id = c.id AND requested.language_code = $2
       LEFT JOIN career_labels base ON base.career_id = c.id AND base.language_code = split_part($2, '-', 1)
       LEFT JOIN career_labels fallback ON fallback.career_id = c.id AND fallback.language_code = 'en'
       LEFT JOIN vr_environments ve ON ve.key = c.environment_key
       WHERE c.id = $1
       GROUP BY c.id, requested.name, requested.description, base.name, base.description, fallback.name, fallback.description, ve.key, ve.title, ve.description, ve.available`,
      [careerId, languageCode],
    );
    const row = result.rows[0];
    if (!row)
      throw new AppError(
        404,
        "career_not_found",
        "The requested career was not found.",
      );

    return {
      ...toSummary(row),
      learningResources: jsonArray<LearningResource>(row.learning_resources),
      environment:
        row.environment_key &&
        row.environment_title &&
        row.environment_description !== null
          ? {
              key: row.environment_key,
              title: row.environment_title,
              description: row.environment_description,
              available: row.environment_available ?? false,
            }
          : null,
      roadmap: jsonArray<RoadmapRow>(row.roadmap).map((step) => ({
        id: step.id,
        title: step.title,
        description: step.description,
        skill: step.skill,
        displayOrder: step.display_order,
      })),
    };
  } finally {
    client.release();
  }
}
