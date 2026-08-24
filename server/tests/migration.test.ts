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
const assessmentMetadataMigrationPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../src/db/migrations/009_assessment_question_metadata.sql",
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

test("assessment metadata migration is versioned and reviewable without exposing new fields", async () => {
  const sql = await readFile(assessmentMetadataMigrationPath, "utf8");
  for (const column of [
    "question_version",
    "domain",
    "competency",
    "difficulty",
    "rationale",
    "accessibility_text",
    "review_status",
  ]) {
    assert.match(sql, new RegExp(column));
  }
  assert.match(sql, /published THEN 'approved'/);
  assert.match(
    sql,
    /CREATE INDEX IF NOT EXISTS idx_assessment_questions_domain/,
  );
});

const learningResourcesMigrationPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../src/db/migrations/016_learning_resources.sql",
);

test("learning-resource migration stores provenance metadata and idempotent authored seeds", async () => {
  const sql = await readFile(learningResourcesMigrationPath, "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS learning_resources/);
  for (const column of [
    "career_id",
    "skill_id",
    "source_type",
    "cost_model",
    "duration_minutes",
    "language_code",
    "accessibility",
    "freshness_date",
    "license_name",
    "verified",
  ]) {
    assert.match(sql, new RegExp(column));
  }
  assert.match(sql, /source_type IN \('catalog', 'ai-suggestion'\)/);
  assert.match(sql, /UNIQUE \(career_id, url\)/);
  assert.match(sql, /ON CONFLICT \(id\) DO UPDATE SET/);
  assert.match(sql, /'resource_ai_python_docs'/);
  assert.match(sql, /'resource_data_postgres_docs'/);
  assert.match(sql, /'catalog'/);
});

const roadmapActivityMigrationPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../src/db/migrations/017_roadmap_activity_events.sql",
);

test("roadmap activity migration records dated owned events for streaks", async () => {
  const sql = await readFile(roadmapActivityMigrationPath, "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS roadmap_progress_events/);
  assert.match(
    sql,
    /user_id TEXT NOT NULL REFERENCES users\(id\) ON DELETE CASCADE/,
  );
  assert.match(
    sql,
    /step_id TEXT NOT NULL REFERENCES roadmap_steps\(id\) ON DELETE CASCADE/,
  );
  assert.match(sql, /activity_date DATE NOT NULL/);
  assert.match(sql, /occurred_at TIMESTAMPTZ NOT NULL/);
  assert.match(sql, /idx_roadmap_progress_events_user_date/);
  assert.match(sql, /status IN \('not_started', 'in_progress', 'completed'\)/);
});

const roadmapEvidenceMigrationPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../src/db/migrations/018_roadmap_evidence_links.sql",
);

test("roadmap evidence migration adds bounded user-owned links", async () => {
  const sql = await readFile(roadmapEvidenceMigrationPath, "utf8");
  assert.match(sql, /ALTER TABLE roadmap_progress/);
  assert.match(
    sql,
    /ADD COLUMN IF NOT EXISTS evidence_links JSONB NOT NULL DEFAULT '\[\]'::jsonb/,
  );
  assert.match(sql, /roadmap_progress_evidence_links_array/);
  assert.match(sql, /jsonb_typeof\(evidence_links\) = 'array'/);
  assert.match(sql, /jsonb_array_length\(evidence_links\) <= 10/);
});
