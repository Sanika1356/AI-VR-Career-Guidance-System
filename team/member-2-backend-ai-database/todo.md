# Backend TODO — Remaining Work Only

**Owner:** Member 2 — backend, AI service boundaries, database, deployment, and operations.

All MVP backend implementation, API contracts, database migrations and seed data, authentication, recommendation and skill-gap logic, roadmap and advisor routes, VR catalog, deployment preparation, staging verification, quality gates, and release approval work are complete and have been removed from this active checklist.

Future backend and AI work is tracked in the repository-root [`TODO.md`](../../TODO.md). The backend owner must agree with Member 1 on the shared API/data contract before starting any roadmap item.

## Current backend status

| Area | Status |
|---|---|
| Server TypeScript and production build | Complete and validated |
| Automated backend tests | Complete; 51 default-suite tests pass, with the real PostgreSQL integration path documented separately |
| PostgreSQL schema, migrations, and seed data | Complete for the MVP |
| Authentication and protected API routes | Complete for the MVP |
| Career catalog, recommendations, skill gap, roadmap, advisor, and VR APIs | Complete for the MVP |
| Render/Neon deployment and health checks | Complete and documented |
| Release approval and `v1.0.0` tag | Complete |

## Backend coordination rules for future work

Before implementing a unified-roadmap item, create a `feature/member2-*` branch from the latest approved `main`, update `docs/api.md` and shared types when the contract changes, add migrations and rollback notes, add unit/integration/contract tests, document error behavior and seed requirements, and never commit secrets or real connection strings.

A future item may be moved into this file only when it has been selected from the unified roadmap, assigned to Member 2, and has explicit acceptance criteria. Completed items must be removed from this file after their evidence is merged.
