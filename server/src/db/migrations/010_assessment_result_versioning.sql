ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS question_bank_version INTEGER NOT NULL DEFAULT 1
    CHECK (question_bank_version > 0);

ALTER TABLE assessment_results
  ADD COLUMN IF NOT EXISTS question_bank_version INTEGER NOT NULL DEFAULT 1
    CHECK (question_bank_version > 0);

CREATE INDEX IF NOT EXISTS idx_results_user_completed_at
  ON assessment_results(user_id, completed_at DESC);

UPDATE assessment_results ar
SET question_bank_version = COALESCE(a.question_bank_version, 1)
FROM assessments a
WHERE a.id = ar.assessment_id;

UPDATE assessments a
SET question_bank_version = COALESCE(
  (
    SELECT MAX(aq.question_version)
    FROM assessment_questions aq
    WHERE aq.published = TRUE
  ),
  1
)
WHERE a.status = 'in_progress';

UPDATE assessment_results ar
SET question_bank_version = COALESCE(a.question_bank_version, 1)
FROM assessments a
WHERE a.id = ar.assessment_id;

CREATE INDEX IF NOT EXISTS idx_assessments_user_completed_at
  ON assessments(user_id, completed_at DESC);

COMMENT ON COLUMN assessments.question_bank_version IS
  'Pinned maximum published assessment question version selected when the attempt began.';
COMMENT ON COLUMN assessment_results.question_bank_version IS
  'Question-bank version used to produce this immutable result.';
