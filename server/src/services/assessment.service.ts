import { requirePool } from '../db/pool.js';
import type { DatabasePool } from '../db/types.js';
import { AppError } from '../utils/app-error.js';
import { createId } from '../utils/id.js';
import type { AssessmentAnswerInput } from '../validators/assessment.js';

interface QuestionRow {
  question_id: string;
  question_text: string;
  question_type: 'single-choice' | 'multiple-choice';
  question_order: number;
  option_id: string;
  option_label: string;
  option_order: number;
}

interface AssessmentRow {
  id: string;
  status: 'in_progress' | 'completed';
}

interface OptionScoreRow {
  question_id: string;
  option_id: string;
  scoring: Record<string, number> | string;
}

interface ResultRow {
  id: string;
  completed_at: string | Date;
  category_scores: Record<string, number> | string;
  top_career_ids: string[] | string;
}

export interface AssessmentQuestionsResponse {
  assessmentId: string;
  questions: Array<{
    id: string;
    text: string;
    type: 'single-choice' | 'multiple-choice';
    options: Array<{ id: string; label: string }>;
  }>;
}

export interface AssessmentResultResponse {
  resultId: string;
  completedAt: string;
  categoryScores: Record<string, number>;
  topCareerIds: string[];
}

function parseObject(value: Record<string, number> | string): Record<string, number> {
  if (typeof value !== 'string') return value;
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? parsed as Record<string, number>
      : {};
  } catch {
    return {};
  }
}

function parseStringArray(value: string[] | string): string[] {
  if (Array.isArray(value)) return value;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function mapQuestions(rows: QuestionRow[]): AssessmentQuestionsResponse['questions'] {
  const questions = new Map<string, AssessmentQuestionsResponse['questions'][number]>();
  for (const row of rows) {
    const question = questions.get(row.question_id) ?? {
      id: row.question_id,
      text: row.question_text,
      type: row.question_type,
      options: [],
    };
    question.options.push({ id: row.option_id, label: row.option_label });
    questions.set(row.question_id, question);
  }
  return [...questions.values()];
}

export async function getAssessmentQuestions(
  userId: string,
  database: DatabasePool = requirePool(),
): Promise<AssessmentQuestionsResponse> {
  const client = await database.connect();
  const assessmentId = createId('assessment');
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO assessments (id, user_id) VALUES ($1, $2)', [assessmentId, userId]);
    const result = await client.query<QuestionRow>(`
      SELECT
        aq.id AS question_id,
        aq.text AS question_text,
        aq.question_type,
        aq.display_order AS question_order,
        ao.id AS option_id,
        ao.label AS option_label,
        ao.display_order AS option_order
      FROM assessment_questions aq
      JOIN assessment_options ao ON ao.question_id = aq.id
      WHERE aq.published = TRUE
      ORDER BY aq.display_order, ao.display_order
    `);
    await client.query('COMMIT');
    return { assessmentId, questions: mapQuestions(result.rows) };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function submitAssessment(
  userId: string,
  assessmentId: string,
  answers: AssessmentAnswerInput[],
  database: DatabasePool = requirePool(),
): Promise<AssessmentResultResponse> {
  const client = await database.connect();
  const resultId = createId('result');
  try {
    await client.query('BEGIN');
    const assessmentResult = await client.query<AssessmentRow>(
      'SELECT id, status FROM assessments WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [assessmentId, userId],
    );
    const assessment = assessmentResult.rows[0];
    if (!assessment) throw new AppError(404, 'assessment_not_found', 'The requested assessment was not found.');
    if (assessment.status === 'completed') throw new AppError(400, 'assessment_already_completed', 'This assessment has already been submitted.');

    const questionResult = await client.query<{ id: string }>(
      'SELECT id FROM assessment_questions WHERE published = TRUE ORDER BY display_order',
    );
    const requiredQuestionIds = new Set(questionResult.rows.map((row) => row.id));
    const submittedQuestionIds = new Set(answers.map((answer) => answer.questionId));
    if (requiredQuestionIds.size !== submittedQuestionIds.size || [...requiredQuestionIds].some((id) => !submittedQuestionIds.has(id))) {
      throw new AppError(400, 'incomplete_assessment', 'Answers must include every published assessment question exactly once.');
    }

    const optionResult = await client.query<OptionScoreRow>(
      `SELECT aq.id AS question_id, ao.id AS option_id, ao.scoring
       FROM assessment_options ao
       JOIN assessment_questions aq ON aq.id = ao.question_id
       WHERE aq.published = TRUE AND ao.id = ANY($1::text[])`,
      [answers.map((answer) => answer.optionId)],
    );
    const optionsById = new Map(optionResult.rows.map((row) => [row.option_id, row]));
    const categoryScores: Record<string, number> = {};
    for (const answer of answers) {
      const option = optionsById.get(answer.optionId);
      if (!option || option.question_id !== answer.questionId) {
        throw new AppError(400, 'invalid_assessment_answer', 'One or more answer options are invalid.');
      }
      for (const [careerId, points] of Object.entries(parseObject(option.scoring))) {
        categoryScores[careerId] = (categoryScores[careerId] ?? 0) + Number(points);
      }
      await client.query(
        'INSERT INTO assessment_answers (assessment_id, question_id, option_id) VALUES ($1, $2, $3)',
        [assessmentId, answer.questionId, answer.optionId],
      );
    }

    const topCareerIds = Object.entries(categoryScores)
      .sort(([careerA, scoreA], [careerB, scoreB]) => scoreB - scoreA || careerA.localeCompare(careerB))
      .slice(0, 3)
      .map(([careerId]) => careerId);
    await client.query(
      `INSERT INTO assessment_results (id, assessment_id, user_id, category_scores, top_career_ids)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)`,
      [resultId, assessmentId, userId, JSON.stringify(categoryScores), JSON.stringify(topCareerIds)],
    );
    await client.query(
      `UPDATE assessments SET status = 'completed', completed_at = NOW() WHERE id = $1`,
      [assessmentId],
    );
    await client.query('COMMIT');

    return {
      resultId,
      completedAt: new Date().toISOString(),
      categoryScores,
      topCareerIds,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getAssessmentResult(
  userId: string,
  resultId: string,
  database: DatabasePool = requirePool(),
): Promise<AssessmentResultResponse> {
  const client = await database.connect();
  try {
    const result = await client.query<ResultRow>(
      `SELECT id, completed_at, category_scores, top_career_ids
       FROM assessment_results
       WHERE id = $1 AND user_id = $2`,
      [resultId, userId],
    );
    const row = result.rows[0];
    if (!row) throw new AppError(404, 'assessment_result_not_found', 'The requested assessment result was not found.');
    const completedAt = row.completed_at instanceof Date ? row.completed_at.toISOString() : new Date(row.completed_at).toISOString();
    return {
      resultId: row.id,
      completedAt,
      categoryScores: parseObject(row.category_scores),
      topCareerIds: parseStringArray(row.top_career_ids),
    };
  } finally {
    client.release();
  }
}
