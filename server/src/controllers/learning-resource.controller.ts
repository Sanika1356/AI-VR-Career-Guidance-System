import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error.js";
import { listLearningResources } from "../services/learning-resource.service.js";
import { validateLearningResourceQuery } from "../validators/learning-resource.js";

export async function listLearningResourcesController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const careerId = request.params.careerId;
    if (typeof careerId !== "string" || careerId.length === 0) {
      throw new AppError(400, "validation_error", "careerId is required.");
    }
    const query = validateLearningResourceQuery(request.query);
    response.status(200).json(await listLearningResources(careerId, query));
  } catch (error) {
    next(error);
  }
}
