import { Router } from "express";
import { env } from "../config/env.js";
import {
  getCareerController,
  listCareersController,
} from "../controllers/career.controller.js";
import { createRateLimiter } from "../middleware/rate-limit.js";

export const careerRouter = Router();
const catalogRateLimiter = createRateLimiter({
  name: "career-catalog",
  windowMs: env.catalogRateLimitWindowMs,
  maxRequests: env.catalogRateLimitMax,
});

careerRouter.get("/", catalogRateLimiter, listCareersController);
careerRouter.get("/:careerId", catalogRateLimiter, getCareerController);
