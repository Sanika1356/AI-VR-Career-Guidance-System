# Member 2 — Backend, AI, Database, and Deployment Remaining Work

**Owner:** Member 2

**Owns:** `server/`, backend-related documentation, database migrations, API behavior, AI service boundaries, deployment configuration, and backend operations.

**Coordinates with:** Member 1 through `docs/api.md`, pull requests, test accounts, staging checks, and the handoff rules in this file and the client TODO.

This file contains only remaining work. The real backend foundation, authentication, profile, career catalog, assessment, recommendations, skill gap, roadmap, advisor, VR metadata, security hardening, and provider-neutral Render/Neon preparation already exist. Do not reimplement those APIs unless a confirmed contract defect is found.

## 1. Separate-laptop working agreement

| Rule | Backend action |
|---|---|
| Branch ownership | Create a new branch for each backend push using `feature/member2-<short-name>`. Never commit directly to `main`. |
| Pull before work | Start each phase from the latest `origin/main`. Check whether Member 1’s client changes alter the shared contract. |
| File boundary | Modify `server/` for backend work. Modify shared docs or this TODO only when the change is coordinated. Do not edit `client/` unless both members explicitly agree. |
| API source of truth | Update `docs/api.md` when a request, response, auth rule, error, or environment variable changes. Do not leave stale endpoint claims. |
| Secrets | Keep `DATABASE_URL`, `AUTH_SECRET`, `CORS_ORIGIN`, and any future provider credentials in private environment configuration. Never commit real values. |
| Handoff | Before asking Member 1 to consume an endpoint, provide method, path, auth requirement, request example, response example, error behavior, seed/fixture requirement, and tested commit. |
| Merge order | Merge backend contract changes before client code that depends on them. After each merge, both members pull `origin/main` and run their own checks. |
| Completion evidence | Check a task only after the server code, tests, documentation, and a reproducible local or staging check support the claim. |

## 2. Shared delivery gates

| Gate | Backend deliverable | Client dependency | Exit condition |
|---|---|---|---|
| Gate A — Local contract | API docs, environment template, migrations, and seed instructions | Client request wrapper and local environment | Both laptops can run client and server independently. |
| Gate B — Authenticated flow | Register, login, profile, token, and CORS behavior | Browser authentication and profile session | Both members reproduce a clean account flow. |
| Gate C — Learning flow | Assessment, recommendations, career details, skill gap, and roadmap | Real client pages and fixtures | A test account completes the core guidance journey. |
| Gate D — Advisor/VR | Advisor fallback and VR metadata endpoints | Advisor UI and desktop/VR experience | Browser receives safe data and handles provider/server failures. |
| Gate E — Release | Staging database, Render configuration, health, logs, and rollback notes | Deployed client URL and `VITE_API_BASE_URL` | Both members approve the same deployed end-to-end flow. |

## 3. Phase A — Local setup and contract synchronization

- [ ] Create the server environment file from `.env.example` without committing secrets.
- [ ] Verify a clean local PostgreSQL database can apply schema and approved MVP seed migrations.
- [ ] Add a development-only reset or seed procedure that cannot run accidentally in production.
- [ ] Run the server lint command once linting is configured, together with the existing test, typecheck, and build checks.
- [ ] Review `docs/api.md` against the current routes before each client handoff.

**Handoff to Member 1:** Provide local setup commands, required non-secret variable names, migration/seed behavior, and the API commit used for client testing.

## 4. Phase B — Authentication and profile integration

- [ ] Run an authentication integration session with Member 1 using a clean local account.
- [ ] Verify CORS, bearer-token, refresh, logout, expired-token, unauthorized, and validation-error behavior from a browser client.
- [ ] Record any reproducible client/server mismatch with a redacted request, response status, and expected behavior.

**Handoff to Member 1:** Confirm exact auth response fields, token storage expectation, profile update validation, and error payload shape.

## 5. Phase C — Assessment, recommendations, and career details

- [ ] Integrate the assessment flow with Member 1 using real API responses and a real development database.
- [ ] Provide stable recommendation fixtures or a documented seeded account for UI comparison.
- [ ] Compare recommendation score, reason, matched skills, missing skills, career details, resources, roadmap, and VR metadata with the client display.
- [ ] Review recommendation language with both members so it remains guidance and never implies guaranteed employment or outcomes.
- [ ] Test assessment, recommendation, and career endpoints with invalid input, missing records, unauthorized access, empty results, and database failure.

**Handoff to Member 1:** Provide a redacted request/response set and expected UI states for assessment completion, recommendations, empty results, and career details.

## 6. Phase D — Skill gap and roadmap contract

