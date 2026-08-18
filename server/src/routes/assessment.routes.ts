import { Router } from 'express';
import {
  getAssessmentQuestionsController,
  getAssessmentResultController,
  submitAssessmentController,
} from '../controllers/assessment.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const assessmentRouter = Router();
assessmentRouter.use(requireAuth);
assessmentRouter.get('/questions', getAssessmentQuestionsController);
assessmentRouter.post('/submit', submitAssessmentController);
assessmentRouter.get('/results/:resultId', getAssessmentResultController);
