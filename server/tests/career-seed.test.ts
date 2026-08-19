import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationPath = new URL('../src/db/migrations/002_career_catalog.sql', import.meta.url);

test('career catalog migration contains the approved free local seed data', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  for (const careerId of [
    'career_ai_engineer',
    'career_data_analyst',
    'career_ux_researcher',
    'career_product_designer',
    'career_cybersecurity_analyst',
  ]) {
    assert.ok(sql.includes(`'${careerId}'`), `missing seed career ${careerId}`);
  }
  assert.ok(sql.includes('ADD COLUMN IF NOT EXISTS learning_resources'));
  assert.ok(sql.includes("'free':true") || sql.includes('"free":true'));
  assert.ok(sql.includes('INSERT INTO vr_environments'));
  assert.ok(sql.includes('INSERT INTO roadmap_steps'));
  assert.ok(sql.includes('ON CONFLICT (id) DO UPDATE'));
});
