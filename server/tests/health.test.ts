import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import express from 'express';
import test from 'node:test';
import { app } from '../src/app.js';
import { errorHandler } from '../src/middleware/error-handler.js';

test('GET /api/health returns the documented service status', async () => {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      status: 'ok',
      service: 'career-guidance-api',
    });
    assert.ok(response.headers.get('x-request-id'));
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    assert.equal(response.headers.get('permissions-policy'), 'camera=(), microphone=(), geolocation=(), payment=()');
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('unknown API routes return a safe not-found response', async () => {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/does-not-exist`);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).error, 'not_found');
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('generic server failures use a safe error envelope without exposing internal details', async () => {
  const testApp = express();
  testApp.get('/boom', () => {
    throw new Error('private database connection detail');
  });
  testApp.use(errorHandler);

  const server = createServer(testApp);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/boom`);
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      error: 'internal_server_error',
      message: 'An unexpected server error occurred.',
    });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
