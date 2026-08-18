import { readdir, readFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requirePool } from './pool.js';

const migrationsDirectory = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

async function migrate(): Promise<void> {
  const database = requirePool();
  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    console.info('No migration files found.');
    return;
  }

  for (const file of migrationFiles) {
    const version = basename(file, '.sql');
    const alreadyApplied = await database.query('SELECT 1 FROM schema_migrations WHERE version = $1', [version]).catch(() => null);
    if (alreadyApplied?.rowCount) {
      console.info(`Skipping applied migration ${version}`);
      continue;
    }

    const sql = await readFile(join(migrationsDirectory, file), 'utf8');
    const client = await database.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
      await client.query('COMMIT');
      console.info(`Applied migration ${version}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  await database.end();
}

migrate().catch((error) => {
  console.error('Database migration failed', error);
  process.exitCode = 1;
});
