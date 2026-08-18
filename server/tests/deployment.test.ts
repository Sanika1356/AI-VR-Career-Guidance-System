import assert from 'node:assert/strict';
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
