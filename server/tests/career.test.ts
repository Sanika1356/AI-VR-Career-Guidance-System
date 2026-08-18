import assert from 'node:assert/strict';
import test from 'node:test';
import type { QueryResult, QueryResultRow } from 'pg';
import type { DatabaseClient, DatabasePool } from '../src/db/types.js';
import { getCareer, listCareers } from '../src/services/career.service.js';

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

test('listCareers maps database rows to the documented career summaries', async () => {
  const careers = await listCareers(poolFor([
    {
      id: 'career_ai_engineer',
      name: 'AI Engineer',
      description: 'Builds intelligent software systems.',
      environment_key: 'ai-engineer-lab',
      skills: ['APIs', 'Machine Learning', 'Python'],
    },
  ]));

  assert.deepEqual(careers, [{
    id: 'career_ai_engineer',
    name: 'AI Engineer',
    description: 'Builds intelligent software systems.',
    skills: ['APIs', 'Machine Learning', 'Python'],
    environmentKey: 'ai-engineer-lab',
  }]);
});

test('getCareer maps resources, roadmap, and VR metadata for one career', async () => {
  const career = await getCareer('career_ai_engineer', poolFor([
    {
      id: 'career_ai_engineer',
      name: 'AI Engineer',
      description: 'Builds intelligent software systems.',
      environment_key: 'ai-engineer-lab',
      skills: ['Python'],
      learning_resources: [{ title: 'Python Documentation', url: 'https://docs.python.org/3/', type: 'documentation', free: true }],
      environment_title: 'AI Engineering Lab',
      environment_description: 'A simulated workspace.',
      environment_available: true,
      roadmap: [{ id: 'step_1', title: 'Build Python foundations', description: 'Practice Python.', skill: 'Python', display_order: 1 }],
    },
  ]));

  assert.equal(career.environment?.key, 'ai-engineer-lab');
  assert.equal(career.environment?.available, true);
  assert.equal(career.learningResources[0]?.free, true);
  assert.equal(career.roadmap[0]?.displayOrder, 1);
});

test('getCareer returns a documented 404 error when the career does not exist', async () => {
  await assert.rejects(
    getCareer('career_missing', poolFor([])),
    (error: Error & { statusCode?: number; code?: string }) => error.statusCode === 404 && error.code === 'career_not_found',
  );
});
