# Member 2 — Backend, AI, Database, and Deployment Remaining Work

**Owner:** Member 2

**Scope:** `server/`, backend-related documentation, database migrations, API behavior, AI service boundaries, deployment configuration, and backend operations.

**Coordination:** Member 1 works independently on `client/`. The shared contract is `docs/api.md`; neither member should invent fields, endpoints, credentials, or direct database/provider access. Completed backend implementation phases are intentionally omitted from this file because they have already been implemented, tested, and pushed on their dedicated `feature/member2-*` branches.

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

## 2. Current implementation baseline

The backend foundation, authentication, profile, career catalog, assessment, recommendations, skill gap, roadmap, advisor, VR metadata, security hardening, migration safety, and Render/Neon preparation are complete. The verified backend quality gate is TypeScript-clean with a passing production build, **51 passing default-suite tests**, and **52 passing tests when the real-PostgreSQL integration test is enabled**.

The MVP contract remains intentionally zero-cost and provider-neutral: local PostgreSQL is supported for development, local Ollama is optional with a deterministic fallback, Render Free hosts the API, Neon Free supplies PostgreSQL, the career catalog is broader than the VR catalog, and the VR MVP contains only AI Engineer and Data Analyst environments. The MVP skill-gap statuses are only `matched` and `missing`; profile `goals` and `partial` skill status are not supported.

## 3. Phase H — Staging and deployment, approval-gated

These tasks require the user’s deployed-service confirmation or private credentials. Do not create an account, enter credentials, change a live service, or perform a production deployment without explicit user approval.

- [ ] Confirm with the user that the Render backend has a private `DATABASE_URL` for the approved Neon database, a strong `AUTH_SECRET`, the correct deployed frontend origin in `CORS_ORIGIN`, and the intended `RUN_SEED_DATA` setting for the MVP staging/demo database.
- [ ] Confirm that Render uses `pnpm install --frozen-lockfile && pnpm --dir server build` for Build Command and `pnpm --dir server db:migrate && pnpm --dir server start` for Start Command; do not use Render’s paid-only Pre-Deploy Command.
- [ ] Verify the deployed API health endpoints, including `/api/health` and `/api/health/dependencies`, after the user confirms the private environment values are present.
- [ ] Coordinate with Member 1 to verify CORS and frontend-to-backend connectivity using the deployed frontend URL and `VITE_API_BASE_URL` ending in `/api`.
- [ ] Run the complete staging journey with a clean test account: register, login, profile, assessment, recommendations, career details, skill gap, roadmap, advisor fallback, and VR metadata.
- [ ] Confirm Render startup migrations are idempotent, seeded catalog data is present when approved, and no migration or seed secret appears in logs.
- [ ] Deploy or promote the production API only after both members approve the staging journey and the user explicitly approves the live deployment action.

## 4. Phase I — Final integration and delivery

Complete these after Phase H is verified and Member 1 has reviewed the deployed client/API contract.

- [ ] Run one final clean-account browser flow with Member 1 and record every mismatch with a redacted request, response status, and expected behavior.
- [ ] Verify the frontend calls only the documented API and never connects directly to PostgreSQL or Ollama/another AI provider.
- [ ] Verify the client displays the documented validation, unauthorized, not-found, rate-limit, provider-fallback, and server-error states appropriately.
- [ ] Confirm the final shared documentation remains aligned: `docs/api.md`, `docs/architecture.md`, `docs/database.md`, and `server/README.md`.
- [ ] Document known MVP limitations: Render Free cold starts and staging suitability, local-Ollama availability on hosted Render with deterministic fallback, in-memory rate limiting for a single instance, no persisted VR visits/progress, and WebXR/device requirements.
- [ ] Confirm no debug endpoints, test credentials, provider keys, raw tokens, passwords, database URLs, or unsafe development-only logging are present in the release artifact.
- [ ] Help Member 1 rehearse the final demonstration, including desktop fallback when WebXR is unavailable.
- [ ] Review all open issues and either close them or document an owner and follow-up decision.
- [ ] Obtain Member 1’s approval for the final backend/client integration and then tag the final release after the complete system test passes.

## 5. Final handoff package

The final handoff must include the merged backend commit and pull request, endpoint and environment-variable references without secret values, migration and seed instructions, staging URL and health evidence, known limitations, and any unresolved client contract issue. The project is complete only when the server builds from a clean checkout, migrations are safe for local and Render Free startup, tests pass, the deployed API is healthy, and both members approve the same end-to-end journey.
