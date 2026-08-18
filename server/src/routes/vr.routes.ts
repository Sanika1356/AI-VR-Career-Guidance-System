import { Router } from 'express';
import { listVREnvironmentsController } from '../controllers/vr.controller.js';

export const vrRouter = Router();
vrRouter.get('/environments', listVREnvironmentsController);
