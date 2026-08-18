import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { app } from '../src/app.js';
import { chatAdvisor, type AdvisorProvider } from '../src/services/advisor.service.js';
import type { DatabaseClient, DatabasePool } from '../src/db/types.js';
import { validateAdvisorChatInput } from '../src/validators/advisor.js';

class FakeClient implements DatabaseClient {
  readonly queries: string[] = [];
  private conversationExists = false;

  async query<T>(text: string): Promise<{ rows: T[] }> {
    this.queries.push(text.trim().replace(/\s+/g, ' '));
    if (text.includes('FROM profiles')) {
      return { rows: [{ name: 'Asha', interests: ['ai'], current_skills: ['Python'], experience: 'Beginner', learning_preferences: 'Projects' }] as T[] };
    }
    if (text.includes('FROM assessment_results')) {
      return { rows: [{ category_scores: { career_ai_engineer: 9 }, top_career_ids: ['career_ai_engineer'] }] as T[] };
    }
    if (text.includes('FROM careers')) {
      return { rows: [{ id: 'career_ai_engineer', name: 'AI Engineer', description: 'Build intelligent systems.', skill_name: 'Machine Learning' }] as T[] };
    }
    if (text.includes('FROM roadmap_steps')) {
      return { rows: [{ title: 'Learn ML', skill: 'Machine Learning', completed: false }] as T[] };
    }
    if (text.includes('FROM conversations')) {
      return { rows: this.conversationExists ? [{ id: 'conversation_existing' }] as T[] : [] };
    }
    if (text.startsWith('INSERT INTO conversations')) {
      this.conversationExists = true;
    }
    return { rows: [] as T[] };
  }

  release(): void {}
}

class FakePool implements DatabasePool {
  constructor(readonly client = new FakeClient()) {}

  async connect(): Promise<DatabaseClient> {
    return this.client;
  }
}

class RecordingProvider implements AdvisorProvider {
  prompt = '';

  async generate(prompt: string): Promise<string> {
    this.prompt = prompt;
    return 'Use a small machine-learning project to build confidence.';
  }
}

class FailingProvider implements AdvisorProvider {
  async generate(): Promise<string> {
    throw new Error('local Ollama is unavailable');
  }
}

test('advisor enriches the local provider prompt with profile, assessment, career, skill gap, and roadmap context', async () => {
  const database = new FakePool();
  const provider = new RecordingProvider();
  const response = await chatAdvisor(
    'user_asha',
    { message: 'What should I learn first?', careerId: 'career_ai_engineer' },
    database,
    provider,
  );

  assert.equal(response.conversationId.startsWith('conversation_'), true);
  assert.equal(response.sources.length, 0);
  assert.equal(response.answer, 'Use a small machine-learning project to build confidence.');
  assert.match(provider.prompt, /Asha/);
  assert.match(provider.prompt, /career_ai_engineer/);
  assert.match(provider.prompt, /Machine Learning/);
  assert.match(provider.prompt, /Learn ML/);
  assert.match(provider.prompt, /Missing skills/);
  assert.ok(database.client.queries.some((query) => query.includes('INSERT INTO messages')));
});

test('advisor returns deterministic fallback text when local Ollama fails', async () => {
  const response = await chatAdvisor(
    'user_asha',
    { message: 'How do I start?', careerId: 'career_ai_engineer' },
    new FakePool(),
    new FailingProvider(),
  );

  assert.match(response.answer, /I can help you plan your next career step/);
  assert.match(response.answer, /Machine Learning/);
});

test('advisor rejects a conversation owned by another user', async () => {
  const database = new FakePool();
  await assert.rejects(
    () => chatAdvisor('user_asha', {
      message: 'Continue our plan',
      conversationId: 'conversation_existing',
    }, database, new RecordingProvider()),
    (error: unknown) => error instanceof Error && error.message === 'The conversation does not exist.',
  );
});

test('advisor validator rejects unsupported fields and oversized messages', () => {
  assert.throws(
    () => validateAdvisorChatInput({ message: 'Valid question', unsupported: true }),
    /unsupported field/,
  );
  assert.throws(
    () => validateAdvisorChatInput({ message: 'x'.repeat(2001) }),
    /between 3 and 2000 characters/,
  );
});

test('advisor endpoint requires bearer authentication', async () => {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/advisor/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'How should I start?' }),
    });
    assert.equal(response.status, 401);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
