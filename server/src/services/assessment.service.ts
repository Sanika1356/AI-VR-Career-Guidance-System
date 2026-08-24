import { requirePool } from "../db/pool.js";
import type { DatabasePool } from "../db/types.js";
import { AppError } from "../utils/app-error.js";
import { createId } from "../utils/id.js";
import type { AssessmentAnswerInput } from "../validators/assessment.js";

interface QuestionRow {
  question_id: string;
  question_text: string;
  question_type: "single-choice" | "multiple-choice";
  question_order: number;
  question_domain?: string;
  question_difficulty?: "introductory" | "intermediate" | "advanced";
  option_id: string;
  option_label: string;
  option_order: number;
}

interface AssessmentRow {
  id: string;
  status: "in_progress" | "completed";
}

interface OptionScoreRow {
  question_id: string;
  option_id: string;
  scoring: Record<string, number> | string;
}

interface ResultRow {
  id: string;
  assessment_id: string;
  completed_at: string | Date;
  category_scores: Record<string, number> | string;
  top_career_ids: string[] | string;
}

interface AnswerEvidenceRow {
  question_id: string;
  question_text: string;
  option_label: string;
  scoring: Record<string, number> | string;
}

export interface AssessmentQuestionsResponse {
  assessmentId: string;
  questions: Array<{
    id: string;
    text: string;
    type: "single-choice" | "multiple-choice";
    options: Array<{ id: string; label: string }>;
  }>;
}

export interface NextAssessmentQuestionResponse {
  assessmentId: string;
  done: boolean;
  question: AssessmentQuestionsResponse["questions"][number] | null;
  selection: {
    strategy: "coverage-first-deterministic";
    reason: string;
  };
}

export interface AssessmentExplanation {
  careerId: string;
  score: number;
  confidence: "low" | "medium" | "high";
  supportingSignals: string[];
  caveat: string;
}

export interface AssessmentResultResponse {
  resultId: string;
  completedAt: string;
  categoryScores: Record<string, number>;
  topCareerIds: string[];
  explanations?: AssessmentExplanation[];
}

function parseObject(
  value: Record<string, number> | string,
): Record<string, number> {
  if (typeof value !== "string") return value;
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
      ? (parsed as Record<string, number>)
      : {};
  } catch {
    return {};
  }
}

