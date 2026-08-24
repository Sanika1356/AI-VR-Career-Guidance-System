import { requirePool } from "../db/pool.js";
import type { DatabasePool } from "../db/types.js";
import {
  loadLocalOntology,
  type OntologySnapshot,
} from "./ontology.service.js";

export interface RoadmapReference {
  id: string;
  careerId: string;
  skill: string;
}

export type CatalogValidationIssueCode =
  | "duplicate_career_id"
  | "duplicate_skill_id"
  | "invalid_career_id"
  | "invalid_skill_id"
  | "missing_career_description"
  | "missing_skill_name"
  | "duplicate_career_skill"
  | "unknown_career_skill"
  | "invalid_required_level"
  | "duplicate_skill_relationship"
  | "unknown_skill_prerequisite"
  | "unknown_skill_transferable"
  | "unknown_skill_related"
  | "invalid_skill_proficiency_level"
  | "unknown_roadmap_career"
  | "incompatible_roadmap_skill";

export interface CatalogValidationIssue {
  code: CatalogValidationIssueCode;
  entityType: "career" | "skill" | "career_skill" | "roadmap";
  entityId: string;
  message: string;
}

export interface CatalogValidationReport {
  source: {
    key: string;
    version: string;
    license: string;
  };
  generatedAt: string;
  valid: boolean;
  summary: {
    careerCount: number;
    skillCount: number;
    roadmapCount: number;
    errorCount: number;
  };
  issues: CatalogValidationIssue[];
}

interface RoadmapReferenceRow {
  id: string;
  career_id: string;
  skill: string;
}

const ID_PATTERN = /^[a-z0-9]+(?:[_-][a-z0-9]+)*$/;
const LEVELS = new Set(["beginner", "intermediate", "advanced"]);

function addIssue(
  issues: CatalogValidationIssue[],
  code: CatalogValidationIssueCode,
  entityType: CatalogValidationIssue["entityType"],
  entityId: string,
  message: string,
): void {
  issues.push({ code, entityType, entityId, message });
}

function relationshipIssues(
  issues: CatalogValidationIssue[],
  skillId: string,
  values: string[],
  knownSkillIds: Set<string>,
  code:
    | "unknown_skill_prerequisite"
    | "unknown_skill_transferable"
    | "unknown_skill_related",
  label: string,
): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      addIssue(
        issues,
        "duplicate_skill_relationship",
        "skill",
        skillId,
        `Skill ${skillId} repeats ${label} relationship ${value}.`,
      );
    }
    seen.add(value);
    if (!knownSkillIds.has(value)) {
      addIssue(
        issues,
        code,
        "skill",
        skillId,
        `Skill ${skillId} references unknown ${label} ${value}.`,
      );
    }
  }
}

