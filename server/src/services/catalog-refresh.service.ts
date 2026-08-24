import type {
  OntologyCareer,
  OntologySkill,
  OntologySnapshot,
} from "./ontology.service.js";

export type CatalogChangeKind = "added" | "updated" | "removed";
export type CatalogReviewStatus = "pending_review" | "approved" | "rolled_back";

export interface CatalogChange {
  entity: "career" | "skill";
  id: string;
  kind: CatalogChangeKind;
  changedFields: string[];
}

export interface CatalogRefreshReport {
  source: OntologySnapshot["source"];
  previousVersion: string | null;
  nextVersion: string;
  importedAt: string;
  status: CatalogReviewStatus;
  changes: CatalogChange[];
}

function changedFields(
  previous: Record<string, unknown>,
  next: Record<string, unknown>,
): string[] {
  return Object.keys(next)
    .filter(
      (key) => JSON.stringify(previous[key]) !== JSON.stringify(next[key]),
    )
    .sort();
}

function compareEntity<T extends { id: string }>(
  entity: CatalogChange["entity"],
  previous: T[],
  next: T[],
): CatalogChange[] {
  const previousById = new Map(previous.map((item) => [item.id, item]));
  const nextById = new Map(next.map((item) => [item.id, item]));
  const changes: CatalogChange[] = [];

  for (const item of next) {
    const prior = previousById.get(item.id);
    if (!prior) {
      changes.push({ entity, id: item.id, kind: "added", changedFields: [] });
      continue;
    }
    const fields = changedFields(
      prior as Record<string, unknown>,
      item as Record<string, unknown>,
    );
    if (fields.length > 0)
      changes.push({
        entity,
        id: item.id,
        kind: "updated",
        changedFields: fields,
      });
  }
  for (const item of previous) {
    if (!nextById.has(item.id))
      changes.push({ entity, id: item.id, kind: "removed", changedFields: [] });
  }
  return changes.sort((left, right) =>
    `${left.entity}:${left.id}`.localeCompare(`${right.entity}:${right.id}`),
  );
}

export function createCatalogRefreshReport(
  previous: OntologySnapshot | null,
  next: OntologySnapshot,
): CatalogRefreshReport {
  return {
    source: next.source,
    previousVersion: previous?.source.version ?? null,
    nextVersion: next.source.version,
    importedAt: next.importedAt,
    status: "pending_review",
    changes: [
      ...compareEntity<OntologyCareer>(
        "career",
        previous?.careers ?? [],
        next.careers,
      ),
      ...compareEntity<OntologySkill>(
        "skill",
        previous?.skills ?? [],
        next.skills,
      ),
    ],
  };
}

export function approveCatalogRefresh(
  report: CatalogRefreshReport,
): CatalogRefreshReport {
  if (report.status !== "pending_review")
    throw new Error("Only pending catalog refreshes can be approved.");
  return { ...report, status: "approved" };
}

export function rollbackCatalogRefresh(
  report: CatalogRefreshReport,
): CatalogRefreshReport {
  if (report.status !== "approved")
    throw new Error("Only approved catalog refreshes can be rolled back.");
  return { ...report, status: "rolled_back" };
}
