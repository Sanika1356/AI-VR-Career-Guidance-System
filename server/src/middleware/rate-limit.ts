import type { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "../utils/app-error.js";
import { observeRateLimitExceeded } from "../utils/metrics.js";

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  name?: string;
  keyGenerator?: (request: Request) => string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: RateLimitOptions): RequestHandler {
  const buckets = new Map<string, Bucket>();
  const keyGenerator =
    options.keyGenerator ?? ((request: Request) => request.ip || "unknown");
  const name = options.name ?? "unnamed";

  return (request: Request, response: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = keyGenerator(request);
    const current = buckets.get(key);
    const bucket =
      current && current.resetAt > now
        ? current
        : { count: 0, resetAt: now + options.windowMs };

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > options.maxRequests) {
      observeRateLimitExceeded(name);
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((bucket.resetAt - now) / 1000),
      );
      response.setHeader("Retry-After", retryAfterSeconds.toString());
      next(
        new AppError(
          429,
          "rate_limit_exceeded",
          "Too many requests. Please try again later.",
        ),
      );
      return;
    }

    // Bound memory when many clients send requests over time.
    if (buckets.size > 10_000) {
      for (const [bucketKey, bucketValue] of buckets) {
        if (bucketValue.resetAt <= now) buckets.delete(bucketKey);
      }
    }

    next();
  };
}
