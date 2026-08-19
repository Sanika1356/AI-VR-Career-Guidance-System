import { Router } from 'express';
import { getCareerController, listCareersController } from '../controllers/career.controller.js';

export const careerRouter = Router();
careerRouter.get('/', listCareersController);
careerRouter.get('/:careerId', getCareerController);
