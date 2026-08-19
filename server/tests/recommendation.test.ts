import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import type { QueryResult, QueryResultRow } from 'pg';
import { app } from '../src/app.js';
import type { DatabaseClient, DatabasePool } from '../src/db/types.js';
import { getRecommendations } from '../src/services/recommendation.service.js';

function queryResult<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

class FakeClient implements DatabaseClient {
  public readonly statements: Array<{ sql: string; values: readonly unknown[] }> = [];

  async query<T extends QueryResultRow = QueryResultRow>(sql: string, values: readonly unknown[] = []): Promise<QueryResult<T>> {
    this.statements.push({ sql, values });
    if (sql.includes('FROM assessment_results')) {
      return queryResult([{
        id: 'result_demo',
        category_scores: { career_ai_engineer: 5, career_data_analyst: 3 },
      }]) as QueryResult<T>;
    }
    if (sql.includes('FROM careers c')) {
      return queryResult([
        { career_id: 'career_ai_engineer', career_name: 'AI Engineer', career_description: 'Builds intelligent systems.', skill_name: 'Python' },
        { career_id: 'career_ai_engineer', career_name: 'AI Engineer', career_description: 'Builds intelligent systems.', skill_name: 'Machine Learning' },
        { career_id: 'career_data_analyst', career_name: 'Data Analyst', career_description: 'Analyzes data.', skill_name: 'SQL' },
        { career_id: 'career_data_analyst', career_name: 'Data Analyst', career_description: 'Analyzes data.', skill_name: 'Data Analysis' },
      ]) as QueryResult<T>;
    }
    if (sql.includes('FROM profiles')) {
      return queryResult([{ current_skills: ['Python'] }]) as QueryResult<T>;
    }
    return queryResult([]) as QueryResult<T>;
  }

  release(): void {}
}

function poolFor(client: DatabaseClient): DatabasePool {
  return { connect: async () => client };
}

test('getRecommendations ranks careers and persists matched and missing skills', async () => {
  const client = new FakeClient();
  const response = await getRecommendations('user_demo', undefined, poolFor(client));

  assert.equal(response.resultId, 'result_demo');
  assert.deepEqual(response.recommendations, [
    {
      careerId: 'career_ai_engineer',
      career: 'AI Engineer',
      score: 100,
      reason: 'Assessment match with 1 matched skill and a path to build Machine Learning.',
      matchedSkills: ['Python'],
      missingSkills: ['Machine Learning'],
    },
    {
      careerId: 'career_data_analyst',
      career: 'Data Analyst',
      score: 60,
      reason: 'Assessment match with an opportunity to build SQL and Data Analysis.',
      matchedSkills: [],
      missingSkills: ['SQL', 'Data Analysis'],
    },
  ]);

  const insert = client.statements.find((statement) => statement.sql.includes('INSERT INTO recommendations'));
  assert.ok(insert);
  assert.equal(insert.values[5], '["Python"]');
  assert.equal(insert.values[6], '["Machine Learning"]');
});

test('getRecommendations returns a safe 404 when the explicit result is not owned by the user', async () => {
  const client: DatabaseClient = {
    async query<T extends QueryResultRow = QueryResultRow>(sql: string): Promise<QueryResult<T>> {
      if (sql.includes('FROM assessment_results')) return queryResult([]) as QueryResult<T>;
      return queryResult([]) as QueryResult<T>;
    },
    release(): void {},
  };

  await assert.rejects(
    getRecommendations('user_demo', 'result_other_user', poolFor(client)),
    (error: Error & { statusCode?: number; code?: string }) => error.statusCode === 404 && error.code === 'assessment_result_not_found',
  );
});

test('recommendation endpoint requires bearer authentication', async () => {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/recommendations`);
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error, 'unauthorized');
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
