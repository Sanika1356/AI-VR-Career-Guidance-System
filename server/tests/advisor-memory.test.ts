import assert from "node:assert/strict";
import type { QueryResult, QueryResultRow } from "pg";
import test from "node:test";
import type { DatabaseClient, DatabasePool } from "../src/db/types.js";
import { clearAdvisorHistory } from "../src/services/advisor-memory.service.js";
import { validateConversationId } from "../src/validators/advisor.js";

function result<T extends QueryResultRow>(
  rows: T[],
  rowCount = rows.length,
): QueryResult<T> {
  return { rows, rowCount, command: "SELECT", oid: 0, fields: [] };
}

class FakeClient implements DatabaseClient {
  readonly queries: string[] = [];

  constructor(private readonly owned: boolean) {}

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
  ): Promise<QueryResult<T>> {
    this.queries.push(text.trim().replace(/\s+/g, " "));
    if (text.includes("SELECT id FROM conversations")) {
      return result((this.owned ? [{ id: "conversation_owned" }] : []) as T[]);
    }
    if (text.startsWith("DELETE FROM messages")) {
      return result([] as T[], 2);
    }
    return result([] as T[]);
  }

  release(): void {}
}

function poolFor(client: FakeClient): DatabasePool {
  return { connect: async () => client };
}

test("clearAdvisorHistory deletes only messages from an owned conversation and reports the count", async () => {
  const client = new FakeClient(true);
  const response = await clearAdvisorHistory(
    "user_asha",
    "conversation_owned",
    poolFor(client),
  );

  assert.deepEqual(response, {
    conversationId: "conversation_owned",
    deletedMessageCount: 2,
  });
  assert.ok(client.queries.includes("BEGIN"));
  assert.ok(
    client.queries.some((query) => query.startsWith("DELETE FROM messages")),
  );
  assert.ok(client.queries.includes("COMMIT"));
});

test("clearAdvisorHistory rejects another user conversation and rolls back", async () => {
  const client = new FakeClient(false);
  await assert.rejects(
    clearAdvisorHistory("user_asha", "conversation_owned", poolFor(client)),
    (error: unknown) =>
      error instanceof Error &&
      "statusCode" in error &&
      (error as { statusCode: number }).statusCode === 404,
  );
  assert.ok(client.queries.includes("ROLLBACK"));
  assert.equal(
    client.queries.some((query) => query.startsWith("DELETE FROM messages")),
    false,
  );
});

test("conversation ID validation rejects malformed path values", () => {
  assert.equal(validateConversationId("conversation_123"), "conversation_123");
  assert.throws(() => validateConversationId("bad id"), /valid identifier/);
});
