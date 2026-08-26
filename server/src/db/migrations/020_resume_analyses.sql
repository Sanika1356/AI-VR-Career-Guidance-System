-- Resume analyses store only user-owned metadata and the structured AI result.
-- Uploaded resume bytes are processed in memory and are intentionally not persisted.
CREATE TABLE IF NOT EXISTS resume_analyses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_role TEXT NOT NULL,
  analysis JSONB NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'groq', 'ollama', 'custom', 'none', 'puter')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT resume_analyses_analysis_object CHECK (jsonb_typeof(analysis) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_resume_analyses_user_created
  ON resume_analyses(user_id, created_at DESC);

-- Rollback: DROP TABLE IF EXISTS resume_analyses;
