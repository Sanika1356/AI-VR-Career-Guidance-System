ALTER TABLE roadmap_progress
  ADD COLUMN IF NOT EXISTS evidence_links JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE roadmap_progress
  DROP CONSTRAINT IF EXISTS roadmap_progress_evidence_links_array;

ALTER TABLE roadmap_progress
  ADD CONSTRAINT roadmap_progress_evidence_links_array
  CHECK (jsonb_typeof(evidence_links) = 'array' AND jsonb_array_length(evidence_links) <= 10);
