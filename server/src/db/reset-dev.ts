import { env } from '../config/env.js';
import { migrate } from './migrate.js';
import { requirePool } from './pool.js';
import { safeErrorDetails } from '../utils/safe-error.js';

const localDatabaseHosts = new Set(['localhost', '127.0.0.1', '::1']);

function assertDevelopmentDatabase(): void {
  if (env.nodeEnv !== 'development' && env.nodeEnv !== 'test') {
    throw new Error('Database reset is allowed only when NODE_ENV is development or test');
  }

  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is required for a development database reset');
  }

  const databaseUrl = new URL(env.databaseUrl);
  if (!localDatabaseHosts.has(databaseUrl.hostname)) {
    throw new Error(`Database reset is restricted to localhost; received host ${databaseUrl.hostname}`);
  }
}

async function resetDevelopmentDatabase(): Promise<void> {
  assertDevelopmentDatabase();

  const database = requirePool();
  await database.query('DROP SCHEMA IF EXISTS public CASCADE');
  await database.query('CREATE SCHEMA public');
  await migrate({ runSeedData: true });
  console.info('Development database reset and seeded successfully');
}

resetDevelopmentDatabase().catch(async (error) => {
  console.error(JSON.stringify({
    event: 'development_database_reset_failed',
    ...safeErrorDetails(error),
  }));
  await requirePool().end().catch(() => undefined);
  process.exitCode = 1;
});
