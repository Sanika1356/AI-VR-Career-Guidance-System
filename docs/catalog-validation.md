# Internal Catalog Validation Report

The backend now provides an internal, read-only validation service for the local career and skill ontology. It is implemented in `server/src/services/catalog-validation.service.ts` and can validate an in-memory `OntologySnapshot` or load the current local snapshot and roadmap references through `buildLocalCatalogValidationReport()`.

## Report contract

A report contains the source key, source version, license label, generation timestamp, validity flag, entity counts, error count, and deterministic issue records.

| Field         | Meaning                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| `source`      | Provenance metadata already attached to the ontology snapshot.                                         |
| `generatedAt` | Timestamp at which the report was generated.                                                           |
| `valid`       | `true` only when no validation issues are present.                                                     |
| `summary`     | Career, skill, roadmap, and issue counts.                                                              |
| `issues`      | Structured issue records containing a stable code, entity type, entity ID, and human-readable message. |

The service checks duplicate and malformed stable IDs, missing descriptions or canonical skill names, duplicate career-skill relationships, unknown career-skill references, invalid proficiency levels, duplicate or unknown skill relationships, unknown roadmap careers, and roadmap skills that are not required by their referenced career. Relationship checks are order-independent, so a valid reference may target a skill declared later in the snapshot.

## Safety and scope boundary

The report is derived from local project data and does not call O*NET, ESCO, labor-market services, translation providers, or other external systems. It does not publish, mutate, approve, roll back, or schedule catalog data. It also does not expose a new HTTP endpoint and does not introduce an admin role, owner identity, or authorization mechanism.

> **Pending authorization gate:** An admin-only endpoint remains intentionally pending until the project owner approves a role model and a safe owner/admin identity contract. The internal service must not be treated as an externally reachable administrative API before that decision.

## Evidence

The local test suite covers a consistent snapshot, relationships targeting later-declared skills, duplicate IDs, malformed IDs, missing descriptions and names, orphaned career and skill references, invalid levels, duplicate relationships, and incompatible roadmap references. Run the standard repository checks before integrating changes:

```text
pnpm --dir client check
pnpm --dir server typecheck
pnpm --dir server build
pnpm --dir server test
git diff --check
```
