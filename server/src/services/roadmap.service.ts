import { requirePool } from "../db/pool.js";
import type { DatabasePool } from "../db/types.js";
import { AppError } from "../utils/app-error.js";
import { createId } from "../utils/id.js";

export type RoadmapStepStatus = "not_started" | "in_progress" | "completed";

export interface RoadmapEvidenceLink {
  label: string;
  url: string;
}

function parseEvidenceLinks(
  value: RoadmapEvidenceLink[] | string | null,
): RoadmapEvidenceLink[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is RoadmapEvidenceLink =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof item.label === "string" &&
        typeof item.url === "string",
    );
  }
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is RoadmapEvidenceLink =>
            Boolean(item) &&
            typeof item === "object" &&
            typeof (item as RoadmapEvidenceLink).label === "string" &&
            typeof (item as RoadmapEvidenceLink).url === "string",
        )
      : [];
  } catch {
    return [];
  }
}

export interface RoadmapStepUpdate {
  completed: boolean;
  targetDate?: string | null;
  status?: RoadmapStepStatus;
  notes?: string;
  evidenceLinks?: RoadmapEvidenceLink[];
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
  evidence_links: RoadmapEvidenceLink[] | string | null;
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
  evidenceLinks: RoadmapEvidenceLink[];
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
              COALESCE(rp.evidence_links, '[]'::jsonb) AS evidence_links,
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
        evidenceLinks: parseEvidenceLinks(row.evidence_links),
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
  evidenceLinks: RoadmapEvidenceLink[];
  position: number | null;
}> {
  const update: RoadmapStepUpdate =
    typeof input === "boolean" ? { completed: input } : input;
  const requestedStatus = update.status ?? null;
  // Keep the two fields consistent even when an older client submits a stale
  // completion flag alongside a changed status.
  const completed = update.status
    ? update.status === "completed"
    : update.completed;
  const defaultStatus = completed ? "completed" : "not_started";
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
      evidence_links: RoadmapEvidenceLink[] | string | null;
      position: number | null;
    }>(
      `INSERT INTO roadmap_progress
        (user_id, step_id, completed, target_date, status, notes, evidence_links, position, updated_at)
       VALUES ($1, $2, $3, $4, COALESCE($5, CASE WHEN $3 THEN 'completed' ELSE 'not_started' END), COALESCE($6, ''), COALESCE($7, '[]'::jsonb), $8, NOW())
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
                     evidence_links = CASE WHEN $7::jsonb IS NULL THEN roadmap_progress.evidence_links ELSE EXCLUDED.evidence_links END,
                     position = CASE WHEN $8::integer IS NULL THEN roadmap_progress.position ELSE EXCLUDED.position END,
                     updated_at = NOW()
       RETURNING completed, target_date, status, notes, evidence_links, position`,
      [
        userId,
        stepId,
        completed,
        update.targetDate ?? null,
        requestedStatus,
        update.notes ?? null,
        update.evidenceLinks ? JSON.stringify(update.evidenceLinks) : null,
        update.position ?? null,
      ],
    );
    const saved = progressResult.rows[0];
    const savedStatus = saved?.status ?? requestedStatus ?? defaultStatus;
    const savedNotes = saved?.notes ?? update.notes ?? "";
    const savedEvidenceLinks = parseEvidenceLinks(
      saved?.evidence_links ?? update.evidenceLinks ?? [],
    );
    const savedPosition = saved?.position ?? update.position ?? null;
    await client.query(
      `INSERT INTO roadmap_progress_events
        (id, user_id, step_id, completed, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        createId("roadmap_progress_event"),
        userId,
        stepId,
        completed,
        savedStatus,
      ],
    );
    await client.query("COMMIT");
    return {
      stepId,
      careerId: step.career_id,
      completed: saved?.completed ?? completed,
      targetDate: saved?.target_date
        ? String(saved.target_date).slice(0, 10)
        : null,
      status: savedStatus,
      notes: savedNotes,
      evidenceLinks: savedEvidenceLinks,
      position: savedPosition,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

interface RoadmapReorderRow {
  id: string;
  career_id: string;
  display_order: number;
  completed: boolean;
  target_date: string | null;
  status: RoadmapStepStatus;
  notes: string;
  evidence_links: RoadmapEvidenceLink[] | string | null;
  position: number;
}

export interface RoadmapReorderResponse {
  careerId: string;
  positions: Array<{ stepId: string; position: number }>;
}

export async function reorderRoadmapStep(
  userId: string,
  stepId: string,
  targetPosition: number,
  database: DatabasePool = requirePool(),
): Promise<RoadmapReorderResponse> {
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const stepResult = await client.query<RoadmapReorderRow>(
      `SELECT rs.id, rs.career_id, rs.display_order,
              COALESCE(rp.completed, FALSE) AS completed,
              rp.target_date,
              COALESCE(rp.status, CASE WHEN rp.completed THEN 'completed' ELSE 'not_started' END) AS status,
              COALESCE(rp.notes, '') AS notes,
              COALESCE(rp.evidence_links, '[]'::jsonb) AS evidence_links,
              COALESCE(rp.position, rs.display_order) AS position
       FROM roadmap_steps rs
       LEFT JOIN roadmap_progress rp ON rp.step_id = rs.id AND rp.user_id = $1
       WHERE rs.career_id = (SELECT career_id FROM roadmap_steps WHERE id = $2)
       ORDER BY COALESCE(rp.position, rs.display_order), rs.display_order, rs.id`,
      [userId, stepId],
    );
    const rows = stepResult.rows;
    const selectedIndex = rows.findIndex((row) => row.id === stepId);
    if (selectedIndex < 0) {
      throw new AppError(
        404,
        "roadmap_step_not_found",
        "The roadmap step does not exist.",
      );
    }
    if (
      !Number.isInteger(targetPosition) ||
      targetPosition < 1 ||
      targetPosition > rows.length
    ) {
      throw new AppError(
        400,
        "validation_error",
        `targetPosition must be between 1 and ${rows.length}.`,
      );
    }

    const reordered = [...rows];
    const [selected] = reordered.splice(selectedIndex, 1);
    reordered.splice(targetPosition - 1, 0, selected);
    for (const [index, row] of reordered.entries()) {
      await client.query(
        `INSERT INTO roadmap_progress
          (user_id, step_id, completed, target_date, status, notes, evidence_links, position, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, NOW())
         ON CONFLICT (user_id, step_id)
         DO UPDATE SET position = EXCLUDED.position, updated_at = NOW()`,
        [
          userId,
          row.id,
          row.completed,
          row.target_date,
          row.status,
          row.notes,
          JSON.stringify(parseEvidenceLinks(row.evidence_links)),
          index + 1,
        ],
      );
    }
    await client.query("COMMIT");
    return {
      careerId: rows[0]?.career_id ?? "",
      positions: reordered.map((row, index) => ({
        stepId: row.id,
        position: index + 1,
      })),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