- [ ] Keep the approved MVP skill-gap statuses as `matched` and `missing`.
- [ ] Add per-skill proficiency data and a `partial` status only if both members approve expanding the profile and API contract.
- [ ] Verify roadmap progress persistence, ownership, ordering, zero progress, partial progress, complete progress, and invalid step behavior with the client.
- [ ] Confirm that skill-gap and roadmap errors remain safe, stable, and documented.

**Handoff to Member 1:** Provide the tested skill-gap/roadmap response shapes, progress fixtures, and known limitation that `partial` skill status is not currently supported.

## 7. Phase E — AI advisor operations

- [ ] Add output length limits and retry rules while preserving input limits, timeout handling, and deterministic provider-error fallback.
- [ ] Perform a manual review of representative responses for relevance, clarity, privacy, unsupported claims, and advisory disclaimers.
- [ ] Verify that conversation ownership, continuation, malformed provider output, empty output, and server failure remain safe.
- [ ] Keep provider keys and internal prompts server-side. Local Ollama and the deterministic fallback remain the zero-cost default.

**Handoff to Member 1:** Provide redacted advisor success, fallback, validation-error, timeout, and retry examples. Never send provider keys or internal prompts.

## 8. Phase F — VR metadata and client scene support

- [ ] Keep `GET /api/vr/environments` metadata-only and independent from career, recommendation, and roadmap contracts.
- [ ] Verify the approved MVP environments: AI Engineer and Data Analyst.
- [ ] Add or change VR metadata only after Member 1 explains the scene requirement and both members approve the field.
- [ ] Do not persist VR visits or progress unless the product scope explicitly expands.
- [ ] Test empty, unavailable, disabled, and future-extensible VR catalogs.

**Handoff to Member 1:** Provide the safe metadata response and explain that the client owns scene rendering, device fallback, and WebXR behavior.

## 9. Phase G — Security, validation, and quality

- [ ] Add database integration and API contract tests in addition to the existing backend unit/service suite.
- [ ] Test the API with an empty database, seeded database, invalid input, unauthorized input, provider failure, database failure, and server restart.
- [ ] Review SQL queries, list bounds, CORS, security headers, request limits, rate limits, error responses, and structured logs after any contract change.
- [ ] Review the final browser flow with Member 1 and resolve or document each mismatch.
- [ ] Keep deployment tests free of real credentials and ensure placeholders are clearly identified.

## 10. Phase H — Staging and deployment

- [ ] Deploy the API to a development or staging environment using the approved Render Free and Neon plan, only after the required accounts and credentials are privately available.
- [ ] Configure Render with the current build command, startup migration command, `/api/health` health path, `DATABASE_URL`, `AUTH_SECRET`, and exact frontend `CORS_ORIGIN`.
- [ ] Verify CORS and frontend-to-backend connectivity in staging after Member 1 has a deployed frontend URL.
- [ ] Test authentication, assessment, recommendations, skill gap, roadmap, advisor, and VR metadata in staging.
- [ ] Confirm Render Free startup migrations succeed and never use the paid-only Pre-Deploy Command.
- [ ] Document restart, migration, logs, health checks, rollback, free-tier limitations, and the Neon connection boundary.
- [ ] Deploy the production API only after both members approve the staging test.

**Credential boundary:** Member 2 must stop before account creation, credential entry, payment, upgrade, or live deployment if the required private values are not available. No real secret belongs in Git, chat, screenshots, or TODO files.

## 11. Phase I — Final integration and delivery

- [ ] Run the complete flow with a clean test account: register, login, profile, assessment, recommendations, career details, skill gap, roadmap, advisor, and VR metadata.
- [ ] Verify the frontend never calls the database or AI provider directly.
- [ ] Verify all API errors are displayed appropriately by the client.
- [ ] Update `docs/api.md`, `docs/architecture.md`, and `docs/database.md` to match the final implementation.
- [ ] Remove debug endpoints, test credentials, development-only logs, and unused production seed behavior.
- [ ] Document known limitations, including local-Ollama fallback on hosted Render and WebXR device requirements.
- [ ] Help Member 1 rehearse the final demonstration and desktop VR fallback.
- [ ] Review all open issues and close or document each one.
- [ ] Confirm the deployed service is reachable and healthy.
- [ ] Obtain Member 1’s approval before merging final backend changes.
- [ ] Tag the final release after the complete system test passes.

## 12. Definition of done for Member 2

Member 2’s work is complete when the server builds from a clean checkout, migrations are safe for local and Render Free operation, APIs match `docs/api.md`, secrets remain private, backend tests pass, the staging API is healthy, and both members approve the same deployed end-to-end journey.

The final handoff to Member 1 must include the backend branch and pull request, tested commit, endpoint list, environment variable names without secret values, migration/seed instructions, staging URL, known limitations, and any unresolved client contract issue.
