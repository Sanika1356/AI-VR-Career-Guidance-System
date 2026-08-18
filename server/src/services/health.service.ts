import { pool } from '../db/pool.js';
import type { DatabasePool } from '../db/types.js';

export interface DependencyHealth {
  status: 'ok' | 'degraded';
  service: 'career-guidance-api';
  database: 'ok' | 'unavailable';
}

export async function getDependencyHealth(database: DatabasePool | null = pool): Promise<DependencyHealth> {
  if (!database) {
    return {
      status: 'degraded',
      service: 'career-guidance-api',
      database: 'unavailable',
    };
  }

  const client = await database.connect();
  try {
    await client.query('SELECT 1');
    return {
      status: 'ok',
      service: 'career-guidance-api',
      database: 'ok',
    };
  } catch {
    return {
      status: 'degraded',
      service: 'career-guidance-api',
      database: 'unavailable',
    };
  } finally {
    client.release();
  }
}
