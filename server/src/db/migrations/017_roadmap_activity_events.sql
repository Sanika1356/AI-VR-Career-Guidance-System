CREATE TABLE IF NOT EXISTS roadmap_progress_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL REFERENCES roadmap_steps(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roadmap_progress_events_user_date
  ON roadmap_progress_events(user_id, activity_date DESC, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_roadmap_progress_events_step
  ON roadmap_progress_events(step_id, occurred_at DESC);
