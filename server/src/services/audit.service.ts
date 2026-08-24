import { requirePool } from "../db/pool.js";
import type { DatabasePool } from "../db/types.js";
import { createId } from "../utils/id.js";

export type AuditEventType =
  | "auth_register_success"
  | "auth_login_success"
  | "privacy_consent_changed"
  | "profile_changed"
  | "recommendation_generated"
  | "advisor_requested"
  | "advisor_history_cleared"
  | "advisor_feedback_submitted"
  | "data_exported"
  | "account_deleted";

export type AuditMetadata = Readonly<
  Record<string, string | number | boolean | null>
>;

export interface AuditEventInput {
  eventType: AuditEventType;
  userId: string | null;
  requestId: string | null;
  metadata?: AuditMetadata;
}

function requestIdFromHeader(
  value: string | string[] | number | undefined,
): string | null {
  return typeof value === "string" && value.length <= 200 ? value : null;
}

export function requestAuditId(response: {
  getHeader(name: string): string | string[] | number | undefined;
}): string | null {
  return requestIdFromHeader(response.getHeader("x-request-id"));
}

export async function recordAuditEvent(
  event: AuditEventInput,
  database: DatabasePool = requirePool(),
): Promise<void> {
  try {
    const client = await database.connect();
    try {
      await client.query(
        `INSERT INTO audit_events (id, user_id, request_id, event_type, metadata)
         VALUES ($1, $2, $3, $4, $5::jsonb)`,
        [
          createId("audit"),
          event.userId,
          event.requestId,
          event.eventType,
          JSON.stringify(event.metadata ?? {}),
        ],
      );
    } finally {
      client.release();
    }
  } catch {
    console.error(
      JSON.stringify({
        event: "audit_persist_failed",
        auditEventType: event.eventType,
        requestId: event.requestId,
      }),
    );
  }
}
