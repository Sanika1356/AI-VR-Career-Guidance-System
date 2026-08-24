import assert from "node:assert/strict";
import type { QueryResult, QueryResultRow } from "pg";
import test from "node:test";
import type { DatabaseClient, DatabasePool } from "../src/db/types.js";
import { recordAdvisorFeedback } from "../src/services/advisor-feedback.service.js";
import { validateAdvisorFeedbackInput } from "../src/validators/advisor.js";

function result<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return { rows, rowCount: rows.length, command: "SELECT", oid: 0, fields: [] };
}

class FakeClient implements DatabaseClient {
  readonly queries: string[] = [];

  constructor(
    private readonly ownedConversation: boolean,
    private readonly assistantMessage: boolean,
  ) {}

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
  ): Promise<QueryResult<T>> {
    this.queries.push(text.trim().replace(/\s+/g, " "));
    if (text.includes("FROM conversations")) {
      return result(
        (this.ownedConversation ? [{ id: "conversation_owned" }] : []) as T[],
      );
    }
    if (text.includes("role = 'assistant'")) {
      return result(
        (this.assistantMessage
          ? [{ created_at: "2026-08-24T00:00:00.000Z" }]
          : []) as T[],
      );
    }
    return result([] as T[]);
  }

  release(): void {}
}

function poolFor(client: FakeClient): DatabasePool {
  return { connect: async () => client };
}

test("advisor feedback records fixed categories for an owned assistant message", async () => {
  const client = new FakeClient(true, true);
  const input = validateAdvisorFeedbackInput({
    conversationId: "conversation_owned",
    messageCreatedAt: "2026-08-24T00:00:00.000Z",
    helpful: true,
    reason: "actionable",
  });
  const response = await recordAdvisorFeedback(
    "user_asha",
    input,
    poolFor(client),
  );

  assert.deepEqual(response, {
    recorded: true,
    conversationId: "conversation_owned",
    messageCreatedAt: "2026-08-24T00:00:00.000Z",
  });
  assert.ok(
    client.queries.some((query) =>
      query.startsWith("INSERT INTO advisor_feedback"),
    ),
  );
});

test("advisor feedback cannot target another user or a non-assistant message", async () => {
  await assert.rejects(
    recordAdvisorFeedback(
      "user_asha",
      {
        conversationId: "conversation_owned",
        messageCreatedAt: "2026-08-24T00:00:00.000Z",
        helpful: false,
      },
      poolFor(new FakeClient(false, true)),
    ),
    /conversation does not exist/,
  );
  await assert.rejects(
    recordAdvisorFeedback(
      "user_asha",
      {
        conversationId: "conversation_owned",
        messageCreatedAt: "2026-08-24T00:00:00.000Z",
        helpful: false,
      },
      poolFor(new FakeClient(true, false)),
    ),
    /advisor message does not exist/,
  );
});

test("advisor feedback validation rejects free-form or malformed values", () => {
  assert.throws(
    () =>
      validateAdvisorFeedbackInput({
        conversationId: "conversation_owned",
        messageCreatedAt: "2026-08-24T00:00:00.000Z",
        helpful: true,
        comment: "private text",
      }),
    /unsupported field/,
  );
  assert.throws(
    () =>
      validateAdvisorFeedbackInput({
        conversationId: "conversation_owned",
        messageCreatedAt: "2026-08-24T00:00:00.000Z",
        helpful: true,
        reason: "free-form",
      }),
    /reason is not supported/,
  );
});
