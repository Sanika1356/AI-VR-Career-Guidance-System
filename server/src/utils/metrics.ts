import { env } from "../config/env.js";

interface MetricsState {
  windowStartedAt: number;
  apiRequests: number;
  apiErrors: number;
  apiLatencyTotalMs: number;
  apiLatencyMaxMs: number;
  rateLimitExceeded: Record<string, number>;
  aiRequests: number;
  aiFailures: number;
  aiFallbacks: number;
  aiLatencyTotalMs: number;
  aiLatencyMaxMs: number;
  emittedAlerts: Set<string>;
}

const state: MetricsState = {
  windowStartedAt: Date.now(),
  apiRequests: 0,
  apiErrors: 0,
  apiLatencyTotalMs: 0,
  apiLatencyMaxMs: 0,
  rateLimitExceeded: {},
  aiRequests: 0,
  aiFailures: 0,
  aiFallbacks: 0,
  aiLatencyTotalMs: 0,
  aiLatencyMaxMs: 0,
  emittedAlerts: new Set(),
};

function resetExpiredWindow(now: number): void {
  if (now - state.windowStartedAt < env.metricsWindowMs) return;
  state.windowStartedAt = now;
  state.apiRequests = 0;
  state.apiErrors = 0;
  state.apiLatencyTotalMs = 0;
  state.apiLatencyMaxMs = 0;
  state.rateLimitExceeded = {};
  state.aiRequests = 0;
  state.aiFailures = 0;
  state.aiFallbacks = 0;
  state.aiLatencyTotalMs = 0;
  state.aiLatencyMaxMs = 0;
  state.emittedAlerts.clear();
}

function emitAlertOnce(
  metric: string,
  value: number,
  threshold: number,
  sampleSize: number,
): void {
  if (state.emittedAlerts.has(metric)) return;
  state.emittedAlerts.add(metric);
  console.warn(
    JSON.stringify({
      event: "observability_alert_threshold_exceeded",
      metric,
      value: Number(value.toFixed(4)),
      threshold,
      sampleSize,
    }),
  );
}

export function observeApiRequest(
  statusCode: number,
  durationMs: number,
): void {
  const now = Date.now();
  resetExpiredWindow(now);
  state.apiRequests += 1;
  state.apiLatencyTotalMs += Math.max(0, durationMs);
  state.apiLatencyMaxMs = Math.max(state.apiLatencyMaxMs, durationMs);
  if (statusCode >= 500) state.apiErrors += 1;
  if (state.apiRequests >= env.metricsAlertMinSamples) {
    const errorRate = state.apiErrors / state.apiRequests;
    if (errorRate >= env.apiErrorRateAlertThreshold) {
      emitAlertOnce(
        "api_error_rate",
        errorRate,
        env.apiErrorRateAlertThreshold,
        state.apiRequests,
      );
    }
  }
}

export function observeRateLimitExceeded(name: string): void {
  const now = Date.now();
  resetExpiredWindow(now);
  state.rateLimitExceeded[name] = (state.rateLimitExceeded[name] ?? 0) + 1;
}

export function observeAiRequest(result: {
  success: boolean;
  fallback: boolean;
  durationMs: number;
}): void {
  const now = Date.now();
  resetExpiredWindow(now);
  state.aiRequests += 1;
  if (!result.success) state.aiFailures += 1;
  if (result.fallback) state.aiFallbacks += 1;
  state.aiLatencyTotalMs += Math.max(0, result.durationMs);
  state.aiLatencyMaxMs = Math.max(state.aiLatencyMaxMs, result.durationMs);
  if (state.aiRequests >= env.metricsAlertMinSamples) {
    const failureRate = state.aiFailures / state.aiRequests;
    if (failureRate >= env.aiFailureRateAlertThreshold) {
      emitAlertOnce(
        "ai_failure_rate",
        failureRate,
        env.aiFailureRateAlertThreshold,
        state.aiRequests,
      );
    }
  }
}

export function getMetricsSnapshot(): {
  windowStartedAt: string;
  api: {
    requests: number;
    errors: number;
    errorRate: number;
    averageLatencyMs: number;
    maxLatencyMs: number;
  };
  rateLimitExceeded: Record<string, number>;
  ai: {
    requests: number;
    failures: number;
    failureRate: number;
    fallbacks: number;
    averageLatencyMs: number;
    maxLatencyMs: number;
  };
} {
  const now = Date.now();
  resetExpiredWindow(now);
  return {
    windowStartedAt: new Date(state.windowStartedAt).toISOString(),
    api: {
      requests: state.apiRequests,
      errors: state.apiErrors,
      errorRate:
        state.apiRequests === 0 ? 0 : state.apiErrors / state.apiRequests,
      averageLatencyMs:
        state.apiRequests === 0
          ? 0
          : state.apiLatencyTotalMs / state.apiRequests,
      maxLatencyMs: state.apiLatencyMaxMs,
    },
    rateLimitExceeded: { ...state.rateLimitExceeded },
    ai: {
      requests: state.aiRequests,
      failures: state.aiFailures,
      failureRate:
        state.aiRequests === 0 ? 0 : state.aiFailures / state.aiRequests,
      fallbacks: state.aiFallbacks,
      averageLatencyMs:
        state.aiRequests === 0 ? 0 : state.aiLatencyTotalMs / state.aiRequests,
      maxLatencyMs: state.aiLatencyMaxMs,
    },
  };
}

export function resetMetricsForTests(): void {
  state.windowStartedAt = Date.now();
  state.apiRequests = 0;
  state.apiErrors = 0;
  state.apiLatencyTotalMs = 0;
  state.apiLatencyMaxMs = 0;
  state.rateLimitExceeded = {};
  state.aiRequests = 0;
  state.aiFailures = 0;
  state.aiFallbacks = 0;
  state.aiLatencyTotalMs = 0;
  state.aiLatencyMaxMs = 0;
  state.emittedAlerts.clear();
}
