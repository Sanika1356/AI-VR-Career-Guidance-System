import assert from 'node:assert/strict';
import test from 'node:test';
import { hashPassword, verifyPassword } from '../src/utils/password.js';
import { createAccessToken, verifyAccessToken } from '../src/utils/token.js';

test('password hashes verify without storing the raw password', async () => {
  const password = 'correct horse battery staple';
  const storedHash = await hashPassword(password);

  assert.notEqual(storedHash, password);
  assert.equal(await verifyPassword(password, storedHash), true);
  assert.equal(await verifyPassword('incorrect password', storedHash), false);
});

test('access tokens verify and expose the user subject', () => {
  const issuedAt = 1_700_000_000;
  const token = createAccessToken('user_demo', issuedAt);
  const payload = verifyAccessToken(token, issuedAt + 1);

  assert.equal(payload?.sub, 'user_demo');
  assert.equal(payload?.iat, issuedAt);
});

test('expired and tampered access tokens are rejected', () => {
  const issuedAt = 1_700_000_000;
  const token = createAccessToken('user_demo', issuedAt);

  assert.equal(verifyAccessToken(token, issuedAt + 86_401), null);
  assert.equal(verifyAccessToken(`${token}tampered`, issuedAt + 1), null);
});
