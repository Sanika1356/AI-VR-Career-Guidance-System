# Catalog Refresh Design

The career catalog is broader than the MVP VR catalog and must remain independently extensible. The current refresh foundation compares two versioned ontology snapshots without changing the established career, recommendation, skill-gap, or roadmap response contracts.

## Implemented local review flow

`server/src/services/catalog-refresh.service.ts` creates a deterministic report containing the source key, source version, license metadata, import timestamp, and added, updated, or removed career and skill records. Updated records list changed field names only. A new report starts in `pending_review`; an explicit approval changes it to `approved`, and an explicit rollback changes it to `rolled_back`. Invalid state transitions fail closed.

This engine is intentionally pure and testable. It does not publish a snapshot automatically, does not fetch third-party data, and does not treat a diff as approval. A future operator-facing pipeline can persist reports and snapshots, require an authorized reviewer, and publish only an approved version.

## Pending operational work

O*NET or ESCO ingestion requires a source-specific licensing, freshness, privacy, and cost review before implementation. A scheduled refresh also requires a safe runtime and non-production rehearsal. Until those approvals and operational controls exist, the project uses the project-authored local catalog and the deterministic review engine only.
