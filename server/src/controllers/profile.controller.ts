import type { NextFunction, Response } from "express";
import { getProfile, updateProfile } from "../services/profile.service.js";
import { validateProfileUpdateInput } from "../validators/auth.js";
import type { AuthenticatedRequest } from "../types/auth.js";
import { AppError } from "../utils/app-error.js";
import { recordAuditEvent, requestAuditId } from "../services/audit.service.js";

function authenticatedUserId(request: AuthenticatedRequest): string {
  if (!request.userId)
    throw new AppError(401, "unauthorized", "Authentication is required.");
  return request.userId;
}

export async function getProfileController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    response.status(200).json(await getProfile(authenticatedUserId(request)));
  } catch (error) {
    next(error);
  }
}

export async function updateProfileController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = authenticatedUserId(request);
    const input = validateProfileUpdateInput(request.body);
    const result = await updateProfile(userId, input);
    await recordAuditEvent({
      eventType: "profile_changed",
      userId,
      requestId: requestAuditId(response),
      metadata: { changedFields: Object.keys(input).sort().join(",") },
    });
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
