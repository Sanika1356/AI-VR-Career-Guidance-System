ALTER TABLE careers
  ADD COLUMN IF NOT EXISTS learning_resources JSONB NOT NULL DEFAULT '[]'::jsonb;

INSERT INTO skills (id, name) VALUES
  ('skill_python', 'Python'),
  ('skill_machine_learning', 'Machine Learning'),
  ('skill_apis', 'APIs'),
  ('skill_data_analysis', 'Data Analysis'),
  ('skill_sql', 'SQL'),
  ('skill_communication', 'Communication'),
  ('skill_user_research', 'User Research'),
  ('skill_prototyping', 'Prototyping'),
  ('skill_html_css', 'HTML and CSS'),
  ('skill_javascript', 'JavaScript'),
  ('skill_cybersecurity', 'Cybersecurity'),
  ('skill_networking', 'Networking')
ON CONFLICT (id) DO NOTHING;

INSERT INTO careers (id, name, description, environment_key, learning_resources) VALUES
  (
    'career_ai_engineer',
    'AI Engineer',
    'Builds intelligent software systems and machine-learning features that solve practical problems.',
    'ai-engineer-lab',
    '[
      {"title":"Python Documentation","url":"https://docs.python.org/3/","type":"documentation","free":true},
      {"title":"scikit-learn User Guide","url":"https://scikit-learn.org/stable/user_guide.html","type":"documentation","free":true},
      {"title":"MDN Web APIs","url":"https://developer.mozilla.org/en-US/docs/Web/API","type":"documentation","free":true}
    ]'::jsonb
  ),
  (
    'career_data_analyst',
    'Data Analyst',
    'Turns structured data into clear findings, reports, and decisions for teams and organizations.',
    'data-insights-studio',
    '[
      {"title":"PostgreSQL Documentation","url":"https://www.postgresql.org/docs/","type":"documentation","free":true},
      {"title":"Python Data Analysis Guide","url":"https://pandas.pydata.org/docs/getting_started/intro_tutorials/","type":"documentation","free":true},
      {"title":"Kaggle Learn","url":"https://www.kaggle.com/learn","type":"course","free":true}
    ]'::jsonb
  ),
  (
    'career_ux_researcher',
    'UX Researcher',
    'Studies people and their needs to help teams design useful, accessible, and understandable experiences.',
    'ux-research-lab',
    '[
      {"title":"Nielsen Norman Group Articles","url":"https://www.nngroup.com/articles/","type":"articles","free":true},
      {"title":"W3C Web Accessibility Initiative","url":"https://www.w3.org/WAI/","type":"documentation","free":true},
      {"title":"Figma Community Resources","url":"https://help.figma.com/hc/en-us","type":"documentation","free":true}
    ]'::jsonb
  ),
  (
    'career_product_designer',
    'Product Designer',
    'Shapes product experiences through user understanding, interaction design, prototyping, and communication.',
    'product-design-studio',
    '[
      {"title":"Material Design Guidelines","url":"https://m3.material.io/","type":"guidelines","free":true},
      {"title":"MDN CSS Guides","url":"https://developer.mozilla.org/en-US/docs/Web/CSS","type":"documentation","free":true},
      {"title":"Web Content Accessibility Guidelines","url":"https://www.w3.org/WAI/standards-guidelines/wcag/","type":"guidelines","free":true}
    ]'::jsonb
  ),
  (
    'career_cybersecurity_analyst',
    'Cybersecurity Analyst',
    'Protects systems and information by monitoring risk, investigating incidents, and improving security controls.',
    'security-operations-center',
    '[
      {"title":"OWASP Web Security Testing Guide","url":"https://owasp.org/www-project-web-security-testing-guide/","type":"guide","free":true},
      {"title":"NIST Cybersecurity Framework","url":"https://www.nist.gov/cyberframework","type":"framework","free":true},
      {"title":"MDN HTTP Documentation","url":"https://developer.mozilla.org/en-US/docs/Web/HTTP","type":"documentation","free":true}
    ]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  environment_key = EXCLUDED.environment_key,
  learning_resources = EXCLUDED.learning_resources,
  updated_at = NOW();

