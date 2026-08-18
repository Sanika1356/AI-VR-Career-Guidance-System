# Member 2 Backend, AI, and Database Todo

**Owner:** Member 2
**Primary areas:** `server/`, backend-related parts of `docs/`, database design, AI integration, and deployment
**Works with:** Member 1 through the API contract in `docs/api.md`

This checklist contains only work that remains unresolved after auditing the implemented server code, tests, documentation, migrations, and merged feature branches. Completed implementation tasks have been removed rather than left as unchecked items.

## Phase 1 — Local setup and server foundation

- [ ] Create the server environment file from `.env.example` without committing secrets.
- [ ] Run the server lint command once linting is configured, together with the existing build and test checks.

## Phase 2 — Database design and migrations

- [ ] Add a reset or development-only seed procedure that cannot run accidentally in production.
- [ ] Verify the schema on an empty local database.
- [ ] Verify that the seed data supports the complete demo journey.

## Phase 3 — Authentication and profile APIs

- [ ] Add rate limiting or an equivalent protection for authentication endpoints where appropriate.
- [ ] Run an authentication integration session with Member 1.

## Phase 4 — Career catalog APIs

- [ ] Provide Member 1 with realistic API fixtures for UI development.

## Phase 5 — Assessment APIs and scoring

- [ ] Integrate the assessment flow with Member 1 using real API responses.

## Phase 6 — Recommendation engine

- [ ] Provide stable recommendation fixtures to Member 1.
- [ ] Review the recommendation language with the team so it does not imply certainty about a student's future.

## Phase 7 — Skill-gap and roadmap APIs

- [ ] Define matched, partial, and missing status rules.
- [ ] Add tests for partial skills and empty skill sets in addition to the existing matched, missing, and progress tests.
- [ ] Integrate the real skill-gap and roadmap responses with Member 1's pages.

## Phase 8 — AI career advisor

- [ ] Add output length limits and retry rules while preserving the existing input limits, timeout handling, and provider-error fallback.
- [ ] Perform a manual review of representative responses for relevance, clarity, privacy, and unsupported claims.
- [ ] Integrate the advisor endpoint with Member 1's chatbot UI.

The project uses optional local Ollama and a deterministic fallback, so no paid provider key is required. Any future approved provider credentials must remain server-side in environment variables.

## Phase 10 — Security, validation, and quality

- [ ] Review CORS, security headers, request-size limits, and error responses.
- [ ] Add rate limits for authentication and AI endpoints where appropriate.
- [ ] Check for SQL injection, unsafe dynamic queries, and unbounded list responses.
- [ ] Add structured logs that are useful in development and safe in production.
- [ ] Add a health check for the database dependency in addition to the existing API health endpoint.
- [ ] Run database integration and API contract tests in addition to the existing backend test suite.
- [ ] Test the API with an empty database, seeded database, invalid input, unauthorized input, and server failure.
- [ ] Review API behavior with Member 1 using the final client flow.

## Phase 11 — Deployment and operations

- [ ] Choose the approved backend hosting and PostgreSQL hosting approach.
- [ ] Create separate development and production configuration values.
- [ ] Configure production environment variables without committing them.
- [ ] Configure database migrations for deployment.
- [ ] Configure seed data only for approved environments.
- [ ] Configure build, start, health-check, and rollback procedures.
- [ ] Deploy the API to a development or staging environment first.
- [ ] Verify CORS and frontend-to-backend connectivity in staging.
- [ ] Test authentication, assessment, recommendation, skill gap, roadmap, AI, and VR metadata in staging.
- [ ] Add monitoring or at least a documented log-checking procedure.
- [ ] Document how to restart, migrate, inspect logs, and recover the service.
- [ ] Deploy the production API only after both members approve the staging test.

## Phase 12 — Final integration and delivery

- [ ] Run the complete flow with a clean test account.
- [ ] Verify register, login, profile, assessment, recommendations, career details, skill gap, roadmap, AI advisor, and VR metadata.
- [ ] Verify that the frontend never calls the database or AI provider directly.
- [ ] Verify that all API errors are displayed appropriately by the client.
- [ ] Update `docs/api.md` to match the final implementation.
- [ ] Update `docs/architecture.md` and add `docs/database.md` if needed.
- [ ] Remove debug endpoints, test credentials, development-only logs, and unused seed data from production configuration.
- [ ] Document known limitations and future improvements.
- [ ] Help Member 1 rehearse the final demonstration.
- [ ] Review all open issues and close or document each one.
- [ ] Confirm that the deployed service is reachable and healthy.
- [ ] Obtain Member 1's approval before merging the final backend changes.
- [ ] Tag the final release after the complete system test passes.
