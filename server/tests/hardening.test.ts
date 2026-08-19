import assert from 'node:assert/strict';
import test from 'node:test';
import type { QueryResult, QueryResultRow } from 'pg';
import type { DatabaseClient, DatabasePool } from '../src/db/types.js';
import { getDependencyHealth } from '../src/services/health.service.js';
import { createRateLimiter } from '../src/middleware/rate-limit.js';

function queryResult<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

class FakeClient implements DatabaseClient {
  constructor(private readonly failure?: Error) {}

  async query<T extends QueryResultRow = QueryResultRow>(_sql: string, _values: readonly unknown[] = []): Promise<QueryResult<T>> {
    if (this.failure) throw this.failure;
    return queryResult([]) as QueryResult<T>;
  }

  release(): void {}
}

function poolFor(failure?: Error): DatabasePool {
  return { connect: async () => new FakeClient(failure) };
}

test('dependency health reports healthy and degraded database states without leaking details', async () => {
  assert.deepEqual(await getDependencyHealth(poolFor()), {
    status: 'ok',
    service: 'career-guidance-api',
    database: 'ok',
  });

  assert.deepEqual(await getDependencyHealth(poolFor(new Error('private connection detail'))), {
    status: 'degraded',
    service: 'career-guidance-api',
    database: 'unavailable',
  });

  assert.deepEqual(await getDependencyHealth(null), {
    status: 'degraded',
    service: 'career-guidance-api',
    database: 'unavailable',
  });
});

test('rate limiter returns a retryable 429 after the configured request count', () => {
  const limiter = createRateLimiter({
    windowMs: 60_000,
    maxRequests: 2,
    keyGenerator: () => 'test-client',
  });
  const request = { ip: '127.0.0.1' } as never;
  const headers = new Map<string, string>();
  const response = { setHeader: (name: string, value: string) => headers.set(name, value) } as never;
  const errors: Array<{ statusCode?: number; code?: string }> = [];
  const next = (error?: { statusCode?: number; code?: string }) => {
    if (error) errors.push(error);
  };

  limiter(request, response, next);
  limiter(request, response, next);
  limiter(request, response, next);

  assert.equal(errors.length, 1);
  assert.equal(errors[0]?.statusCode, 429);
  assert.equal(errors[0]?.code, 'rate_limit_exceeded');
  assert.equal(headers.get('Retry-After'), '60');
});
