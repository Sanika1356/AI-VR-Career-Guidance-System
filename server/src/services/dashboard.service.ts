import { requirePool } from "../db/pool.js";
import type { DatabasePool } from "../db/types.js";

interface RoadmapDashboardRow {
  id: string;
  title: string;
  skill: string;
  completed: boolean;
  status: "not_started" | "in_progress" | "completed";
  target_date: string | null;
  notes: string;
  position: number | string;
  updated_at: string | Date | null;
}

interface ActivityDateRow {
  activity_date: string | Date;
}

interface RecommendationHistoryRow {
  id: string;
  completed_at: string | Date;
  top_career_ids: string[] | string | null;
}

export interface DashboardMilestone {
  stepId: string;
  title: string;
  skill: string;
  targetDate: string | null;
  notes: string;
  position: number;
}

export interface DashboardReflectionNote {
  stepId: string;
  title: string;
  skill: string;
  notes: string;
  updatedAt: string | null;
}

export interface DashboardRecommendationSnapshot {
  resultId: string;
  completedAt: string;
  topCareerIds: string[];
}

export interface DashboardResponse {
  roadmap: {
    totalSteps: number;
    completedSteps: number;
    completionPercent: number;
    completedSkills: string[];
    activeMilestones: DashboardMilestone[];
    reflectionNotes: DashboardReflectionNote[];
  };
  streaks: {
    currentDays: number;
    longestDays: number;
    activityDates: string[];
  };
  recommendationChanges: {
    latest: DashboardRecommendationSnapshot | null;
    previous: DashboardRecommendationSnapshot | null;
    changedCareerIds: string[];
  };
}

function parseStringArray(value: string[] | string | null): string[] {
  if (Array.isArray(value))
    return value.filter((item): item is string => typeof item === "string");
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function formatDate(value: string | Date | null): string | null {
  if (!value) return null;
  return value instanceof Date
    ? value.toISOString().slice(0, 10)
    : String(value).slice(0, 10);
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export function calculateStreak(
  activityDates: string[],
  now = new Date(),
): { currentDays: number; longestDays: number } {
  const dates = [...new Set(activityDates)].sort();
  if (dates.length === 0) return { currentDays: 0, longestDays: 0 };

  let longestDays = 1;
  let run = 1;
  for (let index = 1; index < dates.length; index += 1) {
    const previous = Date.parse(`${dates[index - 1]}T00:00:00Z`);
    const current = Date.parse(`${dates[index]}T00:00:00Z`);
    if (current - previous === 86_400_000) run += 1;
    else run = 1;
    longestDays = Math.max(longestDays, run);
  }

  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const latest = Date.parse(`${dates[dates.length - 1]}T00:00:00Z`);
  const daysSinceLatest = Math.floor((today.getTime() - latest) / 86_400_000);
  if (daysSinceLatest > 1) return { currentDays: 0, longestDays };

  let currentDays = 1;
  for (let index = dates.length - 1; index > 0; index -= 1) {
    const current = Date.parse(`${dates[index]}T00:00:00Z`);
    const previous = Date.parse(`${dates[index - 1]}T00:00:00Z`);
    if (current - previous !== 86_400_000) break;
    currentDays += 1;
  }
  return { currentDays, longestDays };
}

export async function getDashboard(
  userId: string,
  database: DatabasePool = requirePool(),
): Promise<DashboardResponse> {
  const client = await database.connect();
  try {
    const [roadmapResult, activityResult, recommendationResult] =
      await Promise.all([
        client.query<RoadmapDashboardRow>(
          `SELECT rs.id, rs.title, rs.skill,
                CASE
                  WHEN rp.status = 'completed' OR rp.completed IS TRUE THEN TRUE
                  ELSE FALSE
                END AS completed,
                CASE
                  WHEN rp.status = 'completed' OR rp.completed IS TRUE THEN 'completed'
                  ELSE COALESCE(rp.status, 'not_started')
                END AS status,
                rp.target_date,
                COALESCE(rp.notes, '') AS notes,
                COALESCE(rp.position, rs.display_order) AS position,
                rp.updated_at
         FROM roadmap_steps rs
         LEFT JOIN roadmap_progress rp ON rp.step_id = rs.id AND rp.user_id = $1
         ORDER BY COALESCE(rp.position, rs.display_order), rs.display_order, rs.id`,
          [userId],
        ),
        client.query<ActivityDateRow>(
          `SELECT DISTINCT activity_date
         FROM (
           SELECT activity_date
           FROM roadmap_progress_events
           WHERE user_id = $1
           UNION ALL
           SELECT (updated_at AT TIME ZONE 'UTC')::date AS activity_date
           FROM roadmap_progress
           WHERE user_id = $1
         ) AS roadmap_activity
         ORDER BY activity_date DESC
         LIMIT 365`,
          [userId],
        ),
        client.query<RecommendationHistoryRow>(
          `SELECT id, completed_at, top_career_ids
         FROM assessment_results
         WHERE user_id = $1
         ORDER BY completed_at DESC
         LIMIT 2`,
          [userId],
        ),
      ]);

    const roadmapRows = roadmapResult.rows;
    const completedRows = roadmapRows.filter(
      (row) => Boolean(row.completed) || row.status === "completed",
    );
    const activeMilestones = roadmapRows
      .filter((row) => row.status === "in_progress")
      .map((row) => ({
        stepId: row.id,
        title: row.title,
        skill: row.skill,
        targetDate: formatDate(row.target_date),
        notes: row.notes,
        position: Number(row.position),
      }));
    const reflectionNotes = roadmapRows
      .filter((row) => row.notes.trim().length > 0)
      .sort((left, right) => {
        const leftTime = left.updated_at
          ? new Date(left.updated_at).getTime()
          : 0;
        const rightTime = right.updated_at
          ? new Date(right.updated_at).getTime()
          : 0;
        return rightTime - leftTime;
      })
      .slice(0, 5)
      .map((row) => ({
        stepId: row.id,
        title: row.title,
        skill: row.skill,
        notes: row.notes,
        updatedAt: formatDate(row.updated_at),
      }));

    const activityDates = uniqueSorted(
      activityResult.rows
        .map((row) => formatDate(row.activity_date))
        .filter((value): value is string => value !== null),
    );
    const recommendationHistory = recommendationResult.rows.map((row) => ({
      resultId: row.id,
      completedAt: new Date(row.completed_at).toISOString(),
      topCareerIds: parseStringArray(row.top_career_ids),
    }));
    const latest = recommendationHistory[0] ?? null;
    const previous = recommendationHistory[1] ?? null;
    const changedCareerIds =
      latest && previous
        ? uniqueSorted(
            [...latest.topCareerIds, ...previous.topCareerIds].filter(
              (careerId) =>
                !latest.topCareerIds.includes(careerId) ||
                !previous.topCareerIds.includes(careerId),
            ),
          )
        : [];
    const streaks = calculateStreak(activityDates);

    return {
      roadmap: {
        totalSteps: roadmapRows.length,
        completedSteps: completedRows.length,
        completionPercent:
          roadmapRows.length === 0
            ? 0
            : Math.round((completedRows.length / roadmapRows.length) * 100),
        completedSkills: uniqueSorted(completedRows.map((row) => row.skill)),
        activeMilestones,
        reflectionNotes,
      },
      streaks: {
        ...streaks,
        activityDates,
      },
      recommendationChanges: {
        latest,
        previous,
        changedCareerIds,
      },
    };
  } finally {
    client.release();
  }
}
