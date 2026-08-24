import type { NextFunction, Request, Response } from "express";
import {
  compareCareers,
  getCareer,
  listCareers,
} from "../services/career.service.js";
import {
  validateCatalogLanguageQuery,
  validateCompareCareersQuery,
} from "../validators/career.js";
import { AppError } from "../utils/app-error.js";

export async function listCareersController(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { languageCode } = validateCatalogLanguageQuery(_request.query);
    response.status(200).json(await listCareers(undefined, languageCode));
  } catch (error) {
    next(error);
  }
}

export async function compareCareersController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = validateCompareCareersQuery(request.query);
    response
      .status(200)
      .json(
        await compareCareers(input.careerIds, undefined, input.languageCode),
      );
  } catch (error) {
    next(error);
  }
}

export async function getCareerController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const careerId = request.params.careerId;
    if (typeof careerId !== "string" || careerId.length === 0) {
      throw new AppError(400, "validation_error", "careerId is required.");
    }
    const { languageCode } = validateCatalogLanguageQuery(request.query);
    response
      .status(200)
      .json(await getCareer(careerId, undefined, languageCode));
  } catch (error) {
    next(error);
  }
}
