import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const migrationPath = join(dirname(fileURLToPath(import.meta.url)), '../src/db/migrations/001_initial_schema.sql');

const requiredTables = [
  'users',
  'profiles',
  'skills',
  'careers',
  'career_skills',
  'assessment_questions',
  'assessment_options',
  'assessments',
  'assessment_answers',
  'assessment_results',
  'recommendations',
  'roadmap_steps',
  'roadmap_progress',
  'conversations',
  'messages',
  'vr_environments',
];

test('initial migration contains the approved core tables and ownership constraints', async () => {
  const sql = await readFile(migrationPath, 'utf8');

  for (const table of requiredTables) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`));
  }

  assert.match(sql, /users \(\n[\s\S]*email TEXT NOT NULL UNIQUE/);
  assert.match(sql, /profiles \(\n[\s\S]*REFERENCES users\(id\) ON DELETE CASCADE/);
  assert.match(sql, /assessment_results \(\n[\s\S]*REFERENCES users\(id\) ON DELETE CASCADE/);
  assert.match(sql, /roadmap_progress \(\n[\s\S]*PRIMARY KEY \(user_id, step_id\)/);
});
