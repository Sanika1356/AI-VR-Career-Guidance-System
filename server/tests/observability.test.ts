import assert from "node:assert/strict";
import test from "node:test";
import type { QueryResult, QueryResultRow } from "pg";
import type { DatabaseClient, DatabasePool } from "../src/db/types.js";
import {
  recordAuditEvent,
  requestAuditId,
} from "../src/services/audit.service.js";
import {
  getMetricsSnapshot,
  observeAiRequest,
  observeApiRequest,
  observeRateLimitExceeded,
  resetMetricsForTests,
} from "../src/utils/metrics.js";

function queryResult<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return { rows, rowCount: rows.length, command: "INSERT", oid: 0, fields: [] };
}

class FakeClient implements DatabaseClient {
  values: readonly unknown[] = [];

  async query<T extends QueryResultRow = QueryResultRow>(
    _sql: string,
    values: readonly unknown[] = [],
  ): Promise<QueryResult<T>> {
    this.values = values;
    return queryResult([]) as QueryResult<T>;
  }

  release(): void {}
}

test("observability aggregates API, AI, and rate-limit metrics without user payloads", () => {
  resetMetricsForTests();
  observeApiRequest(200, 10);
  observeApiRequest(500, 30);
  observeRateLimitExceeded("auth");
  observeRateLimitExceeded("auth");
  observeAiRequest({ success: true, fallback: false, durationMs: 20 });
  observeAiRequest({ success: false, fallback: true, durationMs: 40 });

  const snapshot = getMetricsSnapshot();
  assert.equal(snapshot.api.requests, 2);
  assert.equal(snapshot.api.errors, 1);
  assert.equal(snapshot.api.averageLatencyMs, 20);
  assert.equal(snapshot.api.maxLatencyMs, 30);
  assert.deepEqual(snapshot.rateLimitExceeded, { auth: 2 });
  assert.equal(snapshot.ai.requests, 2);
  assert.equal(snapshot.ai.failures, 1);
  assert.equal(snapshot.ai.fallbacks, 1);
  assert.equal(snapshot.ai.averageLatencyMs, 30);
  assert.equal(snapshot.ai.maxLatencyMs, 40);
});

test("audit events use the request ID and redacted primitive metadata", async () => {
  const client = new FakeClient();
  const database: DatabasePool = { connect: async () => client };
  await recordAuditEvent(
    {
      eventType: "profile_changed",
      userId: "user_demo",
      requestId: "request_demo",
      metadata: { changedFields: "name,interests" },
    },
    database,
  );

  assert.equal(client.values[1], "user_demo");
  assert.equal(client.values[2], "request_demo");
  assert.equal(client.values[3], "profile_changed");
  assert.equal(
    client.values[4],
    JSON.stringify({ changedFields: "name,interests" }),
  );
  assert.equal(
    requestAuditId({ getHeader: () => "request_demo" }),
    "request_demo",
  );
  assert.equal(requestAuditId({ getHeader: () => ["request_demo"] }), null);
});

test("audit persistence failures do not expose database details or fail the primary request", async () => {
  const database: DatabasePool = {
    connect: async () => ({
      query: async () => {
        throw new Error("private database detail");
      },
      release: () => undefined,
    }),
  };
  await assert.doesNotReject(() =>
    recordAuditEvent(
      {
        eventType: "advisor_requested",
        userId: "user_demo",
        requestId: "request_demo",
      },
      database,
    ),
  );
});
