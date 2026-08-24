import { requirePool } from "../db/pool.js";
import type { DatabasePool } from "../db/types.js";
import { createId } from "../utils/id.js";
import { AppError } from "../utils/app-error.js";
import type { AdvisorFeedbackInput } from "../validators/advisor.js";

export interface AdvisorFeedbackResponse {
  recorded: true;
  conversationId: string;
  messageCreatedAt: string;
}

export async function recordAdvisorFeedback(
  userId: string,
  input: AdvisorFeedbackInput,
  database: DatabasePool = requirePool(),
): Promise<AdvisorFeedbackResponse> {
  const client = await database.connect();
  try {
    const conversation = await client.query<{ id: string }>(
      "SELECT id FROM conversations WHERE id = $1 AND user_id = $2",
      [input.conversationId, userId],
    );
    if (!conversation.rows[0]) {
      throw new AppError(
        404,
        "conversation_not_found",
        "The conversation does not exist.",
      );
    }

    const message = await client.query<{ created_at: string }>(
      `SELECT created_at FROM messages
       WHERE conversation_id = $1 AND role = 'assistant' AND created_at = $2`,
      [input.conversationId, input.messageCreatedAt],
    );
    if (!message.rows[0]) {
      throw new AppError(
        404,
        "message_not_found",
        "The advisor message does not exist.",
      );
    }

    await client.query(
      `INSERT INTO advisor_feedback
        (id, user_id, conversation_id, message_created_at, helpful, reason)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, conversation_id, message_created_at)
       DO UPDATE SET helpful = EXCLUDED.helpful, reason = EXCLUDED.reason, created_at = NOW()`,
      [
        createId("advisor_feedback"),
        userId,
        input.conversationId,
        input.messageCreatedAt,
        input.helpful,
        input.reason ?? null,
      ],
    );

    return {
      recorded: true,
      conversationId: input.conversationId,
      messageCreatedAt: input.messageCreatedAt,
    };
  } finally {
    client.release();
  }
}
