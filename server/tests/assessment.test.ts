import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import type { QueryResult, QueryResultRow } from "pg";
import { app } from "../src/app.js";
import type { DatabaseClient, DatabasePool } from "../src/db/types.js";
import {
  compareAssessmentResults,
  getAssessmentQuestions,
  getAssessmentResult,
  getNextAssessmentQuestion,
  submitAssessment,
} from "../src/services/assessment.service.js";
import {
  validateCompareAssessmentResultsQuery,
  validateNextAssessmentQuestionQuery,
} from "../src/validators/assessment.js";

function queryResult<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return { rows, rowCount: rows.length, command: "SELECT", oid: 0, fields: [] };
}

class FakeClient implements DatabaseClient {
  public readonly queries: string[] = [];

  constructor(
    private readonly respond: (
      sql: string,
      values: readonly unknown[],
    ) => QueryResult<QueryResultRow>,
  ) {}

  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    values: readonly unknown[] = [],
  ): Promise<QueryResult<T>> {
    this.queries.push(sql.trim().split("\n")[0]);
    return this.respond(sql, values) as QueryResult<T>;
  }

  release(): void {}
}

function poolFor(client: DatabaseClient): DatabasePool {
  return { connect: async () => client };
}

test("getAssessmentQuestions creates an assessment and omits internal scoring weights", async () => {
  const client = new FakeClient((sql) => {
    if (sql.includes("FROM assessment_questions")) {
      return queryResult([
        {
          question_id: "question_1",
          question_text: "Which activity interests you most?",
          question_type: "single-choice",
          question_order: 1,
          option_id: "option_a",
          option_label: "Building software",
          option_order: 1,
        },
        {
          question_id: "question_1",
          question_text: "Which activity interests you most?",
          question_type: "single-choice",
          question_order: 1,
          option_id: "option_b",
          option_label: "Analyzing data",
          option_order: 2,
        },
      ]);
    }
    return queryResult([]);
  });

  const response = await getAssessmentQuestions("user_demo", poolFor(client));
  assert.ok(response.assessmentId.startsWith("assessment_"));
  assert.equal(response.questions[0]?.options.length, 2);
  assert.equal("scoring" in response.questions[0]!, false);
  assert.ok(client.queries.includes("BEGIN"));
  assert.ok(client.queries.includes("COMMIT"));
});

test("submitAssessment stores answers and returns deterministic career scores", async () => {
  const client = new FakeClient((sql) => {
    if (sql.includes("FROM assessments"))
      return queryResult([{ id: "assessment_demo", status: "in_progress" }]);
    if (sql.includes("SELECT id FROM assessment_questions"))
      return queryResult([{ id: "question_1" }, { id: "question_2" }]);
    if (sql.includes("FROM assessment_options")) {
      return queryResult([
        {
          question_id: "question_1",
          option_id: "option_ai",
          scoring: { career_ai_engineer: 3 },
        },
        {
          question_id: "question_2",
          option_id: "option_ai_2",
          scoring: { career_ai_engineer: 2 },
        },
      ]);
    }
    return queryResult([]);
  });

  const response = await submitAssessment(
    "user_demo",
    "assessment_demo",
    [
      { questionId: "question_1", optionId: "option_ai" },
      { questionId: "question_2", optionId: "option_ai_2" },
    ],
    poolFor(client),
  );

  assert.ok(response.resultId.startsWith("result_"));
  assert.deepEqual(response.categoryScores, { career_ai_engineer: 5 });
  assert.deepEqual(response.topCareerIds, ["career_ai_engineer"]);
  assert.ok(
    client.queries.some((query) =>
      query.startsWith("INSERT INTO assessment_answers"),
    ),
  );
  assert.ok(client.queries.includes("COMMIT"));
});

