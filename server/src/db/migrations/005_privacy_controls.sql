CREATE TABLE IF NOT EXISTS privacy_consents (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  analytics BOOLEAN NOT NULL DEFAULT FALSE,
  personalized_ai BOOLEAN NOT NULL DEFAULT FALSE,
  vr_telemetry BOOLEAN NOT NULL DEFAULT FALSE,
  policy_version TEXT NOT NULL DEFAULT 'v1',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO privacy_consents (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_privacy_consents_updated_at ON privacy_consents(updated_at);
