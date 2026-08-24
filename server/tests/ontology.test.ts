import assert from "node:assert/strict";
import test from "node:test";
import type { QueryResult, QueryResultRow } from "pg";
import type { DatabaseClient, DatabasePool } from "../src/db/types.js";
import {
  loadLocalOntology,
  validateOntologySnapshot,
  type OntologySnapshot,
} from "../src/services/ontology.service.js";

function queryResult<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return { rows, rowCount: rows.length, command: "SELECT", oid: 0, fields: [] };
}

class FakeClient implements DatabaseClient {
  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
  ): Promise<QueryResult<T>> {
    if (sql.includes("FROM careers")) {
      return queryResult([
        {
          id: "career_ai_engineer",
          name: "AI Engineer",
          description: "Build intelligent systems.",
          domain: "technology",
          aliases: ["Machine Learning Engineer"],
          source_references: ["local-mvp-catalog-v1"],
          ontology_version: "local-mvp-v1",
          skills: [
            {
              skillId: "skill_python",
              name: "Python",
              requiredLevel: "intermediate",
            },
          ],
        },
      ]) as QueryResult<T>;
    }
    return queryResult([
      {
        id: "skill_python",
        name: "Python",
        domain: "technology",
        aliases: [],
        prerequisites: [],
        transferable_skills: [],
        source_references: ["local-mvp-catalog-v1"],
        ontology_version: "local-mvp-v1",
      },
    ]) as QueryResult<T>;
  }

  release(): void {}
}

test("local ontology adapter preserves stable IDs, domains, levels, and provenance", async () => {
  const database: DatabasePool = { connect: async () => new FakeClient() };
  const snapshot = await loadLocalOntology(database);
  assert.equal(snapshot.source.version, "local-mvp-v1");
  assert.equal(snapshot.careers[0]?.id, "career_ai_engineer");
  assert.equal(snapshot.careers[0]?.domain, "technology");
  assert.deepEqual(snapshot.careers[0]?.skills, [
    {
      skillId: "skill_python",
      name: "Python",
      requiredLevel: "intermediate",
    },
  ]);
  assert.deepEqual(snapshot.skills[0]?.sourceReferences, [
    "local-mvp-catalog-v1",
  ]);
});

test("ontology validator rejects duplicate IDs and unknown skill references", () => {
  const base: OntologySnapshot = {
    source: {
      key: "local-catalog",
      version: "local-mvp-v1",
      license: "project-authored",
    },
    importedAt: new Date().toISOString(),
    careers: [
      {
        id: "career_one",
        name: "Career One",
        description: "A career.",
        domain: "technology",
        aliases: [],
        skills: [
          {
            skillId: "skill_one",
            name: "Skill One",
            requiredLevel: "beginner",
          },
        ],
        sourceReferences: [],
        ontologyVersion: "local-mvp-v1",
      },
    ],
    skills: [
      {
        id: "skill_one",
        canonicalName: "Skill One",
        domain: "technology",
        aliases: [],
        prerequisites: [],
        transferableSkills: [],
        sourceReferences: [],
        ontologyVersion: "local-mvp-v1",
      },
    ],
  };
  assert.doesNotThrow(() => validateOntologySnapshot(base));
  assert.throws(() =>
    validateOntologySnapshot({
      ...base,
      careers: [...base.careers, { ...base.careers[0], id: "career_one" }],
    }),
  );
  assert.throws(() =>
    validateOntologySnapshot({
      ...base,
      careers: [
        {
          ...base.careers[0],
          skills: [
            {
              skillId: "skill_missing",
              name: "Missing",
              requiredLevel: "beginner",
            },
          ],
        },
      ],
    }),
  );
});
