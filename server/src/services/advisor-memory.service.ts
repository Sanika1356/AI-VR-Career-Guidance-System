import type { DatabasePool } from "../db/types.js";
import { requirePool } from "../db/pool.js";
import { AppError } from "../utils/app-error.js";

export interface ClearAdvisorHistoryResponse {
  conversationId: string;
  deletedMessageCount: number;
}

interface ConversationRow {
  id: string;
}

export async function clearAdvisorHistory(
  userId: string,
  conversationId: string,
  database: DatabasePool = requirePool(),
): Promise<ClearAdvisorHistoryResponse> {
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const conversation = await client.query<ConversationRow>(
      "SELECT id FROM conversations WHERE id = $1 AND user_id = $2 FOR UPDATE",
      [conversationId, userId],
    );
    if (!conversation.rows[0]) {
      throw new AppError(
        404,
        "conversation_not_found",
        "The conversation does not exist.",
      );
    }

    const deleted = await client.query(
      "DELETE FROM messages WHERE conversation_id = $1",
      [conversationId],
    );
    await client.query("COMMIT");
    return {
      conversationId,
      deletedMessageCount: deleted.rowCount ?? 0,
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the original application error when rollback is unavailable.
    }
    throw error;
  } finally {
    client.release();
  }
}
