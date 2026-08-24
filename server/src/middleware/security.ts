import type { NextFunction, Request, Response } from "express";
import { observeApiRequest } from "../utils/metrics.js";

export function securityHeaders(
  _request: Request,
  response: Response,
  next: NextFunction,
): void {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  next();
}

export function structuredRequestLogger(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const startedAt = Date.now();
  response.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    observeApiRequest(response.statusCode, durationMs);
    console.info(
      JSON.stringify({
        event: "http_request",
        requestId: response.getHeader("x-request-id") ?? null,
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
        durationMs,
      }),
    );
  });
  next();
}
