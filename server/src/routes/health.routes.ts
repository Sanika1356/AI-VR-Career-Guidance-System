import { Router } from 'express';
import { getDependencyHealthController, getHealth } from '../controllers/health.controller.js';

export const healthRouter = Router();
healthRouter.get('/', getHealth);
healthRouter.get('/dependencies', getDependencyHealthController);
