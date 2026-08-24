import { requirePool } from '../db/pool.js';
import type { DatabaseClient, DatabasePool } from '../db/types.js';
import { AppError } from '../utils/app-error.js';

export interface PrivacyConsent {
  analytics: boolean;
  personalizedAi: boolean;
  vrTelemetry: boolean;
  policyVersion: string;
  updatedAt: string | null;
}

export interface AccountExport {
  exportedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  profile: {
    interests: unknown;
    currentSkills: unknown;
    experience: string;
    learningPreferences: unknown;
    createdAt: string;
    updatedAt: string;
  } | null;
  privacy: PrivacyConsent;
  assessments: unknown[];
  assessmentResults: unknown[];
  recommendations: unknown[];
  roadmapProgress: unknown[];
  conversations: unknown[];
}

interface ConsentRow {
  analytics: boolean;
  personalized_ai: boolean;
  vr_telemetry: boolean;
  policy_version: string;
  updated_at: string | Date | null;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string | Date;
  updated_at: string | Date;
}

interface ProfileRow {
  interests: unknown;
  current_skills: unknown;
  experience: string;
  learning_preferences: unknown;
  created_at: string | Date;
  updated_at: string | Date;
}

function iso(value: string | Date | null): string | null {
  return value === null ? null : new Date(value).toISOString();
}

function mapConsent(row?: ConsentRow): PrivacyConsent {
  return {
    analytics: Boolean(row?.analytics ?? false),
    personalizedAi: Boolean(row?.personalized_ai ?? false),
    vrTelemetry: Boolean(row?.vr_telemetry ?? false),
    policyVersion: row?.policy_version ?? 'v1',
    updatedAt: iso(row?.updated_at ?? null),
  };
}

async function withClient<T>(database: DatabasePool, work: (client: DatabaseClient) => Promise<T>): Promise<T> {
  const client = await database.connect();
  try {
    return await work(client);
  } finally {
    client.release();
  }
}

export async function getPrivacyConsent(
  userId: string,
  database: DatabasePool = requirePool(),
): Promise<PrivacyConsent> {
  return withClient(database, async (client) => {
    const result = await client.query<ConsentRow>(
      `SELECT analytics, personalized_ai, vr_telemetry, policy_version, updated_at
       FROM privacy_consents WHERE user_id = $1`,
      [userId],
    );
    return mapConsent(result.rows[0]);
  });
}

export async function updatePrivacyConsent(
  userId: string,
  input: Pick<PrivacyConsent, 'analytics' | 'personalizedAi' | 'vrTelemetry'>,
  database: DatabasePool = requirePool(),
): Promise<PrivacyConsent> {
  return withClient(database, async (client) => {
    const result = await client.query<ConsentRow>(
      `INSERT INTO privacy_consents (user_id, analytics, personalized_ai, vr_telemetry, policy_version, updated_at)
       VALUES ($1, $2, $3, $4, 'v1', NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         analytics = EXCLUDED.analytics,
         personalized_ai = EXCLUDED.personalized_ai,
         vr_telemetry = EXCLUDED.vr_telemetry,
         policy_version = EXCLUDED.policy_version,
         updated_at = NOW()
       RETURNING analytics, personalized_ai, vr_telemetry, policy_version, updated_at`,
      [userId, input.analytics, input.personalizedAi, input.vrTelemetry],
    );
    return mapConsent(result.rows[0]);
  });
}

export async function exportAccountData(
  userId: string,
  database: DatabasePool = requirePool(),
): Promise<AccountExport> {
  return withClient(database, async (client) => {
    const userResult = await client.query<UserRow>(
      `SELECT id, name, email, status, created_at, updated_at FROM users WHERE id = $1`,
      [userId],
    );
    const user = userResult.rows[0];
    if (!user) throw new AppError(404, 'account_not_found', 'The account does not exist.');

    const [profileResult, consentResult, assessments, assessmentResults, recommendations, roadmapProgress, conversations] = await Promise.all([
      client.query<ProfileRow>(
        `SELECT interests, current_skills, experience, learning_preferences, created_at, updated_at
         FROM profiles WHERE user_id = $1`,
        [userId],
      ),
      client.query<ConsentRow>(
        `SELECT analytics, personalized_ai, vr_telemetry, policy_version, updated_at
         FROM privacy_consents WHERE user_id = $1`,
        [userId],
      ),
      client.query(`SELECT id, status, started_at, completed_at FROM assessments WHERE user_id = $1 ORDER BY started_at`, [userId]),
      client.query(`SELECT id, assessment_id, category_scores, top_career_ids, completed_at FROM assessment_results WHERE user_id = $1 ORDER BY completed_at`, [userId]),
      client.query(`SELECT r.id, r.result_id, r.career_id, r.score, r.reason, r.matched_skills, r.missing_skills, r.rank FROM recommendations r JOIN assessment_results ar ON ar.id = r.result_id WHERE ar.user_id = $1 ORDER BY r.rank`, [userId]),
      client.query(`SELECT user_id, step_id, completed, updated_at FROM roadmap_progress WHERE user_id = $1 ORDER BY updated_at`, [userId]),
      client.query(`SELECT id, career_id, created_at FROM conversations WHERE user_id = $1 ORDER BY created_at`, [userId]),
    ]);

    const conversationIds = conversations.rows.map((conversation) => conversation.id as string);
    const messages = conversationIds.length > 0
      ? await client.query(`SELECT id, conversation_id, role, content, created_at FROM messages WHERE conversation_id = ANY($1::text[]) ORDER BY created_at`, [conversationIds])
      : { rows: [] };

    const profile = profileResult.rows[0];
    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        createdAt: new Date(user.created_at).toISOString(),
        updatedAt: new Date(user.updated_at).toISOString(),
      },
      profile: profile ? {
        interests: profile.interests,
        currentSkills: profile.current_skills,
        experience: profile.experience,
        learningPreferences: profile.learning_preferences,
        createdAt: new Date(profile.created_at).toISOString(),
        updatedAt: new Date(profile.updated_at).toISOString(),
      } : null,
      privacy: mapConsent(consentResult.rows[0]),
      assessments: assessments.rows,
      assessmentResults: assessmentResults.rows,
      recommendations: recommendations.rows,
      roadmapProgress: roadmapProgress.rows,
      conversations: conversations.rows.map((conversation) => ({
        ...conversation,
        messages: messages.rows.filter((message) => message.conversation_id === conversation.id),
      })),
    };
  });
}

export async function deleteAccount(
  userId: string,
  database: DatabasePool = requirePool(),
): Promise<{ deleted: true; userId: string }> {
  return withClient(database, async (client) => {
    try {
      await client.query('BEGIN');
      const result = await client.query<{ id: string }>('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
      if (!result.rows[0]) throw new AppError(404, 'account_not_found', 'The account does not exist.');
      await client.query('COMMIT');
      return { deleted: true, userId };
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Preserve the original error if rollback is unavailable.
      }
      throw error;
    }
  });
}
