import { Router } from "express";
import {
  getRoadmapController,
  reorderRoadmapStepController,
  updateRoadmapProgressController,
} from "../controllers/roadmap.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const roadmapRouter = Router();
roadmapRouter.get(
  "/careers/:careerId/roadmap",
  requireAuth,
  getRoadmapController,
);
roadmapRouter.patch(
  "/roadmap/:stepId/reorder",
  requireAuth,
  reorderRoadmapStepController,
);
roadmapRouter.patch(
  "/roadmap/:stepId",
  requireAuth,
  updateRoadmapProgressController,
);
