import { Router } from 'express';
import { chatAdvisorController } from '../controllers/advisor.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const advisorRouter = Router();
advisorRouter.post('/chat', requireAuth, chatAdvisorController);
