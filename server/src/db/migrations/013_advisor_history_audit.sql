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
    'data_exported',
    'account_deleted'
  ));
