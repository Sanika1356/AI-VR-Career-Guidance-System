# Member 2 Todo: Backend + AI + Database

**Owner:** Member 2
**Primary areas:** `server/`, backend-related parts of `docs/`, database design, AI integration, and deployment
**Works with:** Member 1 through the API contract in `docs/api.md`

This checklist covers the complete project from repository setup to final delivery. Check items only after the implementation has been tested and documented.

## Phase 0 — Understand the project and agree with Member 1

- [ ] Read the root `README.md`, `docs/architecture.md`, and `docs/api.md`.
- [ ] Confirm the backend stack with Member 1: Node.js, Express, TypeScript, PostgreSQL, and the selected database client or ORM.
- [ ] Confirm the authentication approach, token/session behavior, password policy, and protected-route rules.
- [ ] Confirm the frontend's required data fields, loading expectations, error format, pagination needs, and date format.
- [ ] Confirm the initial career catalog, assessment categories, scoring approach, skill levels, and roadmap format.
- [ ] Confirm the AI advisor scope, provider, model configuration, rate limits, fallback behavior, and privacy boundaries.
- [ ] Confirm the minimum viable user journey: register, login, assessment, recommendations, career details, skill gap, roadmap, AI advisor, and VR metadata.
- [ ] Record agreed backend assumptions in `docs/architecture.md` and `docs/api.md`.

## Phase 1 — Local setup and server foundation

- [ ] Clone the repository and configure Git identity.
- [ ] Create a branch named `feature/member2-backend-foundation`.
- [ ] Initialize the TypeScript server inside `server/`.
- [ ] Add Express, CORS, environment configuration, validation, logging, and the agreed PostgreSQL library or ORM.
- [ ] Create the server environment file from `.env.example` without committing secrets.
- [ ] Add a clear development start command and verify that the server runs locally.
- [ ] Configure TypeScript, linting, formatting, and test tooling.
- [ ] Create the server folders: config, db, middleware, models, routes, controllers, services, validators, utils, and types.
- [ ] Implement the application entry point and graceful shutdown behavior.
- [ ] Add a centralized configuration loader with required-variable checks.
- [ ] Add JSON parsing, CORS configuration, request IDs, logging, and a consistent error handler.
- [ ] Add `GET /api/health` returning the documented status response.
- [ ] Add a simple not-found handler for unknown API routes.
- [ ] Add server unit-test and integration-test scaffolding.
- [ ] Add a server README with local setup, database setup, test, and migration commands.
- [ ] Run the server build, lint, and tests.
- [ ] Commit the foundation with a focused message and open a pull request.

## Phase 2 — Database design and migrations

- [ ] Design the PostgreSQL schema for users, profiles, skills, careers, career skills, assessment questions, assessment options, assessments, answers, results, recommendations, roadmap steps, roadmap progress, conversations, messages, and VR environments.
- [ ] Decide which entities require stable public IDs and document the convention.
- [ ] Add foreign keys, unique constraints, not-null constraints, indexes, and appropriate delete behavior.
- [ ] Create the first migration.
- [ ] Create a safe migration command for a new developer environment.
- [ ] Create seed data for the initial careers, skills, assessment questions, and roadmap examples.
- [ ] Add a reset or development-only seed procedure that cannot run accidentally in production.
- [ ] Verify the schema on an empty local database.
- [ ] Verify that the seed data supports the complete demo journey.
- [ ] Document the schema and seed procedure in `docs/database.md`.
- [ ] Add database tests for constraints and important relationships.

## Phase 3 — Authentication and profile APIs

- [ ] Implement the user model and profile model.
- [ ] Implement secure password hashing and password comparison.
- [ ] Implement `POST /api/auth/register` according to `docs/api.md`.
- [ ] Implement `POST /api/auth/login` according to `docs/api.md`.
- [ ] Implement the agreed token or secure session mechanism.
- [ ] Implement authentication middleware.
- [ ] Implement authorization checks for user-owned resources.
- [ ] Implement `GET /api/profile`.
- [ ] Implement `PUT /api/profile` with request validation.
- [ ] Add duplicate-email handling without leaking unnecessary account information.
- [ ] Add invalid-credentials, expired-session, and malformed-token handling.
- [ ] Add rate limiting or an equivalent protection for authentication endpoints where appropriate.
- [ ] Add tests for registration, login, protected access, profile retrieval, profile update, and unauthorized access.
- [ ] Run an authentication integration session with Member 1.
- [ ] Update the API contract if an agreed response field changes.

## Phase 4 — Career catalog APIs

- [ ] Implement career and skill models.
- [ ] Implement the career-to-required-skill relationship.
- [ ] Implement `GET /api/careers`.
- [ ] Implement `GET /api/careers/:careerId`.
- [ ] Implement validation for unknown career IDs.
- [ ] Return stable, frontend-friendly career and skill response shapes.
- [ ] Include the VR environment key only when the environment is available.
- [ ] Add tests for career list, career detail, unknown career, missing optional data, and stable ordering.
- [ ] Provide Member 1 with realistic API fixtures for UI development.

