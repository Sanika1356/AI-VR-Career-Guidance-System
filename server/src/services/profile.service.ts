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
    p.learning_preferences
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
           updated_at = NOW()
       WHERE user_id = $1`,
      [
        userId,
        input.interests === undefined ? null : JSON.stringify(input.interests),
        input.currentSkills === undefined ? null : JSON.stringify(input.currentSkills),
        input.experience === undefined ? null : input.experience,
        input.learningPreferences === undefined ? null : JSON.stringify(input.learningPreferences),
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
