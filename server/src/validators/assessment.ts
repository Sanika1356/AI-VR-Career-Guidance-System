import { AppError } from "../utils/app-error.js";

export interface AssessmentAnswerInput {
  questionId: string;
  optionId: string;
}

export interface SubmitAssessmentInput {
  assessmentId: string;
  answers: AssessmentAnswerInput[];
}

export interface NextAssessmentQuestionInput {
  assessmentId: string;
  answeredQuestionIds: string[];
}

export interface CompareAssessmentResultsInput {
  previousResultId: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredId(value: unknown, field: string): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.trim().length > 120
  ) {
    throw new AppError(
      400,
      "validation_error",
      `${field} must be a non-empty string.`,
    );
  }
  return value.trim();
}

export function validateNextAssessmentQuestionQuery(
  query: unknown,
): NextAssessmentQuestionInput {
  if (!isPlainObject(query)) {
    throw new AppError(
      400,
      "validation_error",
      "Query parameters must be an object.",
    );
  }
  const rawAnswered = query.answeredQuestionIds;
  if (rawAnswered !== undefined && typeof rawAnswered !== "string") {
    throw new AppError(
      400,
      "validation_error",
      "answeredQuestionIds must be a comma-separated string.",
    );
  }
  const answeredQuestionIds = rawAnswered
    ? rawAnswered.split(",").map((id) => requiredId(id, "answeredQuestionId"))
    : [];
  if (answeredQuestionIds.length > 50) {
    throw new AppError(
      400,
      "validation_error",
      "answeredQuestionIds cannot contain more than 50 items.",
    );
  }
  if (new Set(answeredQuestionIds).size !== answeredQuestionIds.length) {
    throw new AppError(
      400,
      "validation_error",
      "answeredQuestionIds must not contain duplicates.",
    );
  }
  return {
    assessmentId: requiredId(query.assessmentId, "assessmentId"),
    answeredQuestionIds,
  };
}

export function validateCompareAssessmentResultsQuery(
  query: unknown,
): CompareAssessmentResultsInput {
  if (!isPlainObject(query)) {
    throw new AppError(
      400,
      "validation_error",
      "Query parameters must be an object.",
    );
  }
  return {
    previousResultId: requiredId(query.previousResultId, "previousResultId"),
  };
}

export function validateSubmitAssessmentInput(
  body: unknown,
): SubmitAssessmentInput {
  if (!isPlainObject(body))
    throw new AppError(
      400,
      "validation_error",
      "Request body must be a JSON object.",
    );
  if (
    !Array.isArray(body.answers) ||
    body.answers.length === 0 ||
    body.answers.length > 50
  ) {
    throw new AppError(
      400,
      "validation_error",
      "answers must contain between 1 and 50 items.",
    );
  }

  const questionIds = new Set<string>();
  const answers = body.answers.map((value) => {
    if (!isPlainObject(value))
      throw new AppError(
        400,
        "validation_error",
        "Each answer must be a JSON object.",
      );
    const questionId = requiredId(value.questionId, "questionId");
    const optionId = requiredId(value.optionId, "optionId");
    if (questionIds.has(questionId)) {
      throw new AppError(
        400,
        "validation_error",
        "Each question may only be answered once.",
      );
    }
    questionIds.add(questionId);
    return { questionId, optionId };
  });

  return {
    assessmentId: requiredId(body.assessmentId, "assessmentId"),
    answers,
  };
}
