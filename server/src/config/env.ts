import 'dotenv/config';

function numberFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const authSecret = process.env.AUTH_SECRET ?? 'development-only-change-me-please-32-chars';

if (nodeEnv === 'production' && !process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET must be configured in production');
}

export const env = {
  nodeEnv,
  port: numberFromEnv(process.env.SERVER_PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  dbPoolMin: numberFromEnv(process.env.DB_POOL_MIN, 1),
  dbPoolMax: numberFromEnv(process.env.DB_POOL_MAX, 10),
  authSecret,
  tokenExpirySeconds: numberFromEnv(process.env.TOKEN_EXPIRY_SECONDS, 86_400),
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL ?? 'llama3.2:3b',
  aiRequestTimeoutMs: numberFromEnv(process.env.AI_REQUEST_TIMEOUT_MS, 30_000),
  authRateLimitWindowMs: numberFromEnv(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 60_000),
  authRateLimitMax: numberFromEnv(process.env.AUTH_RATE_LIMIT_MAX, 10),
  aiRateLimitWindowMs: numberFromEnv(process.env.AI_RATE_LIMIT_WINDOW_MS, 60_000),
  aiRateLimitMax: numberFromEnv(process.env.AI_RATE_LIMIT_MAX, 20),
  runSeedData: process.env.RUN_SEED_DATA === 'true' || (nodeEnv !== 'production' && process.env.RUN_SEED_DATA !== 'false'),
};
