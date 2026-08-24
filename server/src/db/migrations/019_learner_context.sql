-- Learner context is optional, user-owned, and backward-compatible with existing profiles.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS constraints JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS preferred_work_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS education_stage TEXT,
  ADD COLUMN IF NOT EXISTS location_preference TEXT,
  ADD COLUMN IF NOT EXISTS weekly_time_budget_minutes INTEGER;

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_goals_array,
  ADD CONSTRAINT profiles_goals_array CHECK (jsonb_typeof(goals) = 'array' AND jsonb_array_length(goals) <= 20),
  DROP CONSTRAINT IF EXISTS profiles_constraints_array,
  ADD CONSTRAINT profiles_constraints_array CHECK (jsonb_typeof(constraints) = 'array' AND jsonb_array_length(constraints) <= 20),
  DROP CONSTRAINT IF EXISTS profiles_preferred_work_conditions_array,
  ADD CONSTRAINT profiles_preferred_work_conditions_array CHECK (jsonb_typeof(preferred_work_conditions) = 'array' AND jsonb_array_length(preferred_work_conditions) <= 20),
  DROP CONSTRAINT IF EXISTS profiles_education_stage,
  ADD CONSTRAINT profiles_education_stage CHECK (education_stage IS NULL OR education_stage IN ('secondary', 'undergraduate', 'graduate', 'career-changer', 'working-professional', 'other')),
  DROP CONSTRAINT IF EXISTS profiles_weekly_time_budget,
  ADD CONSTRAINT profiles_weekly_time_budget CHECK (weekly_time_budget_minutes IS NULL OR weekly_time_budget_minutes BETWEEN 30 AND 10080);

COMMENT ON COLUMN profiles.goals IS 'Optional learner-entered goals; private, exportable, and untrusted input.';
COMMENT ON COLUMN profiles.constraints IS 'Optional learner-entered constraints; private, exportable, and untrusted input.';
COMMENT ON COLUMN profiles.preferred_work_conditions IS 'Optional learner-entered preferred work conditions; private, exportable, and untrusted input.';
COMMENT ON COLUMN profiles.education_stage IS 'Optional self-described education or career stage; not a qualification or diagnosis.';
COMMENT ON COLUMN profiles.location_preference IS 'Optional learner-entered location preference; not used for automatic job applications.';
COMMENT ON COLUMN profiles.weekly_time_budget_minutes IS 'Optional weekly learning budget, bounded to 30 minutes through 7 days.';

CREATE INDEX IF NOT EXISTS idx_profiles_education_stage ON profiles(education_stage);
CREATE INDEX IF NOT EXISTS idx_profiles_weekly_time_budget ON profiles(weekly_time_budget_minutes);
-- Rollback: ALTER TABLE profiles DROP COLUMN IF EXISTS goals, DROP COLUMN IF EXISTS constraints,
--   DROP COLUMN IF EXISTS preferred_work_conditions, DROP COLUMN IF EXISTS education_stage,
--   DROP COLUMN IF EXISTS location_preference, DROP COLUMN IF EXISTS weekly_time_budget_minutes;
