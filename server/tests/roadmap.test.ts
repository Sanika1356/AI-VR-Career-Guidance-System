import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import type { QueryResult, QueryResultRow } from "pg";
import { app } from "../src/app.js";
import type { DatabaseClient, DatabasePool } from "../src/db/types.js";
import {
  getRoadmap,
  updateRoadmapProgress,
  reorderRoadmapStep,
} from "../src/services/roadmap.service.js";
import {
  validateReorderRoadmapPayload,
  validateUpdateRoadmapProgressPayload,
} from "../src/validators/roadmap.js";

function queryResult<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return { rows, rowCount: rows.length, command: "SELECT", oid: 0, fields: [] };
}

class RoadmapClient implements DatabaseClient {
  readonly queries: string[] = [];

  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
  ): Promise<QueryResult<T>> {
    this.queries.push(sql.trim());
    if (sql.includes("SELECT id FROM careers")) {
      return queryResult([{ id: "career_ai_engineer" }]) as QueryResult<T>;
    }
    if (sql.includes("FROM roadmap_steps rs")) {
      return queryResult([
        {
          id: "roadmap_ai_python",
          career_id: "career_ai_engineer",
          title: "Strengthen Python",
          description: "Complete the Python practice module.",
          skill: "Python",
          display_order: 1,
          estimated_effort_minutes: 90,
          accessibility_note: "Use the text-first path.",
          completed: false,
          target_date: null,
          status: "not_started",
          notes: "",
          evidence_links: [],
          position: null,
        },
        {
          id: "roadmap_ai_ml",
          career_id: "career_ai_engineer",
          title: "Learn Machine Learning",
          description: "Study supervised learning fundamentals.",
          skill: "Machine Learning",
          display_order: 2,
          estimated_effort_minutes: 120,
          accessibility_note: "Use captions where available.",
          completed: true,
          target_date: null,
          status: "completed",
          notes: "Review weekly.",
          evidence_links: [
            { label: "Practice", url: "https://example.org/practice" },
          ],
          position: null,
        },
      ]) as QueryResult<T>;
    }
    if (sql.includes("SELECT id, career_id FROM roadmap_steps")) {
      return queryResult([
        { id: "roadmap_ai_python", career_id: "career_ai_engineer" },
      ]) as QueryResult<T>;
    }
    if (sql.includes("INSERT INTO roadmap_progress")) {
      return queryResult([]) as QueryResult<T>;
    }
    return queryResult([]) as QueryResult<T>;
  }

  release(): void {}
}

function poolFor(client: DatabaseClient): DatabasePool {
  return { connect: async () => client };
}

test("getRoadmap returns ordered steps with user-specific completion state", async () => {
  const response = await getRoadmap(
    "user_demo",
    "career_ai_engineer",
    poolFor(new RoadmapClient()),
  );
  assert.deepEqual(response, {
    careerId: "career_ai_engineer",
    steps: [
      {
        id: "roadmap_ai_python",
        title: "Strengthen Python",
        description: "Complete the Python practice module.",
        skill: "Python",
        order: 1,
        completed: false,
        estimatedEffortMinutes: 90,
        accessibilityNote: "Use the text-first path.",
        targetDate: null,
        status: "not_started",
        notes: "",
        evidenceLinks: [],
        position: 1,
      },
      {
        id: "roadmap_ai_ml",
        title: "Learn Machine Learning",
        description: "Study supervised learning fundamentals.",
        skill: "Machine Learning",
        order: 2,
        completed: true,
        estimatedEffortMinutes: 120,
        accessibilityNote: "Use captions where available.",
        targetDate: null,
        status: "completed",
        notes: "Review weekly.",
        evidenceLinks: [
          { label: "Practice", url: "https://example.org/practice" },
        ],
        position: 2,
      },
    ],
  });
});

test("updateRoadmapProgress persists only the authenticated user progress", async () => {
  const client = new RoadmapClient();
  const response = await updateRoadmapProgress(
    "user_demo",
    "roadmap_ai_python",
    true,
    poolFor(client),
  );
  assert.deepEqual(response, {
    stepId: "roadmap_ai_python",
    careerId: "career_ai_engineer",
    completed: true,
    targetDate: null,
    status: "completed",
    notes: "",
    evidenceLinks: [],
    position: null,
  });
  assert.ok(
    client.queries.some((query) =>
      query.includes("INSERT INTO roadmap_progress"),
    ),
  );
});

test("roadmap progress validator rejects unknown fields and non-boolean values", () => {
  assert.deepEqual(validateUpdateRoadmapProgressPayload({ completed: false }), {
    completed: false,
    targetDate: undefined,
    status: undefined,
    notes: undefined,
    evidenceLinks: undefined,
    position: undefined,
  });
  assert.deepEqual(
    validateUpdateRoadmapProgressPayload({
      completed: false,
      targetDate: "2026-09-01",
      status: "in_progress",
      notes: "Build a small practice project.",
      evidenceLinks: [
        { label: "Practice", url: "https://example.org/practice" },
      ],
      position: 2,
    }),
    {
      completed: false,
      targetDate: "2026-09-01",
      status: "in_progress",
      notes: "Build a small practice project.",
      evidenceLinks: [
        { label: "Practice", url: "https://example.org/practice" },
      ],
      position: 2,
    },
  );
  assert.throws(
    () => validateUpdateRoadmapProgressPayload({ completed: "true" }),
    /completed must be a boolean/,
  );
  assert.throws(
    () =>
      validateUpdateRoadmapProgressPayload({
        completed: true,
        userId: "other-user",
      }),
    /unsupported field/,
  );
});

