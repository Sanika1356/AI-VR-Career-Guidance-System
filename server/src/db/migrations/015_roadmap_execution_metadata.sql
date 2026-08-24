ALTER TABLE roadmap_steps
  ADD COLUMN IF NOT EXISTS estimated_effort_minutes INTEGER NOT NULL DEFAULT 60
    CHECK (estimated_effort_minutes > 0 AND estimated_effort_minutes <= 10080),
  ADD COLUMN IF NOT EXISTS accessibility_note TEXT NOT NULL DEFAULT 'Use the non-VR learning path and save progress as you go.';

ALTER TABLE roadmap_progress
  ADD COLUMN IF NOT EXISTS target_date DATE,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT ''
    CHECK (char_length(notes) <= 2000),
  ADD COLUMN IF NOT EXISTS position INTEGER
    CHECK (position IS NULL OR position > 0);

UPDATE roadmap_progress
SET status = CASE WHEN completed THEN 'completed' ELSE 'not_started' END
WHERE status = 'not_started' AND completed = TRUE;

CREATE INDEX IF NOT EXISTS idx_roadmap_progress_user_position
  ON roadmap_progress(user_id, position);
