import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCatalogValidationReport,
  type CatalogValidationReport,
} from "../src/services/catalog-validation.service.js";
import type { OntologySnapshot } from "../src/services/ontology.service.js";

function validSnapshot(): OntologySnapshot {
  return {
    source: {
      key: "local-catalog",
      version: "local-mvp-v1",
      license: "project-authored",
    },
    importedAt: "2026-08-24T00:00:00.000Z",
    careers: [
      {
        id: "career_demo",
        name: "Demo Career",
        description: "A local demo career.",
        domain: "technology",
        aliases: [],
        skills: [
          {
            skillId: "skill_advanced",
            name: "Advanced Skill",
            requiredLevel: "intermediate",
          },
        ],
        educationPathways: [],
        sourceReferences: ["local-mvp-v1"],
        ontologyVersion: "local-mvp-v1",
      },
    ],
    skills: [
      {
        id: "skill_advanced",
        canonicalName: "Advanced Skill",
        domain: "technology",
        aliases: [],
        prerequisites: ["skill_foundation"],
        transferableSkills: [],
        relatedSkills: [],
        proficiencyLevels: ["beginner", "intermediate"],
        sourceReferences: ["local-mvp-v1"],
        ontologyVersion: "local-mvp-v1",
      },
      {
        id: "skill_foundation",
        canonicalName: "Foundation Skill",
        domain: "technology",
        aliases: [],
        prerequisites: [],
        transferableSkills: [],
        relatedSkills: [],
        proficiencyLevels: ["beginner"],
        sourceReferences: ["local-mvp-v1"],
        ontologyVersion: "local-mvp-v1",
      },
    ],
  };
}

function issueCodes(report: CatalogValidationReport): string[] {
  return report.issues.map((issue) => issue.code);
}

test("catalog validation accepts a consistent snapshot and later-declared relationship targets", () => {
  const report = buildCatalogValidationReport(
    validSnapshot(),
    [{ id: "roadmap_demo", careerId: "career_demo", skill: "Advanced Skill" }],
    "2026-08-24T01:00:00.000Z",
  );

  assert.equal(report.valid, true);
  assert.deepEqual(report.summary, {
    careerCount: 1,
    skillCount: 2,
    roadmapCount: 1,
    errorCount: 0,
  });
  assert.deepEqual(report.issues, []);
  assert.equal(report.generatedAt, "2026-08-24T01:00:00.000Z");
});

test("catalog validation reports duplicates, orphans, invalid metadata, and roadmap incompatibility", () => {
  const snapshot = validSnapshot();
  snapshot.careers.push({ ...snapshot.careers[0]!, description: "" });
  snapshot.skills.push({
    ...snapshot.skills[0]!,
    id: "bad id",
    canonicalName: "",
    prerequisites: ["skill_unknown", "skill_unknown"],
    transferableSkills: ["skill_unknown"],
    relatedSkills: ["skill_unknown"],
    proficiencyLevels: ["expert"] as never,
  });
  snapshot.skills.push({
    ...snapshot.skills[0]!,
    canonicalName: "Duplicate Skill",
  });
  snapshot.careers[0]!.skills.push(
    {
      skillId: "skill_unknown",
      name: "Unknown Skill",
      requiredLevel: "expert" as never,
    },
    {
      skillId: "skill_advanced",
      name: "Advanced Skill",
      requiredLevel: "intermediate",
    },
  );

  const report = buildCatalogValidationReport(snapshot, [
    { id: "roadmap_missing", careerId: "career_missing", skill: "Anything" },
    {
      id: "roadmap_wrong_skill",
      careerId: "career_demo",
      skill: "Not in career",
    },
  ]);

  assert.equal(report.valid, false);
  assert.ok(report.summary.errorCount > 0);
  assert.ok(issueCodes(report).includes("duplicate_career_id"));
  assert.ok(issueCodes(report).includes("duplicate_skill_id"));
  assert.ok(issueCodes(report).includes("invalid_skill_id"));
  assert.ok(issueCodes(report).includes("missing_career_description"));
  assert.ok(issueCodes(report).includes("missing_skill_name"));
  assert.ok(issueCodes(report).includes("unknown_skill_prerequisite"));
  assert.ok(issueCodes(report).includes("duplicate_skill_relationship"));
  assert.ok(issueCodes(report).includes("unknown_career_skill"));
  assert.ok(issueCodes(report).includes("invalid_required_level"));
  assert.ok(issueCodes(report).includes("invalid_skill_proficiency_level"));
  assert.ok(issueCodes(report).includes("unknown_roadmap_career"));
  assert.ok(issueCodes(report).includes("incompatible_roadmap_skill"));
});
