import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import test from 'node:test';
import { app } from '../src/app.js';
import { pool } from '../src/db/pool.js';

const integrationEnabled = process.env.RUN_DB_INTEGRATION_TESTS === 'true';

test('real API contract flow works against PostgreSQL', { skip: !integrationEnabled }, async () => {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const baseUrl = `http://127.0.0.1:${address.port}/api`;
  const email = `integration-${Date.now()}@example.com`;
  const password = 'integration-password-123';

  async function closeServer(): Promise<void> {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }

  async function request(path: string, options: RequestInit = {}): Promise<{ response: Response; body: any }> {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        Origin: 'http://localhost:5173',
        ...(options.body ? { 'content-type': 'application/json' } : {}),
        ...(options.headers ?? {}),
      },
    });
    const body = await response.json();
    return { response, body };
  }

  try {
    const unauthenticated = await request('/recommendations');
    assert.equal(unauthenticated.response.status, 401);

    const registered = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Integration Student', email, password }),
    });
    assert.equal(registered.response.status, 201);
    assert.equal(registered.body.user.email, email);
    assert.equal(registered.response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    const token = registered.body.token as string;
    const authHeaders = { Authorization: `Bearer ${token}` };

    const profile = await request('/profile', { headers: authHeaders });
    assert.equal(profile.response.status, 200);
    assert.equal(profile.body.user.email, email);

    const profileUpdate = await request('/profile', {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ currentSkills: ['Python', 'APIs'], interests: ['machine learning'] }),
    });
    assert.equal(profileUpdate.response.status, 200);
    assert.deepEqual(profileUpdate.body.profile.currentSkills, ['Python', 'APIs']);

    const questions = await request('/assessment/questions', { headers: authHeaders });
    assert.equal(questions.response.status, 200);
    const answers = questions.body.questions.map((question: { id: string; options: Array<{ id: string }> }) => ({
      questionId: question.id,
      optionId: question.options[0].id,
    }));
    const submitted = await request('/assessment/submit', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ assessmentId: questions.body.assessmentId, answers }),
    });
    assert.equal(submitted.response.status, 200);
    assert.equal(typeof submitted.body.resultId, 'string');

    const result = await request(`/assessment/results/${submitted.body.resultId}`, { headers: authHeaders });
    assert.equal(result.response.status, 200);
    assert.equal(result.body.resultId, submitted.body.resultId);

    const recommendations = await request('/recommendations', { headers: authHeaders });
    assert.equal(recommendations.response.status, 200);
    const careerId = recommendations.body.recommendations[0].careerId as string;

    const publicCareer = await request(`/careers/${careerId}`);
    assert.equal(publicCareer.response.status, 200);
    assert.equal(publicCareer.body.id, careerId);

    const skillGapWithoutToken = await request(`/careers/${careerId}/skill-gap`);
    assert.equal(skillGapWithoutToken.response.status, 401);
    const skillGap = await request(`/careers/${careerId}/skill-gap`, { headers: authHeaders });
    assert.equal(skillGap.response.status, 200);
    assert.ok(skillGap.body.skills.every((skill: { status: string }) => ['matched', 'missing'].includes(skill.status)));

    const roadmap = await request(`/careers/${careerId}/roadmap`, { headers: authHeaders });
    assert.equal(roadmap.response.status, 200);
    if (roadmap.body.steps.length > 0) {
      const update = await request(`/roadmap/${roadmap.body.steps[0].id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ completed: true }),
      });
      assert.equal(update.response.status, 200);
      assert.equal(update.body.completed, true);
    }

    const advisor = await request('/advisor/chat', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ message: 'What should I learn next?', careerId }),
    });
    assert.equal(advisor.response.status, 200);
    assert.equal(typeof advisor.body.answer, 'string');
    assert.ok(advisor.body.answer.length > 0);

    const vr = await request('/vr/environments');
    assert.equal(vr.response.status, 200);
    assert.deepEqual(vr.body.environments.map((environment: { key: string }) => environment.key), [
      'ai-engineer-lab',
      'data-insights-studio',
    ]);
  } finally {
    await closeServer();
    await pool?.end();
  }
});