test("updateRoadmapProgress rejects a missing roadmap step", async () => {
  const client: DatabaseClient = {
    async query<T extends QueryResultRow = QueryResultRow>(
      sql: string,
    ): Promise<QueryResult<T>> {
      if (sql.includes("SELECT id, career_id FROM roadmap_steps"))
        return queryResult([]) as QueryResult<T>;
      return queryResult([]) as QueryResult<T>;
    },
    release(): void {},
  };

  await assert.rejects(
    updateRoadmapProgress(
      "user_demo",
      "roadmap_unknown",
      true,
      poolFor(client),
    ),
    (error: Error & { statusCode?: number; code?: string }) =>
      error.statusCode === 404 && error.code === "roadmap_step_not_found",
  );
});

test("roadmap endpoints require bearer authentication", async () => {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    const getResponse = await fetch(
      `http://127.0.0.1:${address.port}/api/careers/career_ai_engineer/roadmap`,
    );
    assert.equal(getResponse.status, 401);
    const patchResponse = await fetch(
      `http://127.0.0.1:${address.port}/api/roadmap/roadmap_ai_python`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ completed: true }),
      },
    );
    assert.equal(patchResponse.status, 401);
    const reorderResponse = await fetch(
      `http://127.0.0.1:${address.port}/api/roadmap/roadmap_ai_python/reorder`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetPosition: 1 }),
      },
    );
    assert.equal(reorderResponse.status, 401);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("updateRoadmapProgress returns user-controlled execution metadata", async () => {
  const client: DatabaseClient = {
    async query<T extends QueryResultRow = QueryResultRow>(
      sql: string,
    ): Promise<QueryResult<T>> {
      if (sql.includes("SELECT id, career_id FROM roadmap_steps")) {
        return queryResult([
          { id: "roadmap_ai_python", career_id: "career_ai_engineer" },
        ]) as QueryResult<T>;
      }
      if (sql.includes("INSERT INTO roadmap_progress")) {
        return queryResult([
          {
            completed: false,
            target_date: "2026-09-01",
            status: "in_progress",
            notes: "Build a small practice project.",
            evidence_links: [
              { label: "Practice", url: "https://example.org/practice" },
            ],
            position: 2,
          },
        ]) as QueryResult<T>;
      }
      return queryResult([]) as QueryResult<T>;
    },
    release(): void {},
  };

  const response = await updateRoadmapProgress(
    "user_demo",
    "roadmap_ai_python",
    {
      completed: false,
      targetDate: "2026-09-01",
      status: "in_progress",
      notes: "Build a small practice project.",
      evidenceLinks: [
        { label: "Practice", url: "https://example.org/practice" },
      ],
      position: 2,
    },
    poolFor(client),
  );

  assert.deepEqual(response, {
    stepId: "roadmap_ai_python",
    careerId: "career_ai_engineer",
    completed: false,
    targetDate: "2026-09-01",
    status: "in_progress",
    notes: "Build a small practice project.",
    evidenceLinks: [{ label: "Practice", url: "https://example.org/practice" }],
    position: 2,
  });
  assert.deepEqual(validateReorderRoadmapPayload({ targetPosition: 2 }), {
    targetPosition: 2,
  });
  assert.throws(
    () =>
      validateUpdateRoadmapProgressPayload({
        completed: false,
        evidenceLinks: [{ label: "unsafe", url: "javascript:alert(1)" }],
      }),
    /absolute HTTP\(S\) URL/,
  );
  assert.throws(
    () => validateReorderRoadmapPayload({ targetPosition: 0 }),
    /positive integer/,
  );
});

class ReorderClient implements DatabaseClient {
  readonly queries: string[] = [];

  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
  ): Promise<QueryResult<T>> {
    this.queries.push(sql.trim());
    if (sql.includes("FROM roadmap_steps rs")) {
      return queryResult([
        {
          id: "roadmap_ai_python",
          career_id: "career_ai_engineer",
          display_order: 1,
          completed: false,
          target_date: null,
          status: "not_started",
          notes: "",
          evidence_links: [],
          position: 1,
        },
        {
          id: "roadmap_ai_ml",
          career_id: "career_ai_engineer",
          display_order: 2,
          completed: false,
          target_date: null,
          status: "not_started",
          notes: "",
          evidence_links: [],
          position: 2,
        },
        {
          id: "roadmap_ai_eval",
          career_id: "career_ai_engineer",
          display_order: 3,
          completed: true,
          target_date: null,
          status: "completed",
          notes: "",
          evidence_links: [],
          position: 3,
        },
      ]) as QueryResult<T>;
    }
    return queryResult([]) as QueryResult<T>;
  }

  release(): void {}
}

test("reorderRoadmapStep normalizes positions in one transaction", async () => {
  const client = new ReorderClient();
  const response = await reorderRoadmapStep(
    "user_demo",
    "roadmap_ai_python",
    3,
    poolFor(client),
  );

  assert.deepEqual(response, {
    careerId: "career_ai_engineer",
    positions: [
      { stepId: "roadmap_ai_ml", position: 1 },
      { stepId: "roadmap_ai_eval", position: 2 },
      { stepId: "roadmap_ai_python", position: 3 },
    ],
  });
  assert.equal(client.queries[0], "BEGIN");
  assert.equal(client.queries.at(-1), "COMMIT");
  assert.equal(
    client.queries.filter((query) =>
      query.includes("INSERT INTO roadmap_progress"),
    ).length,
    3,
  );
});
