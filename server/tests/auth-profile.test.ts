import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { app } from '../src/app.js';
import type { DatabaseClient, DatabasePool } from '../src/db/types.js';
import { registerUser, loginUser } from '../src/services/auth.service.js';
import { getProfile, updateProfile } from '../src/services/profile.service.js';
import { hashPassword } from '../src/utils/password.js';
import type { QueryResult, QueryResultRow } from 'pg';

function queryResult<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

class FakeClient implements DatabaseClient {
  public readonly queries: string[] = [];

  constructor(private readonly respond: (sql: string, values: readonly unknown[]) => QueryResult<QueryResultRow>) {}

  async query<T extends QueryResultRow = QueryResultRow>(sql: string, values: readonly unknown[] = []): Promise<QueryResult<T>> {
    this.queries.push(sql.trim().split('\n')[0]);
    return this.respond(sql, values) as QueryResult<T>;
  }

  release(): void {}
}

function poolFor(client: DatabaseClient): DatabasePool {
  return { connect: async () => client };
}

test('registerUser creates a public user response and bearer token', async () => {
  const client = new FakeClient((sql) => {
    if (sql.includes('SELECT id FROM users')) return queryResult([]);
    if (sql.includes('INSERT INTO users')) return queryResult([{ id: 'user_demo', name: 'Student Name', email: 'student@example.com' }]);
    return queryResult([]);
  });

  const result = await registerUser(
    { name: 'Student Name', email: 'student@example.com', password: 'secure-password' },
    poolFor(client),
  );

  assert.equal(result.user.id, 'user_demo');
  assert.equal(result.user.email, 'student@example.com');
  assert.ok(result.token.startsWith('v1.'));
  assert.deepEqual(client.queries.slice(0, 2), ['BEGIN', 'SELECT id FROM users WHERE email = $1']);
});

test('loginUser rejects an incorrect password without exposing account details', async () => {
  const passwordHash = await hashPassword('secure-password');
  const client = new FakeClient((sql) => sql.includes('SELECT id, name, email, password_hash')
    ? queryResult([{ id: 'user_demo', name: 'Student Name', email: 'student@example.com', password_hash: passwordHash }])
    : queryResult([]));

  await assert.rejects(
    loginUser({ email: 'student@example.com', password: 'wrong-password' }, poolFor(client)),
    (error: Error & { statusCode?: number; code?: string }) => error.statusCode === 401 && error.code === 'invalid_credentials',
  );
});

test('profile services preserve frontend field names and user ownership', async () => {
  const profileRow = {
    user_id: 'user_demo',
    name: 'Student Name',
    email: 'student@example.com',
    interests: ['design'],
    current_skills: ['research'],
    experience: 'Beginner',
    learning_preferences: { pace: 'steady' },
  };
  const client = new FakeClient((sql) => sql.includes('SELECT') ? queryResult([profileRow]) : queryResult([]));

  const profile = await getProfile('user_demo', poolFor(client));
  assert.deepEqual(profile.profile, {
    interests: ['design'],
    currentSkills: ['research'],
    experience: 'Beginner',
    learningPreferences: { pace: 'steady' },
  });

  const updated = await updateProfile('user_demo', { currentSkills: ['typescript'] }, poolFor(client));
  assert.equal(updated.user.id, 'user_demo');
  assert.ok(client.queries.includes('BEGIN'));
  assert.ok(client.queries.includes('COMMIT'));
});

test('GET /api/profile requires a bearer token before accessing the database', async () => {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/profile`);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: 'unauthorized',
      message: 'A valid bearer token is required.',
    });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('POST /api/auth/register validates input before database access', async () => {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Student', email: 'not-an-email', password: 'short' }),
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.error, 'validation_error');
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
