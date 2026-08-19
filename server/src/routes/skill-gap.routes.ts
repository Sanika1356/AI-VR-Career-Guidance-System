import { Router } from 'express';
import { getSkillGapController } from '../controllers/skill-gap.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const skillGapRouter = Router();
skillGapRouter.get('/:careerId/skill-gap', requireAuth, getSkillGapController);