INSERT INTO career_skills (career_id, skill_id, required_level) VALUES
  ('career_ai_engineer', 'skill_python', 'intermediate'),
  ('career_ai_engineer', 'skill_machine_learning', 'intermediate'),
  ('career_ai_engineer', 'skill_apis', 'intermediate'),
  ('career_data_analyst', 'skill_python', 'beginner'),
  ('career_data_analyst', 'skill_data_analysis', 'intermediate'),
  ('career_data_analyst', 'skill_sql', 'intermediate'),
  ('career_data_analyst', 'skill_communication', 'intermediate'),
  ('career_ux_researcher', 'skill_user_research', 'intermediate'),
  ('career_ux_researcher', 'skill_communication', 'intermediate'),
  ('career_ux_researcher', 'skill_data_analysis', 'beginner'),
  ('career_product_designer', 'skill_user_research', 'beginner'),
  ('career_product_designer', 'skill_prototyping', 'intermediate'),
  ('career_product_designer', 'skill_html_css', 'beginner'),
  ('career_product_designer', 'skill_communication', 'intermediate'),
  ('career_cybersecurity_analyst', 'skill_cybersecurity', 'intermediate'),
  ('career_cybersecurity_analyst', 'skill_networking', 'intermediate'),
  ('career_cybersecurity_analyst', 'skill_apis', 'beginner')
ON CONFLICT (career_id, skill_id) DO UPDATE SET required_level = EXCLUDED.required_level;

INSERT INTO vr_environments (key, career_id, title, description, available) VALUES
  ('ai-engineer-lab', 'career_ai_engineer', 'AI Engineering Lab', 'Explore a safe simulated workspace for building intelligent systems.', TRUE),
  ('data-insights-studio', 'career_data_analyst', 'Data Insights Studio', 'Explore a simulated analytics studio with dashboards and datasets.', TRUE),
  ('ux-research-lab', 'career_ux_researcher', 'UX Research Lab', 'Explore a simulated research lab for interviews and usability studies.', TRUE),
  ('product-design-studio', 'career_product_designer', 'Product Design Studio', 'Explore a simulated design studio for prototyping and critique.', TRUE),
  ('security-operations-center', 'career_cybersecurity_analyst', 'Security Operations Center', 'Explore a safe simulated security monitoring environment.', TRUE)
ON CONFLICT (key) DO UPDATE SET
  career_id = EXCLUDED.career_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  available = EXCLUDED.available;

INSERT INTO roadmap_steps (id, career_id, title, description, skill, display_order) VALUES
  ('roadmap_ai_python', 'career_ai_engineer', 'Build Python foundations', 'Practice functions, data structures, modules, and testing.', 'Python', 1),
  ('roadmap_ai_ml', 'career_ai_engineer', 'Study machine-learning concepts', 'Learn model evaluation, feature preparation, and responsible use.', 'Machine Learning', 2),
  ('roadmap_data_sql', 'career_data_analyst', 'Learn SQL querying', 'Practice filtering, joining, grouping, and summarizing relational data.', 'SQL', 1),
  ('roadmap_data_analysis', 'career_data_analyst', 'Create clear analyses', 'Turn a small dataset into a documented analysis and recommendation.', 'Data Analysis', 2),
  ('roadmap_ux_research', 'career_ux_researcher', 'Practice research methods', 'Plan interviews, usability tasks, synthesis, and evidence-based findings.', 'User Research', 1),
  ('roadmap_product_prototype', 'career_product_designer', 'Create an interaction prototype', 'Build and test a low-fidelity flow before polishing the interface.', 'Prototyping', 1),
  ('roadmap_cyber_fundamentals', 'career_cybersecurity_analyst', 'Learn security fundamentals', 'Study threats, controls, authentication, and incident response basics.', 'Cybersecurity', 1)
ON CONFLICT (id) DO UPDATE SET
  career_id = EXCLUDED.career_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  skill = EXCLUDED.skill,
  display_order = EXCLUDED.display_order;
