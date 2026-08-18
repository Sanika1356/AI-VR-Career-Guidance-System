import type { DatabasePool } from '../db/types.js';
import { requirePool } from '../db/pool.js';

export interface VREnvironment {
  key: string;
  careerId: string;
  title: string;
  description: string;
  available: boolean;
}

interface VREnvironmentRow {
  key: string;
  career_id: string;
  title: string;
  description: string;
  available: boolean;
}

export async function listVREnvironments(database: DatabasePool = requirePool()): Promise<{ environments: VREnvironment[] }> {
  const client = await database.connect();
  try {
    const result = await client.query<VREnvironmentRow>(`
      SELECT
        ve.key,
        ve.career_id,
        ve.title,
        ve.description,
        ve.available
      FROM vr_environments ve
      INNER JOIN careers c ON c.id = ve.career_id
      ORDER BY c.name, ve.title, ve.key
    `);

    return {
      environments: result.rows.map((row) => ({
        key: row.key,
        careerId: row.career_id,
        title: row.title,
        description: row.description,
        available: row.available,
      })),
    };
  } finally {
    client.release();
  }
}
