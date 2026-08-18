-- Keep the career catalog broader than the VR catalog. The MVP exposes only
-- the two approved environments; additional environments can be added later
-- as independent rows without changing career, recommendation, or roadmap tables.

INSERT INTO vr_environments (key, career_id, title, description, available) VALUES
  (
    'ai-engineer-lab',
    'career_ai_engineer',
    'AI Engineering Lab',
    'Explore a safe simulated workspace for building intelligent systems.',
    TRUE
  ),
  (
    'data-insights-studio',
    'career_data_analyst',
    'Data Insights Studio',
    'Explore a simulated analytics studio with dashboards and datasets.',
    TRUE
  )
ON CONFLICT (key) DO UPDATE SET
  career_id = EXCLUDED.career_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  available = EXCLUDED.available;

-- These rows were part of the initial catalog seed but are outside the MVP
-- VR catalog. Remove only those known seed keys; future environments are kept.
DELETE FROM vr_environments
WHERE key IN ('ux-research-lab', 'product-design-studio', 'security-operations-center');
