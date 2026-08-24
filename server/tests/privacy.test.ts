import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import type { QueryResult, QueryResultRow } from "pg";
import { app } from "../src/app.js";
import type { DatabaseClient, DatabasePool } from "../src/db/types.js";
import {
  deleteAccount,
  exportAccountData,
  getPrivacyConsent,
  updatePrivacyConsent,
} from "../src/services/privacy.service.js";
import { validatePrivacyConsentInput } from "../src/validators/privacy.js";

function queryResult<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return { rows, rowCount: rows.length, command: "SELECT", oid: 0, fields: [] };
}

class FakeClient implements DatabaseClient {
  public readonly queries: string[] = [];

  constructor(
    private readonly respond: (
      sql: string,
      values: readonly unknown[],
    ) => QueryResult<QueryResultRow>,
  ) {}

  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    values: readonly unknown[] = [],
  ): Promise<QueryResult<T>> {
    this.queries.push(sql.trim().split("\n")[0]);
    return this.respond(sql, values) as QueryResult<T>;
  }

  release(): void {}
}

function poolFor(client: DatabaseClient): DatabasePool {
  return { connect: async () => client };
}

test("privacy endpoints require bearer authentication", async () => {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/privacy/consent`,
    );
    assert.equal(response.status, 401);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("privacy consent validator requires exactly three booleans", () => {
  assert.deepEqual(
    validatePrivacyConsentInput({
      analytics: true,
      personalizedAi: false,
      vrTelemetry: true,
    }),
    { analytics: true, personalizedAi: false, vrTelemetry: true },
  );
  assert.throws(() =>
    validatePrivacyConsentInput({
      analytics: "yes",
      personalizedAi: false,
      vrTelemetry: true,
    }),
  );
  assert.throws(() =>
    validatePrivacyConsentInput({ analytics: false, personalizedAi: false }),
  );
});

test("privacy consent defaults to opt-in choices being disabled", async () => {
  const client = new FakeClient(() => queryResult([]));
  assert.deepEqual(await getPrivacyConsent("user_demo", poolFor(client)), {
    analytics: false,
    personalizedAi: false,
    vrTelemetry: false,
    policyVersion: "v1",
    updatedAt: null,
  });
});

test("privacy consent update maps database names to client names", async () => {
  const client = new FakeClient((sql) =>
    sql.includes("INSERT INTO privacy_consents")
      ? queryResult([
          {
            analytics: true,
            personalized_ai: false,
            vr_telemetry: true,
            policy_version: "v1",
            updated_at: "2026-08-24T00:00:00.000Z",
          },
        ])
      : queryResult([]),
  );

  assert.deepEqual(
    await updatePrivacyConsent(
      "user_demo",
      {
        analytics: true,
        personalizedAi: false,
        vrTelemetry: true,
      },
      poolFor(client),
    ),
    {
      analytics: true,
      personalizedAi: false,
      vrTelemetry: true,
      policyVersion: "v1",
      updatedAt: "2026-08-24T00:00:00.000Z",
    },
  );
});

test("account export includes owned data without password hashes or tokens", async () => {
  const client = new FakeClient((sql) => {
    if (sql.includes("FROM users WHERE"))
      return queryResult([
        {
          id: "user_demo",
          name: "Student Name",
          email: "student@example.com",
          status: "active",
          created_at: "2026-08-20T00:00:00.000Z",
          updated_at: "2026-08-21T00:00:00.000Z",
        },
      ]);
    if (sql.includes("FROM profiles"))
      return queryResult([
        {
          interests: ["design"],
          current_skills: ["research"],
          experience: "Beginner",
          learning_preferences: { pace: "steady" },
          created_at: "2026-08-20T00:00:00.000Z",
          updated_at: "2026-08-21T00:00:00.000Z",
        },
      ]);
    if (sql.includes("FROM privacy_consents"))
      return queryResult([
        {
          analytics: false,
          personalized_ai: true,
          vr_telemetry: false,
          policy_version: "v1",
          updated_at: "2026-08-21T00:00:00.000Z",
        },
      ]);
    if (sql.includes("FROM assessments"))
      return queryResult([{ id: "assessment_1", status: "completed" }]);
    if (sql.includes("FROM assessment_results"))
      return queryResult([
        { id: "result_1", top_career_ids: ["career_ai_engineer"] },
      ]);
    if (sql.includes("FROM recommendations"))
      return queryResult([
        { id: "recommendation_1", career_id: "career_ai_engineer" },
      ]);
    if (sql.includes("FROM roadmap_progress"))
      return queryResult([
        { user_id: "user_demo", step_id: "step_1", completed: true },
      ]);
    if (sql.includes("FROM conversations"))
      return queryResult([
        {
          id: "conversation_1",
          career_id: "career_ai_engineer",
          created_at: "2026-08-21T00:00:00.000Z",
        },
      ]);
    if (sql.includes("FROM messages"))
      return queryResult([
        {
          id: "message_1",
          conversation_id: "conversation_1",
          role: "user",
          content: "Hello",
        },
      ]);
    return queryResult([]);
  });

  const exported = await exportAccountData("user_demo", poolFor(client));
  assert.equal(exported.user.id, "user_demo");
  assert.equal(exported.privacy.personalizedAi, true);
  assert.equal(exported.conversations.length, 1);
  assert.deepEqual(
    (exported.conversations[0] as { messages: unknown[] }).messages,
    [
      {
        id: "message_1",
        conversation_id: "conversation_1",
        role: "user",
        content: "Hello",
      },
    ],
  );
  assert.equal("password_hash" in exported.user, false);
  assert.equal("token" in exported, false);
});

test("account deletion is transactional and returns only a deletion confirmation", async () => {
  const client = new FakeClient((sql) =>
    sql.includes("DELETE FROM users")
      ? queryResult([{ id: "user_demo" }])
      : queryResult([]),
  );
  assert.deepEqual(await deleteAccount("user_demo", poolFor(client)), {
    deleted: true,
    userId: "user_demo",
  });
  assert.deepEqual(client.queries, [
    "BEGIN",
    "DELETE FROM users WHERE id = $1 RETURNING id",
    "COMMIT",
  ]);
});
