ALTER TABLE careers
  ADD COLUMN IF NOT EXISTS domain TEXT NOT NULL DEFAULT 'technology',
  ADD COLUMN IF NOT EXISTS aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS source_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ontology_version TEXT NOT NULL DEFAULT 'local-mvp-v1';

ALTER TABLE skills
  ADD COLUMN IF NOT EXISTS domain TEXT NOT NULL DEFAULT 'technology',
  ADD COLUMN IF NOT EXISTS aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS prerequisites JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS transferable_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS source_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ontology_version TEXT NOT NULL DEFAULT 'local-mvp-v1';

UPDATE careers SET
  domain = CASE id
    WHEN 'career_ai_engineer' THEN 'technology'
    WHEN 'career_data_analyst' THEN 'data'
    WHEN 'career_ux_researcher' THEN 'design'
    WHEN 'career_product_designer' THEN 'design'
    WHEN 'career_cybersecurity_analyst' THEN 'security'
    ELSE 'technology'
  END,
  aliases = CASE id
    WHEN 'career_ai_engineer' THEN '["Machine Learning Engineer"]'::jsonb
    WHEN 'career_data_analyst' THEN '["Data Analysis"]'::jsonb
    WHEN 'career_ux_researcher' THEN '["User Researcher"]'::jsonb
    WHEN 'career_product_designer' THEN '["UX Designer"]'::jsonb
    WHEN 'career_cybersecurity_analyst' THEN '["Security Analyst"]'::jsonb
    ELSE '[]'::jsonb
  END,
  source_references = '["local-mvp-catalog-v1"]'::jsonb,
  ontology_version = 'local-mvp-v1';

UPDATE skills SET
  domain = CASE
    WHEN id IN ('skill_python', 'skill_machine_learning', 'skill_apis', 'skill_javascript', 'skill_html_css') THEN 'technology'
    WHEN id IN ('skill_data_analysis', 'skill_sql') THEN 'data'
    WHEN id IN ('skill_user_research', 'skill_prototyping') THEN 'design'
    WHEN id IN ('skill_cybersecurity', 'skill_networking') THEN 'security'
    WHEN id = 'skill_communication' THEN 'transferable'
    ELSE 'technology'
  END,
  aliases = CASE id
    WHEN 'skill_machine_learning' THEN '["ML"]'::jsonb
    WHEN 'skill_data_analysis' THEN '["Data Analytics"]'::jsonb
    WHEN 'skill_user_research' THEN '["UX Research"]'::jsonb
    WHEN 'skill_communication' THEN '["Written Communication", "Stakeholder Communication"]'::jsonb
    ELSE '[]'::jsonb
  END,
  prerequisites = CASE id
    WHEN 'skill_machine_learning' THEN '["skill_python"]'::jsonb
    WHEN 'skill_data_analysis' THEN '["skill_sql"]'::jsonb
    ELSE '[]'::jsonb
  END,
  transferable_skills = CASE id
    WHEN 'skill_communication' THEN '["skill_user_research", "skill_data_analysis"]'::jsonb
    WHEN 'skill_user_research' THEN '["skill_communication"]'::jsonb
    ELSE '[]'::jsonb
  END,
  source_references = '["local-mvp-catalog-v1"]'::jsonb,
  ontology_version = 'local-mvp-v1';

CREATE INDEX IF NOT EXISTS idx_careers_domain ON careers(domain);
CREATE INDEX IF NOT EXISTS idx_skills_domain ON skills(domain);
