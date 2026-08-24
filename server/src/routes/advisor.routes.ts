import { Router } from "express";
import { env } from "../config/env.js";
import {
  chatAdvisorController,
  clearAdvisorHistoryController,
} from "../controllers/advisor.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { createRateLimiter } from "../middleware/rate-limit.js";
import { requireFeature } from "../middleware/feature-flag.js";

export const advisorRouter = Router();
const advisorRateLimiter = createRateLimiter({
  name: "advisor-ai",
  windowMs: env.aiRateLimitWindowMs,
  maxRequests: env.aiRateLimitMax,
});

advisorRouter.delete(
  "/conversations/:conversationId/messages",
  requireAuth,
  requireFeature(env.aiAdvisorEnabled, "AI advisor"),
  advisorRateLimiter,
  clearAdvisorHistoryController,
);
advisorRouter.post(
  "/chat",
  requireAuth,
  requireFeature(env.aiAdvisorEnabled, "AI advisor"),
  advisorRateLimiter,
  chatAdvisorController,
);
