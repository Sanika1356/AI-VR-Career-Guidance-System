import type { NextFunction, Response } from 'express';
import { deleteAccount, exportAccountData, getPrivacyConsent, updatePrivacyConsent } from '../services/privacy.service.js';
import { validatePrivacyConsentInput } from '../validators/privacy.js';
import type { AuthenticatedRequest } from '../types/auth.js';
import { AppError } from '../utils/app-error.js';

function authenticatedUserId(request: AuthenticatedRequest): string {
  if (!request.userId) throw new AppError(401, 'unauthorized', 'Authentication is required.');
  return request.userId;
}

export async function getPrivacyConsentController(request: AuthenticatedRequest, response: Response, next: NextFunction): Promise<void> {
  try {
    response.status(200).json({ consent: await getPrivacyConsent(authenticatedUserId(request)) });
  } catch (error) {
    next(error);
  }
}

export async function updatePrivacyConsentController(request: AuthenticatedRequest, response: Response, next: NextFunction): Promise<void> {
  try {
    const consent = await updatePrivacyConsent(
      authenticatedUserId(request),
      validatePrivacyConsentInput(request.body),
    );
    response.status(200).json({ consent });
  } catch (error) {
    next(error);
  }
}

export async function exportAccountDataController(request: AuthenticatedRequest, response: Response, next: NextFunction): Promise<void> {
  try {
    response.status(200).json(await exportAccountData(authenticatedUserId(request)));
  } catch (error) {
    next(error);
  }
}

export async function deleteAccountController(request: AuthenticatedRequest, response: Response, next: NextFunction): Promise<void> {
  try {
    response.status(200).json(await deleteAccount(authenticatedUserId(request)));
  } catch (error) {
    next(error);
  }
}
