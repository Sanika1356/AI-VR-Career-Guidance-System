import type { NextFunction, Response } from "express";
import {
  deleteAccount,
  exportAccountData,
  getPrivacyConsent,
  updatePrivacyConsent,
} from "../services/privacy.service.js";
import { validatePrivacyConsentInput } from "../validators/privacy.js";
import type { AuthenticatedRequest } from "../types/auth.js";
import { AppError } from "../utils/app-error.js";
import { recordAuditEvent, requestAuditId } from "../services/audit.service.js";

function authenticatedUserId(request: AuthenticatedRequest): string {
  if (!request.userId)
    throw new AppError(401, "unauthorized", "Authentication is required.");
  return request.userId;
}

export async function getPrivacyConsentController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    response
      .status(200)
      .json({ consent: await getPrivacyConsent(authenticatedUserId(request)) });
  } catch (error) {
    next(error);
  }
}

export async function updatePrivacyConsentController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = authenticatedUserId(request);
    const input = validatePrivacyConsentInput(request.body);
    const consent = await updatePrivacyConsent(userId, input);
    await recordAuditEvent({
      eventType: "privacy_consent_changed",
      userId,
      requestId: requestAuditId(response),
      metadata: { ...input },
    });
    response.status(200).json({ consent });
  } catch (error) {
    next(error);
  }
}

export async function exportAccountDataController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = authenticatedUserId(request);
    const result = await exportAccountData(userId);
    await recordAuditEvent({
      eventType: "data_exported",
      userId,
      requestId: requestAuditId(response),
    });
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteAccountController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = authenticatedUserId(request);
    const result = await deleteAccount(userId);
    await recordAuditEvent({
      eventType: "account_deleted",
      userId: null,
      requestId: requestAuditId(response),
      metadata: { accountDeleted: true },
    });
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
