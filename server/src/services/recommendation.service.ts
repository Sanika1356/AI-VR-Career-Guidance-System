import { requirePool } from '../db/pool.js';
import type { DatabasePool } from '../db/types.js';
import { AppError } from '../utils/app-error.js';

interface AssessmentResultRow {
  id: string;
  category_scores: Record<string, number> | string;
}

interface CareerSkillRow {
  career_id: string;
  career_name: string;
  career_description: string;
  skill_name: string | null;
}

interface ProfileRow {
  current_skills: string[] | string | null;
}

export interface Recommendation {
  careerId: string;
  career: string;
  score: number;
  reason: string;
  matchedSkills: string[];
  missingSkills: string[];
}

function parseObject(value: Record<string, number> | string): Record<string, number> {
  if (typeof value !== 'string') return value;
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? parsed as Record<string, number>
      : {};
  } catch {
    return {};
  }
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

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

function groupCareerRows(rows: CareerSkillRow[]): Array<{
  id: string;
  name: string;
  description: string;
  requiredSkills: string[];
}> {
  const careers = new Map<string, { id: string; name: string; description: string; requiredSkills: string[] }>();
  for (const row of rows) {
    const career = careers.get(row.career_id) ?? {
      id: row.career_id,
      name: row.career_name,
      description: row.career_description,
      requiredSkills: [],
    };
    if (row.skill_name) career.requiredSkills.push(row.skill_name);
    careers.set(row.career_id, career);
  }
  return [...careers.values()];
}

function recommendationReason(rawScore: number, matched: string[], missing: string[]): string {
  if (rawScore <= 0) {
    return missing.length > 0
      ? `This career is a developing match; focus on ${missing.slice(0, 2).join(' and ')}.`
      : 'This career matches your current skill profile.';
  }
  if (missing.length === 0) return `Strong assessment match with all ${matched.length} required skills represented.`;
  if (matched.length === 0) return `Assessment match with an opportunity to build ${missing.slice(0, 2).join(' and ')}.`;
  return `Assessment match with ${matched.length} matched skill${matched.length === 1 ? '' : 's'} and a path to build ${missing.slice(0, 2).join(' and ')}.`;
}

export async function getRecommendations(
  userId: string,
  resultId?: string,
  database: DatabasePool = requirePool(),
): Promise<{ resultId: string; recommendations: Recommendation[] }> {
  const client = await database.connect();
  try {
    await client.query('BEGIN');
    const result = resultId
      ? await client.query<AssessmentResultRow>(
          'SELECT id, category_scores FROM assessment_results WHERE id = $1 AND user_id = $2',
          [resultId, userId],
        )
      : await client.query<AssessmentResultRow>(
          `SELECT id, category_scores
           FROM assessment_results
           WHERE user_id = $1
           ORDER BY completed_at DESC
           LIMIT 1`,
          [userId],
        );
    const assessment = result.rows[0];
    if (!assessment) throw new AppError(404, 'assessment_result_not_found', 'Complete an assessment before requesting recommendations.');

    const [careerResult, profileResult] = await Promise.all([
      client.query<CareerSkillRow>(`
        SELECT c.id AS career_id, c.name AS career_name, c.description AS career_description, s.name AS skill_name
        FROM careers c
        LEFT JOIN career_skills cs ON cs.career_id = c.id
        LEFT JOIN skills s ON s.id = cs.skill_id
        ORDER BY c.name, s.name
      `),
      client.query<ProfileRow>('SELECT current_skills FROM profiles WHERE user_id = $1', [userId]),
    ]);

    const categoryScores = parseObject(assessment.category_scores);
    const currentSkills = parseStringArray(profileResult.rows[0]?.current_skills ?? []);
    const currentSkillSet = new Set(currentSkills.map(normalizeSkill));
    const careers = groupCareerRows(careerResult.rows);
    const maxRawScore = Math.max(0, ...careers.map((career) => Number(categoryScores[career.id] ?? 0)));

    const recommendations = careers
      .map((career) => {
        const matchedSkills = career.requiredSkills.filter((skill) => currentSkillSet.has(normalizeSkill(skill)));
        const missingSkills = career.requiredSkills.filter((skill) => !currentSkillSet.has(normalizeSkill(skill)));
        const rawScore = Math.max(0, Number(categoryScores[career.id] ?? 0));
        const score = maxRawScore > 0 ? roundScore((rawScore / maxRawScore) * 100) : 0;
        return {
          careerId: career.id,
          career: career.name,
          score,
          reason: recommendationReason(rawScore, matchedSkills, missingSkills),
          matchedSkills,
          missingSkills,
          rawScore,
        };
      })
      .sort((left, right) => right.score - left.score || right.matchedSkills.length - left.matchedSkills.length || left.career.localeCompare(right.career))
      .map(({ rawScore: _rawScore, ...recommendation }) => recommendation);

    await client.query('DELETE FROM recommendations WHERE result_id = $1', [assessment.id]);
    for (const [index, recommendation] of recommendations.entries()) {
      await client.query(
        `INSERT INTO recommendations
          (id, result_id, career_id, score, reason, matched_skills, missing_skills, rank)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8)`,
        [
          `recommendation_${assessment.id}_${index + 1}`,
          assessment.id,
          recommendation.careerId,
          recommendation.score,
          recommendation.reason,
          JSON.stringify(recommendation.matchedSkills),
          JSON.stringify(recommendation.missingSkills),
          index + 1,
        ],
      );
    }
    await client.query('COMMIT');
    return { resultId: assessment.id, recommendations };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
