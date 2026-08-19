import { requirePool } from '../db/pool.js';
import type { DatabasePool } from '../db/types.js';
import { AppError } from '../utils/app-error.js';

interface RoadmapStepRow {
  id: string;
  career_id: string;
  title: string;
  description: string;
  skill: string;
  display_order: number;
  completed: boolean;
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
    const careerResult = await client.query<RoadmapCareerRow>('SELECT id FROM careers WHERE id = $1', [careerId]);
    if (careerResult.rows.length === 0) {
      throw new AppError(404, 'career_not_found', 'The selected career does not exist.');
    }

    const roadmapResult = await client.query<RoadmapStepRow>(`
      SELECT rs.id, rs.career_id, rs.title, rs.description, rs.skill, rs.display_order,
             COALESCE(rp.completed, FALSE) AS completed
      FROM roadmap_steps rs
      LEFT JOIN roadmap_progress rp ON rp.step_id = rs.id AND rp.user_id = $1
      WHERE rs.career_id = $2
      ORDER BY rs.display_order ASC
    `, [userId, careerId]);

    return {
      careerId,
      steps: roadmapResult.rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        skill: row.skill,
        order: row.display_order,
        completed: Boolean(row.completed),
      })),
    };
  } finally {
    client.release();
  }
}

export async function updateRoadmapProgress(
  userId: string,
  stepId: string,
  completed: boolean,
  database: DatabasePool = requirePool(),
): Promise<{ stepId: string; careerId: string; completed: boolean }> {
  const client = await database.connect();
  try {
    const stepResult = await client.query<RoadmapOwnershipRow>(
      'SELECT id, career_id FROM roadmap_steps WHERE id = $1',
      [stepId],
    );
    const step = stepResult.rows[0];
    if (!step) throw new AppError(404, 'roadmap_step_not_found', 'The roadmap step does not exist.');

    await client.query(`
      INSERT INTO roadmap_progress (user_id, step_id, completed, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id, step_id)
      DO UPDATE SET completed = EXCLUDED.completed, updated_at = NOW()
    `, [userId, stepId, completed]);

    return { stepId, careerId: step.career_id, completed };
  } finally {
    client.release();
  }
}
