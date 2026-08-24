import { requirePool } from '../db/pool.js';
import type { DatabasePool } from '../db/types.js';
import { AppError } from '../utils/app-error.js';
import type { ProfileUpdateInput } from '../validators/auth.js';

interface ProfileRow {
  user_id: string;
  name: string;
  email: string;
  interests: string[];
  current_skills: string[];
  experience: string;
  learning_preferences: Record<string, unknown>;
  goals: string[];
  constraints: string[];
  preferred_work_conditions: string[];
  education_stage: string | null;
  location_preference: string | null;
  weekly_time_budget_minutes: number | null;
}

export interface ProfileResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  profile: {
    interests: string[];
    currentSkills: string[];
    experience: string;
    learningPreferences: Record<string, unknown>;
    goals: string[];
    constraints: string[];
    preferredWorkConditions: string[];
    educationStage: string | null;
    locationPreference: string | null;
    weeklyTimeBudgetMinutes: number | null;
  };
}

function toProfileResponse(row: ProfileRow): ProfileResponse {
  return {
    user: { id: row.user_id, name: row.name, email: row.email },
    profile: {
      interests: row.interests ?? [],
      currentSkills: row.current_skills ?? [],
      experience: row.experience ?? '',
      learningPreferences: row.learning_preferences ?? {},
      goals: row.goals ?? [],
      constraints: row.constraints ?? [],
      preferredWorkConditions: row.preferred_work_conditions ?? [],
      educationStage: row.education_stage,
      locationPreference: row.location_preference,
      weeklyTimeBudgetMinutes: row.weekly_time_budget_minutes,
    },
  };
}

const profileQuery = `
  SELECT
    u.id AS user_id,
    u.name,
    u.email,
    p.interests,
    p.current_skills,
    p.experience,
    p.learning_preferences,
    p.goals,
    p.constraints,
    p.preferred_work_conditions,
    p.education_stage,
    p.location_preference,
    p.weekly_time_budget_minutes
  FROM users u
  JOIN profiles p ON p.user_id = u.id
  WHERE u.id = $1 AND u.status = 'active'
`;

export async function getProfile(userId: string, database: DatabasePool = requirePool()): Promise<ProfileResponse> {
  const client = await database.connect();
  try {
    const result = await client.query<ProfileRow>(profileQuery, [userId]);
    const row = result.rows[0];
    if (!row) throw new AppError(404, 'profile_not_found', 'The requested profile was not found.');
    return toProfileResponse(row);
  } finally {
    client.release();
  }
}

export async function updateProfile(
  userId: string,
  input: ProfileUpdateInput,
  database: DatabasePool = requirePool(),
): Promise<ProfileResponse> {
  const client = await database.connect();
  try {
    await client.query('BEGIN');
    if (input.name !== undefined) {
      await client.query('UPDATE users SET name = $2, updated_at = NOW() WHERE id = $1 AND status = \'active\'', [userId, input.name]);
    }

    await client.query(
      `UPDATE profiles
       SET interests = COALESCE($2::jsonb, interests),
           current_skills = COALESCE($3::jsonb, current_skills),
           experience = COALESCE($4, experience),
           learning_preferences = COALESCE($5::jsonb, learning_preferences),
           goals = COALESCE($6::jsonb, goals),
           constraints = COALESCE($7::jsonb, constraints),
           preferred_work_conditions = COALESCE($8::jsonb, preferred_work_conditions),
           education_stage = CASE WHEN $9::boolean THEN $10 ELSE education_stage END,
           location_preference = CASE WHEN $11::boolean THEN $12 ELSE location_preference END,
           weekly_time_budget_minutes = CASE WHEN $13::boolean THEN $14 ELSE weekly_time_budget_minutes END,
           updated_at = NOW()
       WHERE user_id = $1`,
      [
        userId,
        input.interests === undefined ? null : JSON.stringify(input.interests),
        input.currentSkills === undefined ? null : JSON.stringify(input.currentSkills),
        input.experience === undefined ? null : input.experience,
        input.learningPreferences === undefined ? null : JSON.stringify(input.learningPreferences),
        input.goals === undefined ? null : JSON.stringify(input.goals),
        input.constraints === undefined ? null : JSON.stringify(input.constraints),
        input.preferredWorkConditions === undefined ? null : JSON.stringify(input.preferredWorkConditions),
        input.educationStage !== undefined,
        input.educationStage ?? null,
        input.locationPreference !== undefined,
        input.locationPreference ?? null,
        input.weeklyTimeBudgetMinutes !== undefined,
        input.weeklyTimeBudgetMinutes ?? null,
      ],
    );

    const result = await client.query<ProfileRow>(profileQuery, [userId]);
    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      throw new AppError(404, 'profile_not_found', 'The requested profile was not found.');
    }
    await client.query('COMMIT');
    return toProfileResponse(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