test("submitAssessment rejects incomplete answers without committing a result", async () => {
  const client = new FakeClient((sql) => {
    if (sql.includes("FROM assessments"))
      return queryResult([{ id: "assessment_demo", status: "in_progress" }]);
    if (sql.includes("SELECT id FROM assessment_questions"))
      return queryResult([{ id: "question_1" }, { id: "question_2" }]);
    return queryResult([]);
  });

  await assert.rejects(
    submitAssessment(
      "user_demo",
      "assessment_demo",
      [{ questionId: "question_1", optionId: "option_a" }],
      poolFor(client),
    ),
    (error: Error & { statusCode?: number; code?: string }) =>
      error.statusCode === 400 && error.code === "incomplete_assessment",
  );
  assert.equal(client.queries.includes("COMMIT"), false);
});

test("getAssessmentResult returns only the authenticated user result", async () => {
  const client = new FakeClient((sql) =>
    sql.includes("FROM assessment_results")
      ? queryResult([
          {
            id: "result_demo",
            completed_at: "2026-08-18T00:00:00.000Z",
            category_scores: { career_ai_engineer: 5 },
            top_career_ids: ["career_ai_engineer"],
          },
        ])
      : queryResult([]),
  );

  const result = await getAssessmentResult(
    "user_demo",
    "result_demo",
    poolFor(client),
  );
  assert.deepEqual(result, {
    resultId: "result_demo",
    completedAt: "2026-08-18T00:00:00.000Z",
    categoryScores: { career_ai_engineer: 5 },
    topCareerIds: ["career_ai_engineer"],
  });
});

test("adaptive assessment query validation stays bounded and strict", () => {
  assert.deepEqual(
    validateNextAssessmentQuestionQuery({
      assessmentId: "assessment_demo",
      answeredQuestionIds: "question_1,question_2",
    }),
    {
      assessmentId: "assessment_demo",
      answeredQuestionIds: ["question_1", "question_2"],
    },
  );
  assert.throws(
    () =>
      validateNextAssessmentQuestionQuery({
        assessmentId: "assessment_demo",
        answeredQuestionIds: "question_1,question_1",
      }),
    /must not contain duplicates/,
  );
  assert.throws(
    () =>
      validateNextAssessmentQuestionQuery({
        answeredQuestionIds: "question_1",
      }),
    /assessmentId must be a non-empty string/,
  );
});

test("adaptive assessment selects the least-covered domain deterministically and ends safely", async () => {
  const client = new FakeClient((sql) => {
    if (sql.includes("FROM assessments"))
      return queryResult([{ id: "assessment_demo", status: "in_progress" }]);
    if (sql.includes("FROM assessment_questions aq")) {
      return queryResult([
        {
          question_id: "question_data",
          question_text: "Data?",
          question_type: "single-choice",
          question_order: 1,
          question_domain: "data",
          question_difficulty: "introductory",
          option_id: "option_data",
          option_label: "Analyze",
          option_order: 1,
        },
        {
          question_id: "question_ai",
          question_text: "Software?",
          question_type: "single-choice",
          question_order: 2,
          question_domain: "ai",
          question_difficulty: "introductory",
          option_id: "option_ai",
          option_label: "Build",
          option_order: 1,
        },
      ]);
    }
    return queryResult([]);
  });

  const next = await getNextAssessmentQuestion(
    "user_demo",
    "assessment_demo",
    ["question_data"],
    poolFor(client),
  );
  assert.equal(next.done, false);
  assert.equal(next.question?.id, "question_ai");
  assert.equal(next.selection.strategy, "coverage-first-deterministic");

  const finished = await getNextAssessmentQuestion(
    "user_demo",
    "assessment_demo",
    ["question_data", "question_ai"],
    poolFor(client),
  );
  assert.equal(finished.done, true);
  assert.equal(finished.question, null);
});

