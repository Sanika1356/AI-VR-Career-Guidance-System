import { Router } from "express";
import {
  getAssessmentQuestionsController,
  getAssessmentResultController,
  getNextAssessmentQuestionController,
  submitAssessmentController,
} from "../controllers/assessment.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const assessmentRouter = Router();
assessmentRouter.use(requireAuth);
assessmentRouter.get("/questions", getAssessmentQuestionsController);
assessmentRouter.get("/next", getNextAssessmentQuestionController);
assessmentRouter.post("/submit", submitAssessmentController);
assessmentRouter.get("/results/:resultId", getAssessmentResultController);
