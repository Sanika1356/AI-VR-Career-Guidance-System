import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import type { QueryResult, QueryResultRow } from 'pg';
import { app } from '../src/app.js';
import type { DatabaseClient, DatabasePool } from '../src/db/types.js';
import { getRoadmap, updateRoadmapProgress } from '../src/services/roadmap.service.js';
import { validateUpdateRoadmapProgressPayload } from '../src/validators/roadmap.js';

function queryResult<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

class RoadmapClient implements DatabaseClient {
  readonly queries: string[] = [];

  async query<T extends QueryResultRow = QueryResultRow>(sql: string): Promise<QueryResult<T>> {
    this.queries.push(sql.trim());
    if (sql.includes('SELECT id FROM careers')) {
      return queryResult([{ id: 'career_ai_engineer' }]) as QueryResult<T>;
    }
    if (sql.includes('FROM roadmap_steps rs')) {
      return queryResult([
        {
          id: 'roadmap_ai_python',
          career_id: 'career_ai_engineer',
          title: 'Strengthen Python',
          description: 'Complete the Python practice module.',
          skill: 'Python',
          display_order: 1,
          completed: false,
        },
        {
          id: 'roadmap_ai_ml',
          career_id: 'career_ai_engineer',
          title: 'Learn Machine Learning',
          description: 'Study supervised learning fundamentals.',
          skill: 'Machine Learning',
          display_order: 2,
          completed: true,
        },
      ]) as QueryResult<T>;
    }
    if (sql.includes('SELECT id, career_id FROM roadmap_steps')) {
      return queryResult([{ id: 'roadmap_ai_python', career_id: 'career_ai_engineer' }]) as QueryResult<T>;
    }
    if (sql.includes('INSERT INTO roadmap_progress')) {
      return queryResult([]) as QueryResult<T>;
    }
    return queryResult([]) as QueryResult<T>;
  }

  release(): void {}
}

function poolFor(client: DatabaseClient): DatabasePool {
  return { connect: async () => client };
}

test('getRoadmap returns ordered steps with user-specific completion state', async () => {
  const response = await getRoadmap('user_demo', 'career_ai_engineer', poolFor(new RoadmapClient()));
  assert.deepEqual(response, {
    careerId: 'career_ai_engineer',
    steps: [
      {
        id: 'roadmap_ai_python',
        title: 'Strengthen Python',
        description: 'Complete the Python practice module.',
        skill: 'Python',
        order: 1,
        completed: false,
      },
      {
        id: 'roadmap_ai_ml',
        title: 'Learn Machine Learning',
        description: 'Study supervised learning fundamentals.',
        skill: 'Machine Learning',
        order: 2,
        completed: true,
      },
    ],
  });
});

test('updateRoadmapProgress persists only the authenticated user progress', async () => {
  const client = new RoadmapClient();
  const response = await updateRoadmapProgress('user_demo', 'roadmap_ai_python', true, poolFor(client));
  assert.deepEqual(response, {
    stepId: 'roadmap_ai_python',
    careerId: 'career_ai_engineer',
    completed: true,
  });
  assert.ok(client.queries.some((query) => query.includes('INSERT INTO roadmap_progress')));
});

test('roadmap progress validator rejects unknown fields and non-boolean values', () => {
  assert.deepEqual(validateUpdateRoadmapProgressPayload({ completed: false }), { completed: false });
  assert.throws(() => validateUpdateRoadmapProgressPayload({ completed: 'true' }), /boolean completed/);
  assert.throws(() => validateUpdateRoadmapProgressPayload({ completed: true, userId: 'other-user' }), /only a boolean completed/);
});

test('updateRoadmapProgress rejects a missing roadmap step', async () => {
  const client: DatabaseClient = {
    async query<T extends QueryResultRow = QueryResultRow>(sql: string): Promise<QueryResult<T>> {
      if (sql.includes('SELECT id, career_id FROM roadmap_steps')) return queryResult([]) as QueryResult<T>;
      return queryResult([]) as QueryResult<T>;
    },
    release(): void {},
  };

  await assert.rejects(
    updateRoadmapProgress('user_demo', 'roadmap_unknown', true, poolFor(client)),
    (error: Error & { statusCode?: number; code?: string }) => error.statusCode === 404 && error.code === 'roadmap_step_not_found',
  );
});

test('roadmap endpoints require bearer authentication', async () => {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  try {
    const getResponse = await fetch(`http://127.0.0.1:${address.port}/api/careers/career_ai_engineer/roadmap`);
    assert.equal(getResponse.status, 401);
    const patchResponse = await fetch(`http://127.0.0.1:${address.port}/api/roadmap/roadmap_ai_python`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });
    assert.equal(patchResponse.status, 401);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
