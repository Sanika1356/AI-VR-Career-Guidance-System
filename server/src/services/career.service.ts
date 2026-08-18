import { requirePool } from '../db/pool.js';
import type { DatabasePool } from '../db/types.js';
import { AppError } from '../utils/app-error.js';

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
    return Array.isArray(parsed) ? parsed as T[] : [];
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

export async function listCareers(database: DatabasePool = requirePool()): Promise<CareerSummary[]> {
  const client = await database.connect();
  try {
    const result = await client.query<CareerSummaryRow>(`
      SELECT
        c.id,
        c.name,
        c.description,
        c.environment_key,
        COALESCE(
          jsonb_agg(s.name ORDER BY s.name) FILTER (WHERE s.id IS NOT NULL),
          '[]'::jsonb
        ) AS skills
      FROM careers c
      LEFT JOIN career_skills cs ON cs.career_id = c.id
      LEFT JOIN skills s ON s.id = cs.skill_id
      GROUP BY c.id
      ORDER BY c.name
    `);
    return result.rows.map(toSummary);
  } finally {
    client.release();
  }
}

export async function getCareer(careerId: string, database: DatabasePool = requirePool()): Promise<CareerDetail> {
  const client = await database.connect();
  try {
    const result = await client.query<CareerDetailRow>((
      `SELECT
         c.id,
         c.name,
         c.description,
         c.environment_key,
         c.learning_resources,
         COALESCE(
           jsonb_agg(s.name ORDER BY s.name) FILTER (WHERE s.id IS NOT NULL),
           '[]'::jsonb
         ) AS skills,
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
       LEFT JOIN career_skills cs ON cs.career_id = c.id
       LEFT JOIN skills s ON s.id = cs.skill_id
       LEFT JOIN vr_environments ve ON ve.key = c.environment_key
       WHERE c.id = $1
       GROUP BY c.id, ve.key, ve.title, ve.description, ve.available`
    ), [careerId]);
    const row = result.rows[0];
    if (!row) throw new AppError(404, 'career_not_found', 'The requested career was not found.');

    return {
      ...toSummary(row),
      learningResources: jsonArray<LearningResource>(row.learning_resources),
      environment: row.environment_key && row.environment_title && row.environment_description !== null
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
