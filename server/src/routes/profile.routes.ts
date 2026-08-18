import { Router } from 'express';
import { getProfileController, updateProfileController } from '../controllers/profile.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const profileRouter = Router();
profileRouter.use(requireAuth);
profileRouter.get('/', getProfileController);
profileRouter.put('/', updateProfileController);