function parseStringArray(value: string[] | string): string[] {
  if (Array.isArray(value)) return value;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function mapQuestions(
  rows: QuestionRow[],
): AssessmentQuestionsResponse["questions"] {
  const questions = new Map<
    string,
    AssessmentQuestionsResponse["questions"][number]
  >();
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

function selectNextQuestion(
  rows: QuestionRow[],
  answeredQuestionIds: Set<string>,
): AssessmentQuestionsResponse["questions"][number] | null {
  const grouped = new Map<string, QuestionRow[]>();
  for (const row of rows) {
    if (!grouped.has(row.question_id)) grouped.set(row.question_id, []);
    grouped.get(row.question_id)!.push(row);
  }
  const domainCounts = new Map<string, number>();
  for (const row of rows) {
    if (answeredQuestionIds.has(row.question_id)) {
      const domain = row.question_domain ?? "general";
      domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
    }
  }
  const difficultyRank: Record<string, number> = {
    introductory: 0,
    intermediate: 1,
    advanced: 2,
  };
  const candidates = [...grouped.values()]
    .filter(
      (questionRows) => !answeredQuestionIds.has(questionRows[0]!.question_id),
    )
    .sort((left, right) => {
      const leftRow = left[0]!;
      const rightRow = right[0]!;
      const leftDomain = leftRow.question_domain ?? "general";
      const rightDomain = rightRow.question_domain ?? "general";
      return (
        (domainCounts.get(leftDomain) ?? 0) -
          (domainCounts.get(rightDomain) ?? 0) ||
        (difficultyRank[leftRow.question_difficulty ?? "introductory"] ?? 0) -
          (difficultyRank[rightRow.question_difficulty ?? "introductory"] ??
            0) ||
        leftRow.question_order - rightRow.question_order ||
        leftRow.question_id.localeCompare(rightRow.question_id)
      );
    });
  const selected = candidates[0];
  if (!selected) return null;
  return {
    id: selected[0]!.question_id,
    text: selected[0]!.question_text,
    type: selected[0]!.question_type,
    options: selected.map((row) => ({
      id: row.option_id,
      label: row.option_label,
    })),
  };
}

export async function getNextAssessmentQuestion(
  userId: string,
  assessmentId: string,
  answeredQuestionIds: string[],
  database: DatabasePool = requirePool(),
): Promise<NextAssessmentQuestionResponse> {
  const client = await database.connect();
  try {
    const assessment = await client.query<AssessmentRow>(
      "SELECT id, status FROM assessments WHERE id = $1 AND user_id = $2",
      [assessmentId, userId],
    );
    if (!assessment.rows[0]) {
      throw new AppError(
        404,
        "assessment_not_found",
        "The requested assessment was not found.",
      );
    }
    const result = await client.query<QuestionRow>(`
      SELECT
        aq.id AS question_id,
        aq.text AS question_text,
        aq.question_type,
        aq.display_order AS question_order,
        aq.domain AS question_domain,
        aq.difficulty AS question_difficulty,
        ao.id AS option_id,
        ao.label AS option_label,
        ao.display_order AS option_order
      FROM assessment_questions aq
      JOIN assessment_options ao ON ao.question_id = aq.id
      WHERE aq.published = TRUE
      ORDER BY aq.display_order, ao.display_order
    `);
    const question = selectNextQuestion(
      result.rows,
      new Set(answeredQuestionIds),
    );
    return {
      assessmentId,
      done: question === null,
      question,
      selection: {
        strategy: "coverage-first-deterministic",
        reason: question
          ? "Selects the least-covered domain, then the lowest difficulty and stable display order."
          : "All published questions have been answered.",
      },
    };
  } finally {
    client.release();
  }
}

export async function getAssessmentQuestions(
  userId: string,
  database: DatabasePool = requirePool(),
): Promise<AssessmentQuestionsResponse> {
  const client = await database.connect();
  const assessmentId = createId("assessment");
  try {
    await client.query("BEGIN");
    await client.query(
      "INSERT INTO assessments (id, user_id) VALUES ($1, $2)",
      [assessmentId, userId],
    );
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
    await client.query("COMMIT");
    return { assessmentId, questions: mapQuestions(result.rows) };
  } catch (error) {
    await client.query("ROLLBACK");
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
  const resultId = createId("result");
  try {
    await client.query("BEGIN");
    const assessmentResult = await client.query<AssessmentRow>(
      "SELECT id, status FROM assessments WHERE id = $1 AND user_id = $2 FOR UPDATE",
      [assessmentId, userId],
    );
    const assessment = assessmentResult.rows[0];
    if (!assessment)
      throw new AppError(
        404,
        "assessment_not_found",
        "The requested assessment was not found.",
      );
    if (assessment.status === "completed")
      throw new AppError(
        400,
        "assessment_already_completed",
        "This assessment has already been submitted.",
      );

    const questionResult = await client.query<{ id: string }>(
      "SELECT id FROM assessment_questions WHERE published = TRUE ORDER BY display_order",
    );
    const requiredQuestionIds = new Set(
      questionResult.rows.map((row) => row.id),
    );
    const submittedQuestionIds = new Set(
      answers.map((answer) => answer.questionId),
    );
    if (
      requiredQuestionIds.size !== submittedQuestionIds.size ||
      [...requiredQuestionIds].some((id) => !submittedQuestionIds.has(id))
    ) {
      throw new AppError(
        400,
        "incomplete_assessment",
        "Answers must include every published assessment question exactly once.",
      );
    }

    const optionResult = await client.query<OptionScoreRow>(
      `SELECT aq.id AS question_id, ao.id AS option_id, ao.scoring
       FROM assessment_options ao
       JOIN assessment_questions aq ON aq.id = ao.question_id
       WHERE aq.published = TRUE AND ao.id = ANY($1::text[])`,
      [answers.map((answer) => answer.optionId)],
    );
    const optionsById = new Map(
      optionResult.rows.map((row) => [row.option_id, row]),
    );
    const categoryScores: Record<string, number> = {};
    for (const answer of answers) {
      const option = optionsById.get(answer.optionId);
      if (!option || option.question_id !== answer.questionId) {
        throw new AppError(
          400,
          "invalid_assessment_answer",
          "One or more answer options are invalid.",
        );
      }
      for (const [careerId, points] of Object.entries(
        parseObject(option.scoring),
      )) {
        categoryScores[careerId] =
          (categoryScores[careerId] ?? 0) + Number(points);
      }
      await client.query(
        "INSERT INTO assessment_answers (assessment_id, question_id, option_id) VALUES ($1, $2, $3)",
        [assessmentId, answer.questionId, answer.optionId],
      );
    }

    const topCareerIds = Object.entries(categoryScores)
      .sort(
        ([careerA, scoreA], [careerB, scoreB]) =>
          scoreB - scoreA || careerA.localeCompare(careerB),
      )
      .slice(0, 3)
      .map(([careerId]) => careerId);
    await client.query(
      `INSERT INTO assessment_results (id, assessment_id, user_id, category_scores, top_career_ids)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)`,
      [
        resultId,
        assessmentId,
        userId,
        JSON.stringify(categoryScores),
        JSON.stringify(topCareerIds),
      ],
    );
    await client.query(
      `UPDATE assessments SET status = 'completed', completed_at = NOW() WHERE id = $1`,
      [assessmentId],
    );
    await client.query("COMMIT");

    return {
      resultId,
      completedAt: new Date().toISOString(),
      categoryScores,
      topCareerIds,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function buildExplanations(
  categoryScores: Record<string, number>,
  topCareerIds: string[],
  evidence: AnswerEvidenceRow[],
): AssessmentExplanation[] {
  const positiveTotal = topCareerIds.reduce(
    (total, careerId) =>
      total + Math.max(0, Number(categoryScores[careerId] ?? 0)),
    0,
  );
  return topCareerIds.map((careerId) => {
    const score = Math.max(0, Number(categoryScores[careerId] ?? 0));
    const supportingSignals = evidence
      .filter((row) => Number(parseObject(row.scoring)[careerId] ?? 0) > 0)
      .map((row) => `${row.question_text}: ${row.option_label}`)
      .slice(0, 3);
    const share = positiveTotal > 0 ? score / positiveTotal : 0;
    const confidence: AssessmentExplanation["confidence"] =
      share >= 0.5 && supportingSignals.length >= 2
        ? "high"
        : share >= 0.3 || supportingSignals.length > 0
          ? "medium"
          : "low";
    return {
      careerId,
      score,
      confidence,
      supportingSignals,
      caveat:
        "This explanation summarizes assessment signals; it is not a diagnosis or a guarantee of fit.",
    };
  });
}

export async function getAssessmentResult(
  userId: string,
  resultId: string,
  database: DatabasePool = requirePool(),
): Promise<AssessmentResultResponse> {
  const client = await database.connect();
  try {
    const result = await client.query<ResultRow>(
      `SELECT id, assessment_id, completed_at, category_scores, top_career_ids
       FROM assessment_results
       WHERE id = $1 AND user_id = $2`,
      [resultId, userId],
    );
    const row = result.rows[0];
    if (!row)
      throw new AppError(
        404,
        "assessment_result_not_found",
        "The requested assessment result was not found.",
      );
    const completedAt =
      row.completed_at instanceof Date
        ? row.completed_at.toISOString()
        : new Date(row.completed_at).toISOString();
    const categoryScores = parseObject(row.category_scores);
    const topCareerIds = parseStringArray(row.top_career_ids);
    const evidenceResult = await client.query<AnswerEvidenceRow>(
      `SELECT aq.id AS question_id, aq.text AS question_text, ao.label AS option_label, ao.scoring
       FROM assessment_answers aa
       JOIN assessment_questions aq ON aq.id = aa.question_id
       JOIN assessment_options ao ON ao.id = aa.option_id
       WHERE aa.assessment_id = $1
       ORDER BY aq.display_order`,
      [row.assessment_id],
    );
    return {
      resultId: row.id,
      completedAt,
      categoryScores,
      topCareerIds,
      ...(evidenceResult.rows.length > 0
        ? {
            explanations: buildExplanations(
              categoryScores,
              topCareerIds,
              evidenceResult.rows,
            ),
          }
        : {}),
    };
  } finally {
    client.release();
  }
}
