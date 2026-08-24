# Member 2 — Backend, AI, Database, and Deployment Remaining Work

**Owner:** Member 2

**Scope:** `server/`, backend-related documentation, database migrations, API behavior, AI service boundaries, deployment configuration, and backend operations.

**Coordination:** Member 1 works independently on `client/`. The shared contract is `docs/api.md`; neither member should invent fields, endpoints, credentials, or direct database/provider access. Completed implementation and staging tasks are intentionally omitted from this file.

## 1. Separate-laptop working agreement

| Rule | Backend action |
|---|---|
| Branch ownership | Create a new `feature/member2-*` branch for every backend push. Never commit directly to `main`. |
| Pull before work | Start each new phase from the latest approved backend/main state and check whether Member 1 changes alter the shared API contract. |
| File boundary | Modify `server/` for backend work. Modify shared docs or this TODO only when the contract or handoff requires it. Do not modify `client/` unless both members explicitly agree. |
| API source of truth | Keep `docs/api.md`, backend behavior, and the client request wrapper aligned. Record any contract change before implementation. |
| Secrets | Keep `DATABASE_URL`, `AUTH_SECRET`, `CORS_ORIGIN`, and any future provider credentials in private environment configuration. Never commit or paste real values into Git, chat, screenshots, or TODO files. |
| Handoff evidence | Before Member 1 consumes an endpoint, provide method, path, auth requirement, request/response examples, error behavior, seed requirement, and tested commit. |
| Completion evidence | Check a task only after code, tests, documentation, and a reproducible local or approved staging check support the claim. |

## 2. Completed baseline

The backend implementation phases, documentation cleanup, deployment configuration, frozen-lockfile repair, and staging verification are complete. The backend quality gate passed with a clean TypeScript check, a passing production build, 51 passing default-suite tests, and 52 passing tests when the real-PostgreSQL integration test was enabled.

The staging record is available at `docs/staging-verification.md`. It documents the verified Render frontend/API targets, CORS and health behavior, clean-account API journey, browser flow, broader career catalog, advisor fallback, ordered roadmap, and the two approved MVP VR environments.

## 3. Release completed

The user explicitly approved production promotion on 24 August 2026. The verified release candidate was checked on `origin/main`, the deployed API and database dependency health endpoints returned HTTP 200, and the annotated release tag `v1.0.0` was published at commit `b7e37aede9a4cb0c3297744300ca35411221fabe`.

## 4. Final handoff package

The final handoff must include the merged backend commit and pull request, endpoint and environment-variable references without secret values, migration and seed instructions, staging URL and health evidence, `docs/staging-verification.md`, known limitations, and any unresolved client contract issue. The project is complete only when the server builds from a clean checkout, migrations are safe for local and Render Free startup, tests pass, the deployed API is healthy, and both members approve the same end-to-end journey.
