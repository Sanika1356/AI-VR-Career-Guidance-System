ALTER TABLE careers
  ADD COLUMN IF NOT EXISTS education_pathways JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE skills
  ADD COLUMN IF NOT EXISTS proficiency_levels JSONB NOT NULL DEFAULT '["beginner", "intermediate", "advanced"]'::jsonb,
  ADD COLUMN IF NOT EXISTS related_skills JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE careers SET education_pathways = CASE id
  WHEN 'career_ai_engineer' THEN '["computer science", "software engineering", "applied mathematics"]'::jsonb
  WHEN 'career_data_analyst' THEN '["statistics", "data analytics", "business analytics"]'::jsonb
  WHEN 'career_ux_researcher' THEN '["human-computer interaction", "psychology", "design research"]'::jsonb
  WHEN 'career_product_designer' THEN '["interaction design", "product design", "human-computer interaction"]'::jsonb
  WHEN 'career_cybersecurity_analyst' THEN '["cybersecurity", "information technology", "networking"]'::jsonb
  ELSE '[]'::jsonb
END;

UPDATE skills SET related_skills = CASE id
  WHEN 'skill_python' THEN '["skill_data_analysis", "skill_machine_learning"]'::jsonb
  WHEN 'skill_machine_learning' THEN '["skill_python", "skill_data_analysis"]'::jsonb
  WHEN 'skill_data_analysis' THEN '["skill_sql", "skill_python"]'::jsonb
  WHEN 'skill_sql' THEN '["skill_data_analysis"]'::jsonb
  WHEN 'skill_user_research' THEN '["skill_communication", "skill_prototyping"]'::jsonb
  WHEN 'skill_prototyping' THEN '["skill_user_research", "skill_html_css"]'::jsonb
  WHEN 'skill_cybersecurity' THEN '["skill_networking", "skill_apis"]'::jsonb
  WHEN 'skill_networking' THEN '["skill_cybersecurity", "skill_apis"]'::jsonb
  ELSE '[]'::jsonb
END;
