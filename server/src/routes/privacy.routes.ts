import { Router } from 'express';
import {
  deleteAccountController,
  exportAccountDataController,
  getPrivacyConsentController,
  updatePrivacyConsentController,
} from '../controllers/privacy.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const privacyRouter = Router();
privacyRouter.use(requireAuth);
privacyRouter.get('/consent', getPrivacyConsentController);
privacyRouter.put('/consent', updatePrivacyConsentController);
privacyRouter.get('/export', exportAccountDataController);
privacyRouter.delete('/account', deleteAccountController);
