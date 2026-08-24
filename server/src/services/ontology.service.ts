import { requirePool } from "../db/pool.js";
import type { DatabasePool } from "../db/types.js";

export interface OntologySource {
  key: string;
  version: string;
  license: string;
}

export interface OntologySkill {
  id: string;
  canonicalName: string;
  domain: string;
  aliases: string[];
  prerequisites: string[];
  transferableSkills: string[];
  relatedSkills: string[];
  proficiencyLevels: Array<"beginner" | "intermediate" | "advanced">;
  sourceReferences: string[];
  ontologyVersion: string;
}

export interface OntologyCareerSkill {
  skillId: string;
  name: string;
  requiredLevel: "beginner" | "intermediate" | "advanced";
}

export interface OntologyCareer {
  id: string;
  name: string;
  description: string;
  domain: string;
  aliases: string[];
  skills: OntologyCareerSkill[];
  educationPathways: string[];
  sourceReferences: string[];
  ontologyVersion: string;
}

export interface OntologySnapshot {
  source: OntologySource;
  importedAt: string;
  careers: OntologyCareer[];
  skills: OntologySkill[];
}

interface CareerRow {
  id: string;
  name: string;
  description: string;
  domain: string;
  aliases: unknown;
  education_pathways: unknown;
  source_references: unknown;
  ontology_version: string;
  skills: OntologyCareerSkill[] | string | null;
}

interface SkillRow {
  id: string;
  name: string;
  domain: string;
  aliases: unknown;
  prerequisites: unknown;
  transferable_skills: unknown;
  related_skills: unknown;
  proficiency_levels: unknown;
  source_references: unknown;
  ontology_version: string;
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value))
    return value.filter((item): item is string => typeof item === "string");
  if (typeof value !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function careerSkills(
  value: OntologyCareerSkill[] | string | null,
): OntologyCareerSkill[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as OntologyCareerSkill[]) : [];
  } catch {
    return [];
  }
}

export function validateOntologySnapshot(snapshot: OntologySnapshot): void {
  const careerIds = new Set<string>();
  const skillIds = new Set<string>();
  for (const career of snapshot.careers) {
    if (careerIds.has(career.id))
      throw new Error(`Duplicate career ID: ${career.id}`);
    careerIds.add(career.id);
  }
  for (const skill of snapshot.skills) {
    if (skillIds.has(skill.id))
      throw new Error(`Duplicate skill ID: ${skill.id}`);
    skillIds.add(skill.id);
  }
  for (const career of snapshot.careers) {
    for (const requiredSkill of career.skills) {
      if (!skillIds.has(requiredSkill.skillId)) {
        throw new Error(
          `Career ${career.id} references unknown skill ${requiredSkill.skillId}`,
        );
      }
      if (
        !["beginner", "intermediate", "advanced"].includes(
          requiredSkill.requiredLevel,
        )
      ) {
        throw new Error(
          `Career ${career.id} has an invalid required skill level`,
        );
      }
    }
  }
  for (const skill of snapshot.skills) {
    for (const prerequisite of skill.prerequisites) {
      if (!skillIds.has(prerequisite))
        throw new Error(
          `Skill ${skill.id} references unknown prerequisite ${prerequisite}`,
        );
    }
    for (const relatedSkill of [
      ...skill.relatedSkills,
      ...skill.transferableSkills,
    ]) {
      if (!skillIds.has(relatedSkill)) {
        throw new Error(
          `Skill ${skill.id} references unknown related skill ${relatedSkill}`,
        );
      }
    }
    for (const level of skill.proficiencyLevels) {
      if (!["beginner", "intermediate", "advanced"].includes(level)) {
        throw new Error(`Skill ${skill.id} has an invalid proficiency level`);
      }
    }
  }
}

export async function loadLocalOntology(
  database: DatabasePool = requirePool(),
): Promise<OntologySnapshot> {
  const client = await database.connect();
  try {
    const [careerResult, skillResult] = await Promise.all([
      client.query<CareerRow>(`
        SELECT
          c.id,
          c.name,
          c.description,
          c.domain,
          c.aliases,
          c.education_pathways,
          c.source_references,
          c.ontology_version,
          COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'skillId', s.id,
                'name', s.name,
                'requiredLevel', cs.required_level
              ) ORDER BY s.name
            ) FILTER (WHERE s.id IS NOT NULL),
            '[]'::jsonb
          ) AS skills
        FROM careers c
        LEFT JOIN career_skills cs ON cs.career_id = c.id
        LEFT JOIN skills s ON s.id = cs.skill_id
        GROUP BY c.id
        ORDER BY c.id
      `),
      client.query<SkillRow>(`
        SELECT id, name, domain, aliases, prerequisites, transferable_skills, related_skills, proficiency_levels, source_references, ontology_version
        FROM skills
        ORDER BY id
      `),
    ]);

    const snapshot: OntologySnapshot = {
      source: {
        key: "local-catalog",
        version: "local-mvp-v1",
        license: "project-authored",
      },
      importedAt: new Date().toISOString(),
      careers: careerResult.rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        domain: row.domain,
        aliases: stringArray(row.aliases),
        skills: careerSkills(row.skills),
        educationPathways: stringArray(row.education_pathways),
        sourceReferences: stringArray(row.source_references),
        ontologyVersion: row.ontology_version,
      })),
      skills: skillResult.rows.map((row) => ({
        id: row.id,
        canonicalName: row.name,
        domain: row.domain,
        aliases: stringArray(row.aliases),
        prerequisites: stringArray(row.prerequisites),
        transferableSkills: stringArray(row.transferable_skills),
        relatedSkills: stringArray(row.related_skills),
        proficiencyLevels: stringArray(row.proficiency_levels) as Array<
          "beginner" | "intermediate" | "advanced"
        >,
        sourceReferences: stringArray(row.source_references),
        ontologyVersion: row.ontology_version,
      })),
    };
    validateOntologySnapshot(snapshot);
    return snapshot;
  } finally {
    client.release();
  }
}
