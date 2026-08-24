CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  request_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'auth_register_success',
    'auth_login_success',
    'privacy_consent_changed',
    'profile_changed',
    'recommendation_generated',
    'advisor_requested',
    'data_exported',
    'account_deleted'
  )),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_user_created_at ON audit_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_type_created_at ON audit_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_request_id ON audit_events(request_id);
