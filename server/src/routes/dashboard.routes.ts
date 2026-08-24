import { Router } from "express";
import { getDashboardController } from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);
dashboardRouter.get("/", getDashboardController);
