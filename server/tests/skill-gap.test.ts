import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import type { QueryResult, QueryResultRow } from 'pg';
import { app } from '../src/app.js';
import type { DatabaseClient, DatabasePool } from '../src/db/types.js';
import { getSkillGap } from '../src/services/skill-gap.service.js';

function queryResult<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

class FakeClient implements DatabaseClient {
  async query<T extends QueryResultRow = QueryResultRow>(sql: string): Promise<QueryResult<T>> {
    if (sql.includes('FROM careers c')) {
      return queryResult([
        { career_id: 'career_ai_engineer', skill_name: 'Machine Learning', required_level: 'intermediate' },
        { career_id: 'career_ai_engineer', skill_name: 'Python', required_level: 'beginner' },
      ]) as QueryResult<T>;
    }
    if (sql.includes('FROM profiles')) {
      return queryResult([{ current_skills: ['python'] }]) as QueryResult<T>;
    }
    return queryResult([]) as QueryResult<T>;
  }

  release(): void {}
}

function poolFor(client: DatabaseClient): DatabasePool {
  return { connect: async () => client };
}

test('getSkillGap compares profile skills with career requirements', async () => {
  const response = await getSkillGap('user_demo', 'career_ai_engineer', poolFor(new FakeClient()));
  assert.deepEqual(response, {
    careerId: 'career_ai_engineer',
    skills: [
      { name: 'Machine Learning', status: 'missing', level: 'intermediate' },
      { name: 'Python', status: 'matched', level: 'beginner' },
    ],
  });
});

test('getSkillGap rejects an unknown career', async () => {
  const client: DatabaseClient = {
    async query<T extends QueryResultRow = QueryResultRow>(sql: string): Promise<QueryResult<T>> {
      if (sql.includes('FROM careers c')) return queryResult([]) as QueryResult<T>;
      return queryResult([]) as QueryResult<T>;
    },
    release(): void {},
  };

  await assert.rejects(
    getSkillGap('user_demo', 'career_unknown', poolFor(client)),
    (error: Error & { statusCode?: number; code?: string }) => error.statusCode === 404 && error.code === 'career_not_found',
  );
});

test('skill-gap endpoint requires bearer authentication', async () => {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/careers/career_ai_engineer/skill-gap`);
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error, 'unauthorized');
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
