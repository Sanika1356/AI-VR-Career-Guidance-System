import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

export const pool = env.databaseUrl
  ? new Pool({
      connectionString: env.databaseUrl,
      min: env.dbPoolMin,
      max: env.dbPoolMax,
    })
  : null;

export function requirePool(): pg.Pool {
  if (!pool) {
    throw new Error('DATABASE_URL is required for database operations');
  }
  return pool;
}
