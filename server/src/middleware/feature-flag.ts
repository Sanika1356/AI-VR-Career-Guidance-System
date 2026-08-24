import type { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "../utils/app-error.js";

export function requireFeature(
  enabled: boolean,
  featureName: string,
): RequestHandler {
  return (_request: Request, _response: Response, next: NextFunction): void => {
    if (!enabled) {
      next(
        new AppError(
          503,
          "feature_disabled",
          `${featureName} is not enabled in this environment.`,
        ),
      );
      return;
    }
    next();
  };
}
