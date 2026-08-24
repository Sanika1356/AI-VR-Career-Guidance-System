import { requirePool } from "../db/pool.js";
import type { DatabasePool } from "../db/types.js";
import { AppError } from "../utils/app-error.js";

interface RequiredSkillRow {
  career_id: string;
  skill_id: string;
  skill_name: string;
  required_level: "beginner" | "intermediate" | "advanced";
  prerequisites: string[] | string | null;
  transferable_skills: string[] | string | null;
}

interface ProfileRow {
  current_skills: string[] | string | null;
}

export interface SkillGapItem {
  name: string;
  status: "matched" | "missing";
  level: "beginner" | "intermediate" | "advanced";
  priority: "high" | "medium" | "low";
  prerequisites: string[];
  blockedBy: string[];
  transferableTo: string[];
  priorityReason: string;
}

export interface SkillGapResponse {
  careerId: string;
  skills: SkillGapItem[];
}

function parseStringArray(value: string[] | string | null): string[] {
  if (Array.isArray(value)) return value;
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

function normalizeSkill(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

export async function getSkillGap(
  userId: string,
  careerId: string,
  database: DatabasePool = requirePool(),
): Promise<SkillGapResponse> {
  const client = await database.connect();
  try {
    const [careerResult, profileResult] = await Promise.all([
      client.query<RequiredSkillRow>(
        `
        SELECT c.id AS career_id, s.id AS skill_id, s.name AS skill_name, cs.required_level,
               COALESCE(s.prerequisites, '[]'::jsonb) AS prerequisites,
               COALESCE(s.transferable_skills, '[]'::jsonb) AS transferable_skills
        FROM careers c
        JOIN career_skills cs ON cs.career_id = c.id
        JOIN skills s ON s.id = cs.skill_id
        WHERE c.id = $1
        ORDER BY s.name
      `,
        [careerId],
      ),
      client.query<ProfileRow>(
        "SELECT current_skills FROM profiles WHERE user_id = $1",
        [userId],
      ),
    ]);

    if (careerResult.rows.length === 0) {
      throw new AppError(
        404,
        "career_not_found",
        "The selected career does not exist.",
      );
    }

    const currentSkills = new Set(
      parseStringArray(profileResult.rows[0]?.current_skills ?? []).map(
        normalizeSkill,
      ),
    );
    const referencedSkillIds = [
      ...new Set(
        careerResult.rows.flatMap((row) => [
          ...parseStringArray(row.prerequisites),
          ...parseStringArray(row.transferable_skills),
        ]),
      ),
    ];
    const referencedSkills =
      referencedSkillIds.length > 0
        ? await client.query<{ id: string; name: string }>(
            "SELECT id, name FROM skills WHERE id = ANY($1::text[])",
            [referencedSkillIds],
          )
        : { rows: [] as Array<{ id: string; name: string }> };
    const skillNamesById = new Map([
      ...careerResult.rows.map(
        (row) => [row.skill_id, row.skill_name] as const,
      ),
      ...referencedSkills.rows.map((row) => [row.id, row.name] as const),
    ]);
    const requiredSkillNames = new Set(
      careerResult.rows.map((row) => normalizeSkill(row.skill_name)),
    );
    const missingPrerequisiteCounts = new Map<string, number>();
    for (const row of careerResult.rows) {
      if (currentSkills.has(normalizeSkill(row.skill_name))) continue;
      for (const prerequisiteId of parseStringArray(row.prerequisites)) {
        const prerequisite =
          skillNamesById.get(prerequisiteId) ?? prerequisiteId;
        if (requiredSkillNames.has(normalizeSkill(prerequisite))) {
          const prerequisiteName = normalizeSkill(prerequisite);
          missingPrerequisiteCounts.set(
            prerequisiteName,
            (missingPrerequisiteCounts.get(prerequisiteName) ?? 0) + 1,
          );
        }
      }
    }
    const skills = careerResult.rows.map((row) => {
      const status = currentSkills.has(normalizeSkill(row.skill_name))
        ? ("matched" as const)
        : ("missing" as const);
      const prerequisites = parseStringArray(row.prerequisites).map(
        (prerequisiteId) =>
          skillNamesById.get(prerequisiteId) ?? prerequisiteId,
      );
      const blockedBy = prerequisites.filter(
        (prerequisite) => !currentSkills.has(normalizeSkill(prerequisite)),
      );
      const normalizedName = normalizeSkill(row.skill_name);
      const isFoundational =
        (missingPrerequisiteCounts.get(normalizedName) ?? 0) > 0;
      const priority =
        status === "matched"
          ? ("low" as const)
          : isFoundational
            ? ("high" as const)
            : ("medium" as const);
      const priorityReason =
        status === "matched"
          ? "Already present in your profile; maintain and apply it."
          : isFoundational
            ? "Foundational prerequisite for another missing skill; build this first."
            : blockedBy.length > 0
              ? `Build ${blockedBy.join(" and ")} first.`
              : "Required for the selected career after foundational skills.";
      return {
        name: row.skill_name,
        status,
        level: row.required_level,
        priority,
        prerequisites,
        blockedBy,
        transferableTo: parseStringArray(row.transferable_skills).map(
          (skillId) => skillNamesById.get(skillId) ?? skillId,
        ),
        priorityReason,
      };
    });

    return { careerId, skills };
  } finally {
    client.release();
  }
}
