import type { NextFunction, Request, Response } from "express";
import { getDashboard } from "../services/dashboard.service.js";
import { AppError } from "../utils/app-error.js";
import type { AuthenticatedRequest } from "../types/auth.js";

export async function getDashboardController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = (request as AuthenticatedRequest).userId;
    if (!userId) {
      throw new AppError(401, "unauthorized", "Authentication is required.");
    }
    response.status(200).json(await getDashboard(userId));
  } catch (error) {
    next(error);
  }
}
