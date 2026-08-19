import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { shouldRunMigration } from '../src/db/migration-policy.js';

test('production migration policy applies schema migrations but skips seed and catalog data by default', () => {
  assert.equal(shouldRunMigration('001_initial_schema', false), true);
  assert.equal(shouldRunMigration('002_career_catalog', false), false);
  assert.equal(shouldRunMigration('003_assessment_seed', false), false);
  assert.equal(shouldRunMigration('004_vr_mvp_catalog', false), false);
});

test('approved seed configuration enables catalog and seed migrations', () => {
  assert.equal(shouldRunMigration('002_career_catalog', true), true);
  assert.equal(shouldRunMigration('003_assessment_seed', true), true);
  assert.equal(shouldRunMigration('004_vr_mvp_catalog', true), true);
});

test('Render and Neon deployment templates keep credentials as private placeholders', () => {
  const renderManifest = readFileSync(new URL('../render.yaml', import.meta.url), 'utf8');
  const neonTemplate = readFileSync(new URL('../deployment/neon.env.example', import.meta.url), 'utf8');

  assert.match(renderManifest, /plan: free/);
  assert.match(renderManifest, /buildCommand: pnpm install --no-frozen-lockfile && pnpm --dir server build/);
  assert.doesNotMatch(renderManifest, /buildCommand: pnpm install --frozen-lockfile/);
  assert.match(renderManifest, /startCommand: pnpm --dir server db:migrate && pnpm --dir server start/);
  assert.doesNotMatch(renderManifest, /preDeployCommand:/);
  assert.match(renderManifest, /healthCheckPath: \/api\/health/);
  assert.match(renderManifest, /key: DATABASE_URL\n\s+sync: false/);
  assert.match(renderManifest, /key: RUN_SEED_DATA\n\s+value: "true"/);
  assert.match(neonTemplate, /DATABASE_URL=postgresql:\/\/USER:PASSWORD@HOST\/DATABASE\?sslmode=require/);
  assert.match(neonTemplate, /RUN_SEED_DATA=true/);
  assert.equal(neonTemplate.includes('DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require'), true);
});
