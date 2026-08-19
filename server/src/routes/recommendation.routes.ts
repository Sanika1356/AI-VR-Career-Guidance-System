import { Router } from 'express';
import { getRecommendationsController } from '../controllers/recommendation.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const recommendationRouter = Router();
recommendationRouter.use(requireAuth);
recommendationRouter.get('/', getRecommendationsController);
