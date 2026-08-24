import { Router } from "express";
import { env } from "../config/env.js";
import {
  loginController,
  registerController,
} from "../controllers/auth.controller.js";
import { createRateLimiter } from "../middleware/rate-limit.js";

export const authRouter = Router();
const authRateLimiter = createRateLimiter({
  name: "auth",
  windowMs: env.authRateLimitWindowMs,
  maxRequests: env.authRateLimitMax,
});

authRouter.post("/register", authRateLimiter, registerController);
authRouter.post("/login", authRateLimiter, loginController);
