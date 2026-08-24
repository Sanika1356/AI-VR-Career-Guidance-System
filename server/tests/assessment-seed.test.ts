import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = new URL(
  "../src/db/migrations/003_assessment_seed.sql",
  import.meta.url,
);

test("assessment seed migration contains ordered questions, options, and server-side scoring", async () => {
  const sql = await readFile(migrationPath, "utf8");
  for (const questionId of [
    "question_1",
    "question_2",
    "question_3",
    "question_4",
    "question_5",
  ]) {
    assert.ok(
      sql.includes(`'${questionId}'`),
      `missing seed question ${questionId}`,
    );
  }
  assert.ok(sql.includes("INSERT INTO assessment_options"));
  assert.ok(sql.includes('"career_ai_engineer"'));
  assert.ok(sql.includes("ON CONFLICT (id) DO UPDATE"));
});

test("public assessment question query does not select internal scoring JSON", async () => {
  const servicePath = new URL(
    "../src/services/assessment.service.ts",
    import.meta.url,
  );
  const source = await readFile(servicePath, "utf8");
  const questionStart = source.indexOf("aq.id AS question_id");
  const questionEnd = source.indexOf(
    'await client.query("COMMIT")',
    questionStart,
  );
  assert.ok(questionStart >= 0);
  assert.ok(questionEnd > questionStart);
  const questionQuery = source.slice(questionStart, questionEnd);
  assert.equal(questionQuery.includes("scoring"), false);
});