## Phase 5 — Assessment APIs and scoring

- [ ] Implement assessment question and option models.
- [ ] Implement assessment session creation or the agreed assessment lifecycle.
- [ ] Implement `GET /api/assessment/questions` without exposing answer keys or private scoring weights.
- [ ] Implement request validation for answer IDs and question IDs.
- [ ] Implement `POST /api/assessment/submit`.
- [ ] Prevent duplicate or invalid answer submissions according to the agreed product behavior.
- [ ] Store answers and completion time safely.
- [ ] Implement `GET /api/assessment/results/:resultId`.
- [ ] Define and document the scoring dimensions, such as interest, aptitude, personality, and skills.
- [ ] Implement deterministic scoring with test fixtures before adding AI-based features.
- [ ] Add tests for a complete assessment, incomplete answers, invalid options, duplicate submissions, and result ownership.
- [ ] Integrate the assessment flow with Member 1 using real API responses.

## Phase 6 — Recommendation engine

- [ ] Define the recommendation input fields and scoring weights.
- [ ] Implement the recommendation service using assessment results, profile data, and available skills.
- [ ] Normalize and rank scores consistently.
- [ ] Implement the top-career selection rule.
- [ ] Generate a concise, explainable reason for each recommendation.
- [ ] Include matched and missing skills where supported by the data.
- [ ] Implement `GET /api/recommendations`.
- [ ] Decide how recommendations behave before a user completes an assessment.
- [ ] Add tests for ranking order, ties, missing inputs, score boundaries, and reproducibility.
- [ ] Provide stable recommendation fixtures to Member 1.
- [ ] Review the recommendation language with the team so it does not imply certainty about a student's future.

## Phase 7 — Skill-gap and roadmap APIs

- [ ] Implement the user's skill profile and skill-level representation.
- [ ] Implement the career-required-skill representation.
- [ ] Implement the skill-gap calculation.
- [ ] Define matched, partial, and missing status rules.
- [ ] Implement `GET /api/careers/:careerId/skill-gap`.
- [ ] Implement roadmap-step models and ordering.
- [ ] Implement `GET /api/careers/:careerId/roadmap`.
- [ ] Implement `PATCH /api/roadmap/:stepId` for completion updates.
- [ ] Ensure users can update only their own roadmap progress.
- [ ] Add tests for matched skills, missing skills, partial skills, empty skill sets, and progress updates.
- [ ] Integrate the real skill-gap and roadmap responses with Member 1's pages.

## Phase 8 — AI career advisor

- [ ] Read the selected AI provider documentation and confirm the approved server-side integration method.
- [ ] Add the provider key and model name only through environment variables.
- [ ] Create a server-side AI service with a narrow interface that can be tested independently.
- [ ] Build the context assembly step using only the user's approved profile, assessment, selected career, skill gap, and roadmap data.
- [ ] Create the system prompt and response rules for the career advisor.
- [ ] Prevent the advisor from claiming guaranteed employment, making high-stakes decisions, or inventing unavailable user data.
- [ ] Add input length limits, output length limits, timeout handling, retry rules, and provider-error handling.
- [ ] Implement conversation and message persistence only if required by the agreed scope.
- [ ] Implement `POST /api/advisor/chat` according to `docs/api.md`.
- [ ] Return a stable response even when the provider is temporarily unavailable.
- [ ] Add logging that excludes passwords, tokens, provider keys, and unnecessary personal data.
- [ ] Add tests with a mocked AI provider so tests do not require live provider calls.
- [ ] Perform a manual review of representative responses for relevance, clarity, privacy, and unsupported claims.
- [ ] Integrate the advisor endpoint with Member 1's chatbot UI.

## Phase 9 — VR support APIs and demo data

- [ ] Implement the VR environment model or configuration source.
- [ ] Add `GET /api/vr/environments`.
- [ ] Return only safe metadata needed by the client scene selector.
- [ ] Verify that every career intended for the demo has a matching environment key.
- [ ] Decide whether the server records VR visits or progress; implement only if required.
- [ ] Add demo data for the AI Engineer and Data Scientist environments.
- [ ] Test unavailable or disabled environments.
- [ ] Coordinate the final VR metadata shape with Member 1 before the 3D integration.

## Phase 10 — Security, validation, and quality

- [ ] Validate every request body, query parameter, route parameter, and authorization condition.
- [ ] Ensure passwords are never returned in API responses or logs.
- [ ] Ensure tokens and AI provider keys are never committed or printed.
- [ ] Review CORS, security headers, request-size limits, and error responses.
- [ ] Add rate limits for authentication and AI endpoints where appropriate.
- [ ] Check for SQL injection, unsafe dynamic queries, and unbounded list responses.
- [ ] Add database transaction handling for multi-step writes such as assessment submission.
- [ ] Add structured logs that are useful in development and safe in production.
- [ ] Add health checks for the API and database dependency.
- [ ] Run unit, integration, and API contract tests.
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