export function buildCatalogValidationReport(
  snapshot: OntologySnapshot,
  roadmapReferences: RoadmapReference[] = [],
  generatedAt = new Date().toISOString(),
): CatalogValidationReport {
  const issues: CatalogValidationIssue[] = [];
  const careerIds = new Set<string>();
  const skillIds = new Set<string>(snapshot.skills.map((skill) => skill.id));
  const careerSkillKeys = new Set<string>();

  for (const career of snapshot.careers) {
    if (!ID_PATTERN.test(career.id)) {
      addIssue(
        issues,
        "invalid_career_id",
        "career",
        career.id,
        `Career ID ${career.id || "<empty>"} is not a stable catalog ID.`,
      );
    }
    if (careerIds.has(career.id)) {
      addIssue(
        issues,
        "duplicate_career_id",
        "career",
        career.id,
        `Career ID ${career.id} is duplicated.`,
      );
    }
    careerIds.add(career.id);
    if (career.description.trim().length === 0) {
      addIssue(
        issues,
        "missing_career_description",
        "career",
        career.id,
        `Career ${career.id} has no description.`,
      );
    }
  }

  for (const skill of snapshot.skills) {
    if (!ID_PATTERN.test(skill.id)) {
      addIssue(
        issues,
        "invalid_skill_id",
        "skill",
        skill.id,
        `Skill ID ${skill.id || "<empty>"} is not a stable catalog ID.`,
      );
    }
    const duplicateSkillId =
      snapshot.skills.filter((candidate) => candidate.id === skill.id).length >
      1;
    if (duplicateSkillId) {
      addIssue(
        issues,
        "duplicate_skill_id",
        "skill",
        skill.id,
        `Skill ID ${skill.id} is duplicated.`,
      );
    }
    if (skill.canonicalName.trim().length === 0) {
      addIssue(
        issues,
        "missing_skill_name",
        "skill",
        skill.id,
        `Skill ${skill.id} has no canonical name.`,
      );
    }
    for (const level of skill.proficiencyLevels) {
      if (!LEVELS.has(level)) {
        addIssue(
          issues,
          "invalid_skill_proficiency_level",
          "skill",
          skill.id,
          `Skill ${skill.id} has invalid proficiency level ${level}.`,
        );
      }
    }
    relationshipIssues(
      issues,
      skill.id,
      skill.prerequisites,
      skillIds,
      "unknown_skill_prerequisite",
      "prerequisite",
    );
    relationshipIssues(
      issues,
      skill.id,
      skill.transferableSkills,
      skillIds,
      "unknown_skill_transferable",
      "transferable skill",
    );
    relationshipIssues(
      issues,
      skill.id,
      skill.relatedSkills,
      skillIds,
      "unknown_skill_related",
      "related skill",
    );
  }

  for (const career of snapshot.careers) {
    for (const requiredSkill of career.skills) {
      const relationshipKey = `${career.id}:${requiredSkill.skillId}`;
      if (careerSkillKeys.has(relationshipKey)) {
        addIssue(
          issues,
          "duplicate_career_skill",
          "career_skill",
          relationshipKey,
          `Career ${career.id} repeats skill ${requiredSkill.skillId}.`,
        );
      }
      careerSkillKeys.add(relationshipKey);
      if (!skillIds.has(requiredSkill.skillId)) {
        addIssue(
          issues,
          "unknown_career_skill",
          "career_skill",
          relationshipKey,
          `Career ${career.id} references unknown skill ${requiredSkill.skillId}.`,
        );
      }
      if (!LEVELS.has(requiredSkill.requiredLevel)) {
        addIssue(
          issues,
          "invalid_required_level",
          "career_skill",
          relationshipKey,
          `Career ${career.id} has invalid required level ${requiredSkill.requiredLevel}.`,
        );
      }
    }
  }

  for (const roadmap of roadmapReferences) {
    if (!careerIds.has(roadmap.careerId)) {
      addIssue(
        issues,
        "unknown_roadmap_career",
        "roadmap",
        roadmap.id,
        `Roadmap ${roadmap.id} references unknown career ${roadmap.careerId}.`,
      );
      continue;
    }
    const career = snapshot.careers.find(
      (candidate) => candidate.id === roadmap.careerId,
    )!;
    if (!career.skills.some((skill) => skill.name === roadmap.skill)) {
      addIssue(
        issues,
        "incompatible_roadmap_skill",
        "roadmap",
        roadmap.id,
        `Roadmap ${roadmap.id} skill ${roadmap.skill} is not required by career ${roadmap.careerId}.`,
      );
    }
  }

  return {
    source: snapshot.source,
    generatedAt,
    valid: issues.length === 0,
    summary: {
      careerCount: snapshot.careers.length,
      skillCount: snapshot.skills.length,
      roadmapCount: roadmapReferences.length,
      errorCount: issues.length,
    },
    issues,
  };
}

export async function buildLocalCatalogValidationReport(
  database: DatabasePool = requirePool(),
): Promise<CatalogValidationReport> {
  const snapshot = await loadLocalOntology(database);
  const client = await database.connect();
  try {
    const result = await client.query<RoadmapReferenceRow>(
      "SELECT id, career_id, skill FROM roadmap_steps ORDER BY id",
    );
    return buildCatalogValidationReport(
      snapshot,
      result.rows.map((row) => ({
        id: row.id,
        careerId: row.career_id,
        skill: row.skill,
      })),
    );
  } finally {
    client.release();
  }
}
