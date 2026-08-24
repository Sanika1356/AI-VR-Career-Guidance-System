import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const migrationPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../src/db/migrations/001_initial_schema.sql",
);
const auditMigrationPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../src/db/migrations/006_audit_events.sql",
);
const ontologyMigrationPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../src/db/migrations/007_catalog_ontology.sql",
);
const metadataMigrationPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../src/db/migrations/008_catalog_metadata.sql",
);

const requiredTables = [
  "users",
  "profiles",
  "skills",
  "careers",
  "career_skills",
  "assessment_questions",
  "assessment_options",
  "assessments",
  "assessment_answers",
  "assessment_results",
  "recommendations",
  "roadmap_steps",
  "roadmap_progress",
  "conversations",
  "messages",
  "vr_environments",
];

test("initial migration contains the approved core tables and ownership constraints", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const table of requiredTables) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`));
  }

  assert.match(sql, /users \(\n[\s\S]*email TEXT NOT NULL UNIQUE/);
  assert.match(
    sql,
    /profiles \(\n[\s\S]*REFERENCES users\(id\) ON DELETE CASCADE/,
  );
  assert.match(
    sql,
    /assessment_results \(\n[\s\S]*REFERENCES users\(id\) ON DELETE CASCADE/,
  );
  assert.match(
    sql,
    /roadmap_progress \(\n[\s\S]*PRIMARY KEY \(user_id, step_id\)/,
  );
});

test("audit migration stores redacted event metadata and retains deletion evidence", async () => {
  const sql = await readFile(auditMigrationPath, "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS audit_events/);
  assert.match(sql, /user_id TEXT REFERENCES users\(id\) ON DELETE SET NULL/);
  assert.match(sql, /request_id TEXT/);
  assert.match(sql, /metadata JSONB NOT NULL/);
  for (const eventType of [
    "auth_register_success",
    "auth_login_success",
    "privacy_consent_changed",
    "profile_changed",
    "recommendation_generated",
    "advisor_requested",
    "data_exported",
    "account_deleted",
  ]) {
    assert.match(sql, new RegExp(`'${eventType}'`));
  }
  assert.doesNotMatch(sql, /password_hash|bearer|raw_prompt|raw_answer/);
});

test("catalog migrations add versioned ontology metadata without changing core entities", async () => {
  const ontologySql = await readFile(ontologyMigrationPath, "utf8");
  const metadataSql = await readFile(metadataMigrationPath, "utf8");
  for (const column of [
    "domain",
    "aliases",
    "source_references",
    "ontology_version",
  ]) {
    assert.match(ontologySql, new RegExp(column));
  }
  for (const column of [
    "education_pathways",
    "proficiency_levels",
    "related_skills",
  ]) {
    assert.match(metadataSql, new RegExp(column));
  }
  assert.match(ontologySql, /local-mvp-v1/);
});
