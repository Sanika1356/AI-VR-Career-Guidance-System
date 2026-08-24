import { requirePool } from "../db/pool.js";
import type { DatabasePool } from "../db/types.js";
import { AppError } from "../utils/app-error.js";
import { createId } from "../utils/id.js";

export type RoadmapStepStatus = "not_started" | "in_progress" | "completed";

export interface RoadmapStepUpdate {
  completed: boolean;
  targetDate?: string | null;
  status?: RoadmapStepStatus;
  notes?: string;
  position?: number;
}

interface RoadmapStepRow {
  id: string;
  career_id: string;
  title: string;
  description: string;
  skill: string;
  display_order: number;
  estimated_effort_minutes: number;
  accessibility_note: string;
  completed: boolean;
  target_date: string | null;
  status: RoadmapStepStatus;
  notes: string;
  position: number | null;
}
interface RoadmapCareerRow {
  id: string;
}
interface RoadmapOwnershipRow {
  id: string;
  career_id: string;
}

export interface RoadmapStepResponse {
  id: string;
  title: string;
  description: string;
  skill: string;
  order: number;
  completed: boolean;
  estimatedEffortMinutes: number;
  accessibilityNote: string;
  targetDate: string | null;
  status: RoadmapStepStatus;
  notes: string;
  position: number;
}
export interface RoadmapResponse {
  careerId: string;
  steps: RoadmapStepResponse[];
}

export async function getRoadmap(
  userId: string,
  careerId: string,
  database: DatabasePool = requirePool(),
): Promise<RoadmapResponse> {
  const client = await database.connect();
  try {
    const careerResult = await client.query<RoadmapCareerRow>(
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
    const roadmapResult = await client.query<RoadmapStepRow>(
      `SELECT rs.id, rs.career_id, rs.title, rs.description, rs.skill, rs.display_order,
              rs.estimated_effort_minutes, rs.accessibility_note,
              COALESCE(rp.completed, FALSE) AS completed,
              rp.target_date,
              COALESCE(rp.status, CASE WHEN rp.completed THEN 'completed' ELSE 'not_started' END) AS status,
              COALESCE(rp.notes, '') AS notes,
              COALESCE(rp.position, rs.display_order) AS position
       FROM roadmap_steps rs
       LEFT JOIN roadmap_progress rp ON rp.step_id = rs.id AND rp.user_id = $1
       WHERE rs.career_id = $2
       ORDER BY COALESCE(rp.position, rs.display_order) ASC, rs.display_order ASC`,
      [userId, careerId],
    );
    return {
      careerId,
      steps: roadmapResult.rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        skill: row.skill,
        order: row.display_order,
        completed: Boolean(row.completed),
        estimatedEffortMinutes: row.estimated_effort_minutes,
        accessibilityNote: row.accessibility_note,
        targetDate: row.target_date
          ? String(row.target_date).slice(0, 10)
          : null,
        status: row.status,
        notes: row.notes,
        position: row.position ?? row.display_order,
      })),
    };
  } finally {
    client.release();
  }
}

export async function updateRoadmapProgress(
  userId: string,
  stepId: string,
  input: RoadmapStepUpdate | boolean,
  database: DatabasePool = requirePool(),
): Promise<{
  stepId: string;
  careerId: string;
  completed: boolean;
  targetDate: string | null;
  status: RoadmapStepStatus;
  notes: string;
  position: number | null;
}> {
  const update: RoadmapStepUpdate =
    typeof input === "boolean" ? { completed: input } : input;
  const requestedStatus = update.status ?? null;
  const defaultStatus = update.completed ? "completed" : "not_started";
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const stepResult = await client.query<RoadmapOwnershipRow>(
      "SELECT id, career_id FROM roadmap_steps WHERE id = $1",
      [stepId],
    );
    const step = stepResult.rows[0];
    if (!step) {
      throw new AppError(
        404,
        "roadmap_step_not_found",
        "The roadmap step does not exist.",
      );
    }
    const progressResult = await client.query<{
      completed: boolean;
      target_date: string | null;
      status: RoadmapStepStatus;
      notes: string;
      position: number | null;
    }>(
      `INSERT INTO roadmap_progress
        (user_id, step_id, completed, target_date, status, notes, position, updated_at)
       VALUES ($1, $2, $3, $4, COALESCE($5, CASE WHEN $3 THEN 'completed' ELSE 'not_started' END), $6, $7, NOW())
       ON CONFLICT (user_id, step_id)
       DO UPDATE SET completed = EXCLUDED.completed,
                     target_date = CASE WHEN $4::date IS NULL THEN roadmap_progress.target_date ELSE EXCLUDED.target_date END,
                     status = CASE
                       WHEN $5::text IS NOT NULL THEN EXCLUDED.status
                       WHEN EXCLUDED.completed THEN 'completed'
                       WHEN roadmap_progress.status = 'completed' THEN 'not_started'
                       ELSE roadmap_progress.status
                     END,
                     notes = CASE WHEN $6::text IS NULL THEN roadmap_progress.notes ELSE EXCLUDED.notes END,
                     position = CASE WHEN $7::integer IS NULL THEN roadmap_progress.position ELSE EXCLUDED.position END,
                     updated_at = NOW()
       RETURNING completed, target_date, status, notes, position`,
      [
        userId,
        stepId,
        update.completed,
        update.targetDate ?? null,
        requestedStatus,
        update.notes ?? null,
        update.position ?? null,
      ],
    );
    const saved = progressResult.rows[0];
    const savedStatus = saved?.status ?? requestedStatus ?? defaultStatus;
    const savedNotes = saved?.notes ?? update.notes ?? "";
    const savedPosition = saved?.position ?? update.position ?? null;
    await client.query(
      `INSERT INTO roadmap_progress_events
        (id, user_id, step_id, completed, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        createId("roadmap_progress_event"),
        userId,
        stepId,
        update.completed,
        savedStatus,
      ],
    );
    await client.query("COMMIT");
    return {
      stepId,
      careerId: step.career_id,
      completed: saved?.completed ?? update.completed,
      targetDate: saved?.target_date
        ? String(saved.target_date).slice(0, 10)
        : null,
      status: savedStatus,
      notes: savedNotes,
      position: savedPosition,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
