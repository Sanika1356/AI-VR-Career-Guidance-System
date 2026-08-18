CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  interests JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  experience TEXT NOT NULL DEFAULT '',
  learning_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS careers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  environment_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS career_skills (
  career_id TEXT NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
  required_level TEXT NOT NULL DEFAULT 'beginner' CHECK (required_level IN ('beginner', 'intermediate', 'advanced')),
  PRIMARY KEY (career_id, skill_id)
);

CREATE TABLE IF NOT EXISTS assessment_questions (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'single-choice' CHECK (question_type IN ('single-choice', 'multiple-choice')),
  display_order INTEGER NOT NULL UNIQUE CHECK (display_order > 0),
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_options (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  scoring JSONB NOT NULL DEFAULT '{}'::jsonb,
  display_order INTEGER NOT NULL CHECK (display_order > 0),
  UNIQUE (question_id, display_order)
);

CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS assessment_answers (
  assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES assessment_questions(id) ON DELETE RESTRICT,
  option_id TEXT NOT NULL REFERENCES assessment_options(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (assessment_id, question_id)
);

CREATE TABLE IF NOT EXISTS assessment_results (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL UNIQUE REFERENCES assessments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  top_career_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT PRIMARY KEY,
  result_id TEXT NOT NULL REFERENCES assessment_results(id) ON DELETE CASCADE,
  career_id TEXT NOT NULL REFERENCES careers(id) ON DELETE RESTRICT,
  score NUMERIC(5, 2) NOT NULL CHECK (score >= 0 AND score <= 100),
  reason TEXT NOT NULL,
  matched_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  rank INTEGER NOT NULL CHECK (rank > 0),
  UNIQUE (result_id, career_id),
  UNIQUE (result_id, rank)
);

CREATE TABLE IF NOT EXISTS roadmap_steps (
  id TEXT PRIMARY KEY,
  career_id TEXT NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  skill TEXT NOT NULL,
  display_order INTEGER NOT NULL CHECK (display_order > 0),
  UNIQUE (career_id, display_order)
);

CREATE TABLE IF NOT EXISTS roadmap_progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL REFERENCES roadmap_steps(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, step_id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  career_id TEXT REFERENCES careers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 10000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vr_environments (
  key TEXT PRIMARY KEY,
  career_id TEXT NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  available BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_results_user_id ON assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_result_id ON recommendations(result_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_steps_career_id ON roadmap_steps(career_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
