-- Allow browser-assisted Puter analysis results to be persisted without storing resume bytes.
ALTER TABLE resume_analyses
  DROP CONSTRAINT IF EXISTS resume_analyses_provider_check;

ALTER TABLE resume_analyses
  ADD CONSTRAINT resume_analyses_provider_check
  CHECK (provider IN ('gemini', 'groq', 'ollama', 'custom', 'none', 'puter'));

-- Rollback: restore the previous provider constraint after removing Puter rows.
