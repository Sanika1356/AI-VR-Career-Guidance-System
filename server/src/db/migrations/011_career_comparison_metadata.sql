ALTER TABLE careers
  ADD COLUMN IF NOT EXISTS work_activities JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS learning_effort TEXT NOT NULL DEFAULT 'not_estimated',
  ADD COLUMN IF NOT EXISTS uncertainty_notes JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE careers SET
  work_activities = CASE id
    WHEN 'career_ai_engineer' THEN '["Translate a problem into a software or model approach", "Build and evaluate a small intelligent-system feature", "Document assumptions, limitations, and responsible-use considerations"]'::jsonb
    WHEN 'career_data_analyst' THEN '["Clarify a decision question", "Query and inspect structured data", "Communicate findings with evidence and limitations"]'::jsonb
    WHEN 'career_ux_researcher' THEN '["Plan user research questions", "Gather and synthesize qualitative evidence", "Communicate findings to improve an experience"]'::jsonb
    WHEN 'career_product_designer' THEN '["Frame a user problem", "Prototype and test an interaction", "Explain design trade-offs to collaborators"]'::jsonb
    WHEN 'career_cybersecurity_analyst' THEN '["Monitor signals for suspicious activity", "Investigate and document a security event", "Recommend practical controls and follow-up actions"]'::jsonb
    ELSE '[]'::jsonb
  END,
  learning_effort = CASE id
    WHEN 'career_ai_engineer' THEN 'substantial'
    WHEN 'career_data_analyst' THEN 'moderate'
    WHEN 'career_ux_researcher' THEN 'moderate'
    WHEN 'career_product_designer' THEN 'moderate'
    WHEN 'career_cybersecurity_analyst' THEN 'substantial'
    ELSE 'not_estimated'
  END,
  uncertainty_notes = '["Project-authored comparison metadata is directional and is not a labor-market forecast or qualification."]'::jsonb;

COMMENT ON COLUMN careers.work_activities IS
  'Project-authored activity examples for educational comparison; not occupational certification claims.';
COMMENT ON COLUMN careers.learning_effort IS
  'Directional project-authored effort label, not a duration or employment prediction.';
COMMENT ON COLUMN careers.uncertainty_notes IS
  'Displayed limitations for comparison outputs; kept separate from external source claims.';
