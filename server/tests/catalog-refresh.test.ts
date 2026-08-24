import assert from "node:assert/strict";
import test from "node:test";
import {
  approveCatalogRefresh,
  createCatalogRefreshReport,
  rollbackCatalogRefresh,
} from "../src/services/catalog-refresh.service.js";
import type { OntologySnapshot } from "../src/services/ontology.service.js";

function snapshot(version: string, careerName: string): OntologySnapshot {
  return {
    source: { key: "local-catalog", version, license: "project-authored" },
    importedAt: "2026-08-24T00:00:00.000Z",
    careers: [
      {
        id: "career_ai_engineer",
        name: careerName,
        description: "Build intelligent systems.",
        domain: "technology",
        aliases: [],
        educationPathways: [],
        skills: [],
        sourceReferences: ["local-mvp-catalog-v1"],
        ontologyVersion: version,
      },
    ],
    skills: [
      {
        id: "skill_python",
        canonicalName: "Python",
        domain: "technology",
        aliases: [],
        prerequisites: [],
        transferableSkills: [],
        relatedSkills: [],
        proficiencyLevels: ["beginner", "intermediate", "advanced"],
        sourceReferences: ["local-mvp-catalog-v1"],
        ontologyVersion: version,
      },
    ],
  };
}

test("catalog refresh report identifies changed records and requires review", () => {
  const report = createCatalogRefreshReport(
    snapshot("local-mvp-v1", "AI Engineer"),
    snapshot("local-mvp-v2", "Applied AI Engineer"),
  );
  assert.equal(report.status, "pending_review");
  assert.equal(report.previousVersion, "local-mvp-v1");
  assert.equal(report.nextVersion, "local-mvp-v2");
  assert.deepEqual(report.changes, [
    {
      entity: "career",
      id: "career_ai_engineer",
      kind: "updated",
      changedFields: ["name", "ontologyVersion"],
    },
    {
      entity: "skill",
      id: "skill_python",
      kind: "updated",
      changedFields: ["ontologyVersion"],
    },
  ]);
});

test("catalog refresh approval and rollback are explicit state transitions", () => {
  const report = createCatalogRefreshReport(
    null,
    snapshot("local-mvp-v1", "AI Engineer"),
  );
  const approved = approveCatalogRefresh(report);
  assert.equal(approved.status, "approved");
  assert.equal(rollbackCatalogRefresh(approved).status, "rolled_back");
  assert.throws(() => rollbackCatalogRefresh(report));
});
