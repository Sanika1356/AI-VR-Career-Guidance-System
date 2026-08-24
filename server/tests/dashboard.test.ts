import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import type { QueryResult, QueryResultRow } from "pg";
import type { DatabaseClient, DatabasePool } from "../src/db/types.js";
import {
  calculateStreak,
  getDashboard,
} from "../src/services/dashboard.service.js";
import { app } from "../src/app.js";

function queryResult<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return { rows, rowCount: rows.length, command: "SELECT", oid: 0, fields: [] };
}

class DashboardClient implements DatabaseClient {
  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
  ): Promise<QueryResult<T>> {
    if (sql.includes("FROM roadmap_steps rs")) {
      return queryResult([
        {
          id: "roadmap_ai_python",
          title: "Build Python foundations",
          skill: "Python",
          completed: true,
          status: "completed",
          target_date: null,
          notes: "Review list and dict patterns.",
          position: 1,
          updated_at: "2026-01-11T09:00:00.000Z",
        },
        {
          id: "roadmap_ai_ml",
          title: "Study machine learning concepts",
          skill: "Machine Learning",
          completed: false,
          status: "in_progress",
          target_date: "2026-09-01",
          notes: "Finish the evaluation exercise.",
          position: 2,
          updated_at: "2026-01-10T09:00:00.000Z",
        },
      ]) as QueryResult<T>;
    }
    if (sql.includes("roadmap_progress_events")) {
      return queryResult([
        { activity_date: "2026-01-11" },
        { activity_date: "2026-01-10" },
        { activity_date: "2026-01-08" },
      ]) as QueryResult<T>;
    }
    if (sql.includes("FROM assessment_results")) {
      return queryResult([
        {
          id: "result_latest",
          completed_at: "2026-01-11T10:00:00.000Z",
          top_career_ids: ["career_data_analyst", "career_ai_engineer"],
        },
        {
          id: "result_previous",
          completed_at: "2026-01-01T10:00:00.000Z",
          top_career_ids: ["career_ai_engineer", "career_ux_researcher"],
        },
      ]) as QueryResult<T>;
    }
    return queryResult([]) as QueryResult<T>;
  }

  release(): void {}
}

function poolFor(client: DatabaseClient): DatabasePool {
  return { connect: async () => client };
}

test("calculateStreak counts current and longest consecutive activity days", () => {
  assert.deepEqual(
    calculateStreak(
      ["2026-08-20", "2026-08-21", "2026-08-23"],
      new Date("2026-08-23T12:00:00Z"),
    ),
    { currentDays: 1, longestDays: 2 },
  );
  assert.deepEqual(
    calculateStreak(
      ["2026-08-20", "2026-08-21"],
      new Date("2026-08-25T12:00:00Z"),
    ),
    { currentDays: 0, longestDays: 2 },
  );
});

test("getDashboard returns user-owned progress and recommendation changes", async () => {
  const response = await getDashboard(
    "user_demo",
    poolFor(new DashboardClient()),
  );

  assert.deepEqual(response.roadmap, {
    totalSteps: 2,
    completedSteps: 1,
    completionPercent: 50,
    completedSkills: ["Python"],
    activeMilestones: [
      {
        stepId: "roadmap_ai_ml",
        title: "Study machine learning concepts",
        skill: "Machine Learning",
        targetDate: "2026-09-01",
        notes: "Finish the evaluation exercise.",
        position: 2,
      },
    ],
    reflectionNotes: [
      {
        stepId: "roadmap_ai_python",
        title: "Build Python foundations",
        skill: "Python",
        notes: "Review list and dict patterns.",
        updatedAt: "2026-01-11",
      },
      {
        stepId: "roadmap_ai_ml",
        title: "Study machine learning concepts",
        skill: "Machine Learning",
        notes: "Finish the evaluation exercise.",
        updatedAt: "2026-01-10",
      },
    ],
  });
  assert.deepEqual(response.streaks, {
    currentDays: 0,
    longestDays: 2,
    activityDates: ["2026-01-08", "2026-01-10", "2026-01-11"],
  });
  assert.deepEqual(response.recommendationChanges.changedCareerIds, [
    "career_data_analyst",
    "career_ux_researcher",
  ]);
  assert.equal(
    response.recommendationChanges.latest?.resultId,
    "result_latest",
  );
  assert.equal(
    response.recommendationChanges.previous?.resultId,
    "result_previous",
  );
});

test("dashboard endpoint requires bearer authentication", async () => {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/dashboard`,
    );
    assert.equal(response.status, 401);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
