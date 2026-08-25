import "dotenv/config";

function numberFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function booleanFromEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === "true";
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const authSecret =
  process.env.AUTH_SECRET ?? "development-only-change-me-please-32-chars";

if (nodeEnv === "production" && !process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET must be configured in production");
}

export const env = {
  nodeEnv,
  port: numberFromEnv(process.env.PORT ?? process.env.SERVER_PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  requestBodyLimitBytes: Math.max(
    1_024,
    Math.floor(numberFromEnv(process.env.REQUEST_BODY_LIMIT_BYTES, 1_000_000)),
  ),
  aiAdvisorEnabled: booleanFromEnv(process.env.AI_ADVISOR_ENABLED, true),
  externalCareerDataEnabled: booleanFromEnv(
    process.env.EXTERNAL_CAREER_DATA_ENABLED,
    false,
  ),
  webXrEnabled: booleanFromEnv(process.env.WEBXR_ENABLED, false),
  databaseUrl: process.env.DATABASE_URL,
  dbPoolMin: numberFromEnv(process.env.DB_POOL_MIN, 1),
  dbPoolMax: numberFromEnv(process.env.DB_POOL_MAX, 10),
  authSecret,
  tokenExpirySeconds: numberFromEnv(process.env.TOKEN_EXPIRY_SECONDS, 86_400),
  ollamaEnabled: booleanFromEnv(
    process.env.OLLAMA_ENABLED,
    nodeEnv !== "production",
  ),
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  ollamaModel: process.env.OLLAMA_MODEL ?? "llama3.2:3b",
  aiRequestTimeoutMs: numberFromEnv(process.env.AI_REQUEST_TIMEOUT_MS, 30_000),
  aiMaxResponseChars: Math.max(
    200,
    Math.floor(numberFromEnv(process.env.AI_MAX_RESPONSE_CHARS, 4_000)),
  ),
  aiRetryAttempts: Math.min(
    2,
    Math.max(0, Math.floor(numberFromEnv(process.env.AI_RETRY_ATTEMPTS, 1))),
  ),
  aiCircuitFailureThreshold: Math.max(
    1,
    Math.floor(numberFromEnv(process.env.AI_CIRCUIT_FAILURE_THRESHOLD, 3)),
  ),
  aiCircuitCooldownMs: Math.max(
    1_000,
    Math.floor(numberFromEnv(process.env.AI_CIRCUIT_COOLDOWN_MS, 30_000)),
  ),
  metricsWindowMs: Math.max(
    60_000,
    numberFromEnv(process.env.METRICS_WINDOW_MS, 300_000),
  ),
  metricsAlertMinSamples: Math.max(
    1,
    Math.floor(numberFromEnv(process.env.METRICS_ALERT_MIN_SAMPLES, 10)),
  ),
  apiErrorRateAlertThreshold: Math.min(
    1,
    Math.max(0, numberFromEnv(process.env.API_ERROR_RATE_ALERT_THRESHOLD, 0.2)),
  ),
  aiFailureRateAlertThreshold: Math.min(
    1,
    Math.max(
      0,
      numberFromEnv(process.env.AI_FAILURE_RATE_ALERT_THRESHOLD, 0.3),
    ),
  ),
  authRateLimitWindowMs: numberFromEnv(
    process.env.AUTH_RATE_LIMIT_WINDOW_MS,
    60_000,
  ),
  authRateLimitMax: numberFromEnv(process.env.AUTH_RATE_LIMIT_MAX, 10),
  aiRateLimitWindowMs: numberFromEnv(
    process.env.AI_RATE_LIMIT_WINDOW_MS,
    60_000,
  ),
  aiRateLimitMax: numberFromEnv(process.env.AI_RATE_LIMIT_MAX, 20),
  catalogRateLimitWindowMs: numberFromEnv(
    process.env.CATALOG_RATE_LIMIT_WINDOW_MS,
    60_000,
  ),
  catalogRateLimitMax: numberFromEnv(process.env.CATALOG_RATE_LIMIT_MAX, 60),
  runSeedData:
    process.env.RUN_SEED_DATA === "true" ||
    (nodeEnv !== "production" && process.env.RUN_SEED_DATA !== "false"),
};
