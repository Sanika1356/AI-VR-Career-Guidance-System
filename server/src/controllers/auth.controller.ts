import type { NextFunction, Request, Response } from "express";
import { loginUser, registerUser } from "../services/auth.service.js";
import { recordAuditEvent, requestAuditId } from "../services/audit.service.js";
import {
  validateLoginInput,
  validateRegisterInput,
} from "../validators/auth.js";

export async function registerController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await registerUser(validateRegisterInput(request.body));
    await recordAuditEvent({
      eventType: "auth_register_success",
      userId: result.user.id,
      requestId: requestAuditId(response),
    });
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function loginController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await loginUser(validateLoginInput(request.body));
    await recordAuditEvent({
      eventType: "auth_login_success",
      userId: result.user.id,
      requestId: requestAuditId(response),
    });
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
