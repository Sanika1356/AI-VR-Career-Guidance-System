import { requirePool } from '../db/pool.js';
import type { DatabasePool } from '../db/types.js';
import { AppError } from '../utils/app-error.js';

interface RequiredSkillRow {
  career_id: string;
  skill_name: string;
  required_level: 'beginner' | 'intermediate' | 'advanced';
}

interface ProfileRow {
  current_skills: string[] | string | null;
}

export interface SkillGapItem {
  name: string;
  status: 'matched' | 'missing';
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface SkillGapResponse {
  careerId: string;
  skills: SkillGapItem[];
}

function parseStringArray(value: string[] | string | null): string[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function normalizeSkill(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

export async function getSkillGap(
  userId: string,
  careerId: string,
  database: DatabasePool = requirePool(),
): Promise<SkillGapResponse> {
  const client = await database.connect();
  try {
    const [careerResult, profileResult] = await Promise.all([
      client.query<RequiredSkillRow>(`
        SELECT c.id AS career_id, s.name AS skill_name, cs.required_level
        FROM careers c
        JOIN career_skills cs ON cs.career_id = c.id
        JOIN skills s ON s.id = cs.skill_id
        WHERE c.id = $1
        ORDER BY s.name
      `, [careerId]),
      client.query<ProfileRow>('SELECT current_skills FROM profiles WHERE user_id = $1', [userId]),
    ]);

    if (careerResult.rows.length === 0) {
      throw new AppError(404, 'career_not_found', 'The selected career does not exist.');
    }

    const currentSkills = new Set(
      parseStringArray(profileResult.rows[0]?.current_skills ?? []).map(normalizeSkill),
    );
    const skills = careerResult.rows.map((row) => ({
      name: row.skill_name,
      status: currentSkills.has(normalizeSkill(row.skill_name)) ? 'matched' as const : 'missing' as const,
      level: row.required_level,
    }));

    return { careerId, skills };
  } finally {
    client.release();
  }
}
