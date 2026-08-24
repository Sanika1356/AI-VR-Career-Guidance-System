ALTER TABLE assessment_questions
  ADD COLUMN IF NOT EXISTS question_version INTEGER NOT NULL DEFAULT 1 CHECK (question_version > 0),
  ADD COLUMN IF NOT EXISTS domain TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS competency TEXT NOT NULL DEFAULT 'career-exploration',
  ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'introductory' CHECK (difficulty IN ('introductory', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS rationale TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS accessibility_text TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'approved' CHECK (review_status IN ('draft', 'in_review', 'approved', 'retired'));

UPDATE assessment_questions SET
  domain = 'career-exploration',
  competency = 'career-interest',
  difficulty = 'introductory',
  rationale = 'Connect the learner''s stated preference to career-domain evidence.',
  accessibility_text = text,
  review_status = CASE WHEN published THEN 'approved' ELSE 'draft' END;

CREATE INDEX IF NOT EXISTS idx_assessment_questions_domain ON assessment_questions(domain);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_review_status ON assessment_questions(review_status);
