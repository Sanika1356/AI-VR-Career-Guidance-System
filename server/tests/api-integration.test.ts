import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import test from 'node:test';
import { app } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { env } from '../src/config/env.js';
import { createAccessToken } from '../src/utils/token.js';

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

  async function multipartRequest(
    path: string,
    formData: FormData,
    headers: Record<string, string> = {},
  ): Promise<{ response: Response; body: any }> {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      body: formData,
      headers: { Origin: 'http://localhost:5173', ...headers },
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

    const unauthenticatedPuter = await request('/resume/analyses/puter', {
      method: 'POST',
      body: JSON.stringify({
        fileName: 'resume.pdf',
        companyName: 'Example Co',
        jobRole: 'Data Analyst',
        analysis: {
          overallScore: 82,
          matchingSkills: ['Python', 'SQL'],
          missingSkills: ['Power BI'],
          strengths: ['Relevant project evidence'],
          improvements: ['Add measurable outcomes'],
          recommendations: ['Document a dashboard project'],
          summary: 'A strong evidence-based match.',
        },
      }),
    });
    assert.equal(unauthenticatedPuter.response.status, 401);

    const puterReport = await request('/resume/analyses/puter', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        fileName: 'resume.pdf',
        companyName: 'Example Co',
        jobRole: 'Data Analyst',
        analysis: {
          overallScore: 82,
          matchingSkills: ['Python', 'SQL'],
          missingSkills: ['Power BI'],
          strengths: ['Relevant project evidence'],
          improvements: ['Add measurable outcomes'],
          recommendations: ['Document a dashboard project'],
          summary: 'A strong evidence-based match.',
          provider: 'gemini',
        },
      }),
    });
    assert.equal(puterReport.response.status, 200);
    assert.equal(puterReport.body.analysis.provider, 'puter');
    assert.equal(puterReport.body.fileName, 'resume.pdf');

    const malformedPuter = await request('/resume/analyses/puter', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        fileName: 'resume.pdf',
        companyName: 'Example Co',
        jobRole: 'Data Analyst',
        analysis: { overallScore: 82 },
      }),
    });
    assert.equal(malformedPuter.response.status, 502);
    assert.equal(malformedPuter.body.error, 'resume_analysis_invalid_response');

    const resumeHistory = await request('/resume/analyses', { headers: authHeaders });
    assert.equal(resumeHistory.response.status, 200);
    assert.ok(resumeHistory.body.analyses.some((item: { id: string }) => item.id === puterReport.body.analysisId));

    const unauthenticatedResume = new FormData();
    unauthenticatedResume.append('companyName', 'Example Co');
    unauthenticatedResume.append('jobRole', 'Data Analyst');
    unauthenticatedResume.append('jobDescription', 'Analyze data and communicate findings.');
    unauthenticatedResume.append('resume', new Blob(['%PDF-1.4'], { type: 'application/pdf' }), 'resume.pdf');
    const resumeWithoutAuth = await multipartRequest('/resume/analyze', unauthenticatedResume);
    assert.equal(resumeWithoutAuth.response.status, 401);

    const invalidResume = new FormData();
    invalidResume.append('companyName', 'Example Co');
    invalidResume.append('jobRole', 'Data Analyst');
    invalidResume.append('jobDescription', 'Analyze data and communicate findings.');
    invalidResume.append('resume', new Blob(['not a pdf'], { type: 'text/plain' }), 'resume.txt');
    const invalidResumeResponse = await multipartRequest('/resume/analyze', invalidResume, authHeaders);
    assert.equal(invalidResumeResponse.response.status, 415);
    assert.equal(invalidResumeResponse.body.error, 'resume_pdf_required');

    const oversizedResume = new FormData();
    oversizedResume.append('companyName', 'Example Co');
    oversizedResume.append('jobRole', 'Data Analyst');
    oversizedResume.append('jobDescription', 'Analyze data and communicate findings.');
    oversizedResume.append(
      'resume',
      new Blob([new Uint8Array(8 * 1024 * 1024 + 1)], { type: 'application/pdf' }),
      'resume.pdf',
    );
    const oversizedResumeResponse = await multipartRequest('/resume/analyze', oversizedResume, authHeaders);
    assert.equal(oversizedResumeResponse.response.status, 413);
    assert.equal(oversizedResumeResponse.body.error, 'resume_file_too_large');

    const login = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    assert.equal(login.response.status, 200);
    assert.equal(login.body.user.email, email);
    assert.equal(typeof login.body.token, 'string');

    const invalidLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'incorrect-password' }),
    });
    assert.equal(invalidLogin.response.status, 401);

    const preflight = await fetch(`${baseUrl}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization',
      },
    });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), 'http://localhost:5173');

    const expiredToken = createAccessToken(
      'user_missing',
      Math.floor(Date.now() / 1000) - env.tokenExpirySeconds - 60,
    );
    const expiredProfile = await request('/profile', {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert.equal(expiredProfile.response.status, 401);

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

    const unauthenticatedQuestions = await request('/assessment/questions');
    assert.equal(unauthenticatedQuestions.response.status, 401);

    const questions = await request('/assessment/questions', { headers: authHeaders });
    assert.equal(questions.response.status, 200);
    const invalidSubmission = await request('/assessment/submit', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ assessmentId: 'assessment_invalid', answers: [] }),
    });
    assert.equal(invalidSubmission.response.status, 400);
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

    const missingResult = await request('/assessment/results/result_missing_for_integration', { headers: authHeaders });
    assert.equal(missingResult.response.status, 404);

    const recommendations = await request('/recommendations', { headers: authHeaders });
    assert.equal(recommendations.response.status, 200);
    const careerId = recommendations.body.recommendations[0].careerId as string;

    const publicCareer = await request(`/careers/${careerId}`);
    assert.equal(publicCareer.response.status, 200);
    assert.equal(publicCareer.body.id, careerId);

    const missingCareer = await request('/careers/career_missing_for_integration');
    assert.equal(missingCareer.response.status, 404);

    const skillGapWithoutToken = await request(`/careers/${careerId}/skill-gap`);
    assert.equal(skillGapWithoutToken.response.status, 401);
    const skillGap = await request(`/careers/${careerId}/skill-gap`, { headers: authHeaders });
    assert.equal(skillGap.response.status, 200);
    assert.ok(skillGap.body.skills.every((skill: { status: string }) => ['matched', 'missing'].includes(skill.status)));

    const missingSkillGap = await request('/careers/career_missing_for_integration/skill-gap', { headers: authHeaders });
    assert.equal(missingSkillGap.response.status, 404);

    const roadmap = await request(`/careers/${careerId}/roadmap`, { headers: authHeaders });
    assert.equal(roadmap.response.status, 200);
    const missingRoadmap = await request('/careers/career_missing_for_integration/roadmap', { headers: authHeaders });
    assert.equal(missingRoadmap.response.status, 404);
    if (roadmap.body.steps.length > 0) {
      assert.ok(roadmap.body.steps.every((step: { order: number }, index: number, steps: Array<{ order: number }>) => (
        index === 0 || steps[index - 1].order <= step.order
      )));
      const invalidUpdate = await request(`/roadmap/${roadmap.body.steps[0].id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ completed: 'true' }),
      });
      assert.equal(invalidUpdate.response.status, 400);
      assert.equal(invalidUpdate.body.error, 'validation_error');

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

    const privacyDefaults = await request('/privacy/consent', { headers: authHeaders });
    assert.equal(privacyDefaults.response.status, 200);
    assert.equal(privacyDefaults.body.consent.analytics, false);
    assert.equal(privacyDefaults.body.consent.personalizedAi, false);

    const privacyUpdated = await request('/privacy/consent', {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ analytics: true, personalizedAi: true, vrTelemetry: false }),
    });
    assert.equal(privacyUpdated.response.status, 200);
    assert.equal(privacyUpdated.body.consent.analytics, true);
    assert.equal(privacyUpdated.body.consent.personalizedAi, true);

    const exportedData = await request('/privacy/export', { headers: authHeaders });
    assert.equal(exportedData.response.status, 200);
    assert.equal(exportedData.body.user.email, email);
    assert.equal(typeof exportedData.body.exportedAt, 'string');
    assert.equal('passwordHash' in exportedData.body, false);
    assert.equal('token' in exportedData.body, false);

    const deletedAccount = await request('/privacy/account', {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert.equal(deletedAccount.response.status, 200);
    assert.deepEqual(deletedAccount.body.deleted, true);
    assert.equal(deletedAccount.body.userId, registered.body.user.id);

    const exportedAfterDeletion = await request('/privacy/export', { headers: authHeaders });
    assert.equal(exportedAfterDeletion.response.status, 404);
    assert.equal(exportedAfterDeletion.body.error, 'account_not_found');
  } finally {
    await closeServer();
    await pool?.end();
  }
});
