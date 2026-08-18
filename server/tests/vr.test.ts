import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import type { QueryResult, QueryResultRow } from 'pg';
import type { DatabaseClient, DatabasePool } from '../src/db/types.js';
import { listVREnvironments } from '../src/services/vr.service.js';

function queryResult<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

class FakeClient implements DatabaseClient {
  constructor(private readonly rows: QueryResultRow[]) {}

  async query<T extends QueryResultRow = QueryResultRow>(_sql: string, _values: readonly unknown[] = []): Promise<QueryResult<T>> {
    return queryResult(this.rows as T[]);
  }

  release(): void {}
}

function poolFor(rows: QueryResultRow[]): DatabasePool {
  return { connect: async () => new FakeClient(rows) };
}

test('listVREnvironments maps only safe metadata and preserves database ordering', async () => {
  const response = await listVREnvironments(poolFor([
    {
      key: 'ai-engineer-lab',
      career_id: 'career_ai_engineer',
      title: 'AI Engineering Lab',
      description: 'A safe simulated workspace.',
      available: true,
      internal_scene_path: '/server/private/scene.glb',
    },
    {
      key: 'data-insights-studio',
      career_id: 'career_data_analyst',
      title: 'Data Insights Studio',
      description: 'A simulated analytics studio.',
      available: false,
      provider_key: 'should-not-be-returned',
    },
  ]));

  assert.deepEqual(response, {
    environments: [
      {
        key: 'ai-engineer-lab',
        careerId: 'career_ai_engineer',
        title: 'AI Engineering Lab',
        description: 'A safe simulated workspace.',
        available: true,
      },
      {
        key: 'data-insights-studio',
        careerId: 'career_data_analyst',
        title: 'Data Insights Studio',
        description: 'A simulated analytics studio.',
        available: false,
      },
    ],
  });
});

test('listVREnvironments returns an empty catalog without inventing careers', async () => {
  assert.deepEqual(await listVREnvironments(poolFor([])), { environments: [] });
});

test('VR MVP migration keeps only approved environments while preserving extensibility', async () => {
  const migrationPath = fileURLToPath(new URL('../src/db/migrations/004_vr_mvp_catalog.sql', import.meta.url));
  const migration = await readFile(migrationPath, 'utf8');

  assert.match(migration, /ai-engineer-lab/);
  assert.match(migration, /data-insights-studio/);
  assert.match(migration, /career_data_analyst/);
  assert.match(migration, /ON CONFLICT \(key\) DO UPDATE/);
  assert.match(migration, /DELETE FROM vr_environments/);
  assert.doesNotMatch(migration, /career_data_scientist/);
});
