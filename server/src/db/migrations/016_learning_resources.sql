CREATE TABLE IF NOT EXISTS learning_resources (
  id TEXT PRIMARY KEY,
  career_id TEXT NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  skill_id TEXT REFERENCES skills(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  provider TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'catalog' CHECK (source_type IN ('catalog', 'ai-suggestion')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('documentation', 'course', 'article', 'guide', 'book', 'practice')),
  cost_model TEXT NOT NULL CHECK (cost_model IN ('free', 'freemium', 'paid', 'unknown')),
  duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all')),
  format TEXT NOT NULL CHECK (format IN ('reading', 'video', 'interactive', 'project', 'reference')),
  language_code TEXT NOT NULL DEFAULT 'en' CHECK (language_code ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  accessibility JSONB NOT NULL DEFAULT '{}'::jsonb,
  freshness_date DATE,
  license_name TEXT NOT NULL DEFAULT 'Unknown',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 1 CHECK (display_order > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (career_id, url)
);

CREATE INDEX IF NOT EXISTS idx_learning_resources_career_id
  ON learning_resources(career_id, display_order, id);

CREATE INDEX IF NOT EXISTS idx_learning_resources_skill_id
  ON learning_resources(skill_id);

INSERT INTO learning_resources (
  id, career_id, skill_id, title, description, url, provider, source_type, resource_type,
  cost_model, duration_minutes, level, format, language_code, accessibility,
  freshness_date, license_name, verified, display_order
) VALUES
  (
    'resource_ai_python_docs', 'career_ai_engineer', 'skill_python',
    'Python Documentation', 'Official language reference and tutorial.',
    'https://docs.python.org/3/', 'Python Software Foundation', 'catalog', 'documentation',
    'free', 240, 'all', 'reference', 'en',
    '{"captions":false,"transcript":false,"textAlternative":true}'::jsonb,
    DATE '2026-01-15', 'PSF License', TRUE, 1
  ),
  (
    'resource_ai_sklearn_guide', 'career_ai_engineer', 'skill_machine_learning',
    'scikit-learn User Guide', 'Practical reference for model selection and evaluation.',
    'https://scikit-learn.org/stable/user_guide.html', 'scikit-learn', 'catalog', 'guide',
    'free', 300, 'intermediate', 'reading', 'en',
    '{"captions":false,"transcript":false,"textAlternative":true}'::jsonb,
    DATE '2026-02-01', 'BSD 3-Clause', TRUE, 2
  ),
  (
    'resource_ai_mdn_web_apis', 'career_ai_engineer', 'skill_apis',
    'MDN Web APIs', 'Reference material for browser and HTTP API concepts.',
    'https://developer.mozilla.org/en-US/docs/Web/API', 'MDN Web Docs', 'catalog', 'documentation',
    'free', 180, 'all', 'reference', 'en',
    '{"captions":false,"transcript":false,"textAlternative":true}'::jsonb,
    DATE '2026-01-20', 'CC BY-SA 2.5', TRUE, 3
  ),
  (
    'resource_data_postgres_docs', 'career_data_analyst', 'skill_sql',
    'PostgreSQL Documentation', 'Authoritative SQL and database reference material.',
    'https://www.postgresql.org/docs/', 'PostgreSQL Global Development Group', 'catalog', 'documentation',
    'free', 240, 'all', 'reference', 'en',
    '{"captions":false,"transcript":false,"textAlternative":true}'::jsonb,
    DATE '2026-02-10', 'PostgreSQL License', TRUE, 1
  ),
  (
    'resource_data_pandas_tutorials', 'career_data_analyst', 'skill_data_analysis',
    'Pandas Getting Started Tutorials', 'Guided practice for loading, exploring, and analyzing data.',
    'https://pandas.pydata.org/docs/getting_started/intro_tutorials/', 'pandas', 'catalog', 'guide',
    'free', 180, 'beginner', 'interactive', 'en',
    '{"captions":false,"transcript":false,"textAlternative":true}'::jsonb,
    DATE '2026-01-25', 'BSD 3-Clause', TRUE, 2
  ),
  (
    'resource_data_kaggle_python', 'career_data_analyst', 'skill_python',
    'Kaggle Learn', 'Short, practice-oriented lessons for data and Python workflows.',
    'https://www.kaggle.com/learn', 'Kaggle', 'catalog', 'course',
    'free', 360, 'beginner', 'interactive', 'en',
    '{"captions":false,"transcript":false,"textAlternative":true}'::jsonb,
    DATE '2026-02-05', 'Kaggle Terms', TRUE, 3
  )
ON CONFLICT (id) DO UPDATE SET
  career_id = EXCLUDED.career_id,
  skill_id = EXCLUDED.skill_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  url = EXCLUDED.url,
  provider = EXCLUDED.provider,
  source_type = EXCLUDED.source_type,
  resource_type = EXCLUDED.resource_type,
  cost_model = EXCLUDED.cost_model,
  duration_minutes = EXCLUDED.duration_minutes,
  level = EXCLUDED.level,
  format = EXCLUDED.format,
  language_code = EXCLUDED.language_code,
  accessibility = EXCLUDED.accessibility,
  freshness_date = EXCLUDED.freshness_date,
  license_name = EXCLUDED.license_name,
  verified = EXCLUDED.verified,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();