test("assessment result explanations connect scores to answer evidence without diagnosis", async () => {
  const client = new FakeClient((sql) => {
    if (sql.includes("FROM assessment_results")) {
      return queryResult([
        {
          id: "result_demo",
          assessment_id: "assessment_demo",
          completed_at: "2026-08-18T00:00:00.000Z",
          category_scores: { career_ai_engineer: 5 },
          top_career_ids: ["career_ai_engineer"],
        },
      ]);
    }
    if (sql.includes("FROM assessment_answers")) {
      return queryResult([
        {
          question_id: "question_1",
          question_text: "Which activity interests you most?",
          option_label: "Building software",
          scoring: { career_ai_engineer: 3 },
        },
        {
          question_id: "question_2",
          question_text: "Which project sounds useful?",
          option_label: "Automating a workflow",
          scoring: { career_ai_engineer: 2 },
        },
      ]);
    }
    return queryResult([]);
  });

  const result = await getAssessmentResult(
    "user_demo",
    "result_demo",
    poolFor(client),
  );
  assert.deepEqual(result.explanations, [
    {
      careerId: "career_ai_engineer",
      score: 5,
      confidence: "high",
      supportingSignals: [
        "Which activity interests you most?: Building software",
        "Which project sounds useful?: Automating a workflow",
      ],
      caveat:
        "This explanation summarizes assessment signals; it is not a diagnosis or a guarantee of fit.",
    },
  ]);
});

test("retake comparison reports changed answers, score deltas, and top-career changes", async () => {
  const client = new FakeClient((sql, values) => {
    if (sql.includes("FROM assessment_results")) {
      const resultId = values[0];
      return queryResult(
        resultId === "result_new"
          ? [
              {
                id: "result_new",
                assessment_id: "assessment_new",
                completed_at: "2026-08-24T00:00:00.000Z",
                category_scores: {
                  career_ai_engineer: 5,
                  career_data_analyst: 1,
                },
                top_career_ids: ["career_ai_engineer"],
                question_bank_version: 1,
              },
            ]
          : [
              {
                id: "result_old",
                assessment_id: "assessment_old",
                completed_at: "2026-08-18T00:00:00.000Z",
                category_scores: {
                  career_ai_engineer: 2,
                  career_data_analyst: 3,
                },
                top_career_ids: ["career_data_analyst"],
                question_bank_version: 1,
              },
            ],
      ) as QueryResult<QueryResultRow>;
    }
    if (sql.includes("FROM assessment_answers")) {
      return queryResult([
        {
          assessment_id: "assessment_old",
          question_id: "question_1",
          question_text: "Which activity?",
          option_id: "option_data",
          option_label: "Analyzing data",
        },
        {
          assessment_id: "assessment_new",
          question_id: "question_1",
          question_text: "Which activity?",
          option_id: "option_ai",
          option_label: "Building software",
        },
        {
          assessment_id: "assessment_old",
          question_id: "question_2",
          question_text: "Which project?",
          option_id: "option_same",
          option_label: "A shared project",
        },
        {
          assessment_id: "assessment_new",
          question_id: "question_2",
          question_text: "Which project?",
          option_id: "option_same",
          option_label: "A shared project",
        },
      ]) as QueryResult<QueryResultRow>;
    }
    return queryResult([]);
  });

  const comparison = await compareAssessmentResults(
    "user_demo",
    "result_new",
    "result_old",
    poolFor(client),
  );
  assert.equal(comparison.questionBankVersionMatches, true);
  assert.deepEqual(comparison.changedAnswers, [
    {
      questionId: "question_1",
      questionText: "Which activity?",
      previousOptionId: "option_data",
      previousOptionLabel: "Analyzing data",
      currentOptionId: "option_ai",
      currentOptionLabel: "Building software",
    },
  ]);
  assert.deepEqual(comparison.scoreChanges, [
    {
      careerId: "career_ai_engineer",
      previousScore: 2,
      currentScore: 5,
      delta: 3,
    },
    {
      careerId: "career_data_analyst",
      previousScore: 3,
      currentScore: 1,
      delta: -2,
    },
  ]);
  assert.deepEqual(comparison.topCareerChanges, {
    added: ["career_ai_engineer"],
    removed: ["career_data_analyst"],
  });
});

test("retake comparison rejects the same result and invalid query values", () => {
  assert.deepEqual(
    validateCompareAssessmentResultsQuery({ previousResultId: "result_old" }),
    { previousResultId: "result_old" },
  );
  assert.throws(
    () => validateCompareAssessmentResultsQuery({ previousResultId: "" }),
    /previousResultId must be a non-empty string/,
  );
});

test("assessment endpoints require bearer authentication", async () => {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/assessment/questions`,
    );
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error, "unauthorized");
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
