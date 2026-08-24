import { AppError } from "../utils/app-error.js";

export type AdvisorFeedbackReason =
  "clear" | "actionable" | "grounded" | "incorrect" | "unsafe" | "other";

export interface AdvisorFeedbackInput {
  conversationId: string;
  messageCreatedAt: string;
  helpful: boolean;
  reason?: AdvisorFeedbackReason;
}

export interface AdvisorChatInput {
  message: string;
  careerId?: string;
  conversationId?: string;
}

function optionalId(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{3,160}$/.test(value)) {
    throw new AppError(
      400,
      "invalid_advisor_input",
      `${field} must be a valid identifier.`,
    );
  }
  return value;
}

export function validateConversationId(value: unknown): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{3,160}$/.test(value)) {
    throw new AppError(
      400,
      "invalid_advisor_input",
      "conversationId must be a valid identifier.",
    );
  }
  return value;
}

export function validateAdvisorFeedbackInput(
  value: unknown,
): AdvisorFeedbackInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError(
      400,
      "invalid_advisor_feedback",
      "Advisor feedback must be a JSON object.",
    );
  }
  const input = value as Record<string, unknown>;
  const allowedKeys = new Set([
    "conversationId",
    "messageCreatedAt",
    "helpful",
    "reason",
  ]);
  if (Object.keys(input).some((key) => !allowedKeys.has(key))) {
    throw new AppError(
      400,
      "invalid_advisor_feedback",
      "Advisor feedback contains an unsupported field.",
    );
  }
  const conversationId = validateConversationId(input.conversationId);
  if (
    typeof input.messageCreatedAt !== "string" ||
    input.messageCreatedAt.length > 60 ||
    Number.isNaN(Date.parse(input.messageCreatedAt))
  ) {
    throw new AppError(
      400,
      "invalid_advisor_feedback",
      "messageCreatedAt must be a valid timestamp.",
    );
  }
  if (typeof input.helpful !== "boolean") {
    throw new AppError(
      400,
      "invalid_advisor_feedback",
      "helpful must be a boolean.",
    );
  }
  const reasons = new Set<AdvisorFeedbackReason>([
    "clear",
    "actionable",
    "grounded",
    "incorrect",
    "unsafe",
    "other",
  ]);
  if (
    input.reason !== undefined &&
    (typeof input.reason !== "string" ||
      !reasons.has(input.reason as AdvisorFeedbackReason))
  ) {
    throw new AppError(
      400,
      "invalid_advisor_feedback",
      "reason is not supported.",
    );
  }
  return {
    conversationId,
    messageCreatedAt: new Date(input.messageCreatedAt).toISOString(),
    helpful: input.helpful,
    reason: input.reason as AdvisorFeedbackReason | undefined,
  };
}

export function validateAdvisorChatInput(value: unknown): AdvisorChatInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError(
      400,
      "invalid_advisor_input",
      "Advisor request must be a JSON object.",
    );
  }
  const input = value as Record<string, unknown>;
  const keys = Object.keys(input);
  const allowedKeys = new Set(["message", "careerId", "conversationId"]);
  if (keys.some((key) => !allowedKeys.has(key))) {
    throw new AppError(
      400,
      "invalid_advisor_input",
      "Advisor request contains an unsupported field.",
    );
  }
  if (
    typeof input.message !== "string" ||
    input.message.trim().length < 3 ||
    input.message.trim().length > 2000
  ) {
    throw new AppError(
      400,
      "invalid_advisor_input",
      "message must contain between 3 and 2000 characters.",
    );
  }
  return {
    message: input.message.trim(),
    careerId: optionalId(input.careerId, "careerId"),
    conversationId: optionalId(input.conversationId, "conversationId"),
  };
}
