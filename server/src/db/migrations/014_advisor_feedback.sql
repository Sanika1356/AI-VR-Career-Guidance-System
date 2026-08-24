CREATE TABLE IF NOT EXISTS advisor_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_created_at TIMESTAMPTZ NOT NULL,
  helpful BOOLEAN NOT NULL,
  reason TEXT CHECK (reason IS NULL OR reason IN ('clear', 'actionable', 'grounded', 'incorrect', 'unsafe', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, conversation_id, message_created_at)
);

CREATE INDEX IF NOT EXISTS idx_advisor_feedback_created_at ON advisor_feedback(created_at DESC);

ALTER TABLE audit_events
  DROP CONSTRAINT IF EXISTS audit_events_event_type_check;

ALTER TABLE audit_events
  ADD CONSTRAINT audit_events_event_type_check CHECK (event_type IN (
    'auth_register_success',
    'auth_login_success',
    'privacy_consent_changed',
    'profile_changed',
    'recommendation_generated',
    'advisor_requested',
    'advisor_history_cleared',
    'advisor_feedback_submitted',
    'data_exported',
    'account_deleted'
  ));
