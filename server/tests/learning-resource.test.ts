import assert from "node:assert/strict";
import test from "node:test";
import type { QueryResult, QueryResultRow } from "pg";
import type { DatabaseClient, DatabasePool } from "../src/db/types.js";
import { listLearningResources } from "../src/services/learning-resource.service.js";
import { validateLearningResourceQuery } from "../src/validators/learning-resource.js";

function queryResult<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return { rows, rowCount: rows.length, command: "SELECT", oid: 0, fields: [] };
}

class ResourceClient implements DatabaseClient {
  constructor(private readonly rows: QueryResultRow[]) {}

  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
  ): Promise<QueryResult<T>> {
    if (sql.includes("SELECT id FROM careers")) {
      return queryResult([{ id: "career_ai_engineer" }]) as QueryResult<T>;
    }
    return queryResult(this.rows as T[]);
  }

  release(): void {}
}

function poolFor(rows: QueryResultRow[]): DatabasePool {
  return { connect: async () => new ResourceClient(rows) };
}

test("resource query validation applies safe defaults and bounded filters", () => {
  assert.deepEqual(validateLearningResourceQuery({}), {
    languageCode: "en",
    limit: 20,
  });
  assert.deepEqual(
    validateLearningResourceQuery({
      skill: "  Python ",
      language: "es",
      limit: "5",
    }),
    { skill: "Python", languageCode: "es", limit: 5 },
  );
  assert.throws(
    () => validateLearningResourceQuery({ limit: "51" }),
    /between 1 and 50/,
  );
  assert.throws(
    () => validateLearningResourceQuery({ skill: " " }),
    /between 1 and 120/,
  );
});

test("resource service ranks the requested skill and maps provenance metadata", async () => {
  const result = await listLearningResources(
    "career_ai_engineer",
    { skill: "Python", languageCode: "en", limit: 10 },
    poolFor([
      {
        id: "resource_machine_learning",
        career_id: "career_ai_engineer",
        skill_id: "skill_machine_learning",
        skill_name: "Machine Learning",
        title: "ML Guide",
        description: "A guide.",
        url: "https://example.test/ml",
        provider: "Example",
        source_type: "catalog",
        resource_type: "guide",
        cost_model: "free",
        duration_minutes: "120",
        level: "intermediate",
        format: "reading",
        language_code: "en",
        accessibility: '{"textAlternative":true}',
        freshness_date: "2026-01-01",
        license_name: "CC BY",
        verified: true,
        display_order: 1,
      },
      {
        id: "resource_python",
        career_id: "career_ai_engineer",
        skill_id: "skill_python",
        skill_name: "Python",
        title: "Python Docs",
        description: "Reference.",
        url: "https://example.test/python",
        provider: "Example",
        source_type: "catalog",
        resource_type: "documentation",
        cost_model: "free",
        duration_minutes: null,
        level: "all",
        format: "reference",
        language_code: "en",
        accessibility: { keyboardFriendly: true },
        freshness_date: null,
        license_name: "PSF License",
        verified: true,
        display_order: 2,
      },
    ]),
  );

  assert.equal(result.resources[0]?.id, "resource_python");
  assert.equal(result.resources[0]?.rank, 1);
  assert.equal(result.resources[0]?.skillName, "Python");
  assert.equal(result.resources[0]?.sourceType, "catalog");
  assert.deepEqual(result.resources[0]?.accessibility, {
    keyboardFriendly: true,
  });
  assert.match(result.resources[0]?.rankingReason ?? "", /selected skill/);
  assert.equal(result.resources[1]?.rank, 2);
});

test("resource service returns a safe not-found error for an unknown career", async () => {
  const notFoundClient: DatabaseClient = {
    async query<T extends QueryResultRow = QueryResultRow>(
      _sql: string,
    ): Promise<QueryResult<T>> {
      return queryResult([]) as QueryResult<T>;
    },
    release(): void {},
  };
  await assert.rejects(
    listLearningResources(
      "career_missing",
      {},
      {
        connect: async () => notFoundClient,
      },
    ),
    (error: Error & { statusCode?: number; code?: string }) =>
      error.statusCode === 404 && error.code === "career_not_found",
  );
});
