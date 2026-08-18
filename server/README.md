# Server Workspace

The server is the Node.js, Express, TypeScript API owned primarily by Member 2. It includes configuration loading, JSON parsing, CORS, request IDs, safe request logging, a documented health endpoint, not-found handling, error handling, graceful shutdown, local PostgreSQL migrations, built-in password hashing, signed bearer tokens, and server tests. The implementation does not require a paid API key.

## Local setup

From the repository root, install workspace dependencies with `pnpm install`. Start the API with `pnpm dev:server`; it runs at `http://localhost:4000` by default. Copy `server/.env.example` to `server/.env` when local values need to be customized. The database foundation uses a local PostgreSQL instance; no hosted database is required.

The approved authentication contract uses `Authorization: Bearer <token>`. Passwords are hashed with Node.js built-in `crypto.scrypt`, and tokens are signed with Node.js built-in HMAC cryptography. No Firebase, Auth0, Clerk, or other external authentication service is used.

Run `pnpm --dir server test` for the API and security tests, `pnpm --dir server typecheck` for TypeScript validation, and `pnpm --dir server build` for the production build. After PostgreSQL is running and `DATABASE_URL` is configured, run `pnpm --dir server db:migrate` to apply the SQL files in `server/src/db/migrations/`.

## Zero-cost local resources

PostgreSQL and the `pg` driver are used locally. The optional AI advisor is configured for a local Ollama endpoint at `http://localhost:11434`; its deterministic fallback remains available when Ollama is not installed. Cloud AI endpoints are intentionally disabled by default because they may charge for usage. Do not place provider keys in client files or commit real secrets.

## API foundation

`GET /api/health` returns `{ "status": "ok", "service": "career-guidance-api" }`. Unknown routes return a JSON `404` response. Every response receives an `x-request-id` header for local debugging and future observability.

## Authentication and profile API

`POST /api/auth/register` accepts `name`, `email`, and `password`, creates a user and empty profile in one transaction, and returns `{ user, token }` with HTTP `201`. `POST /api/auth/login` accepts `email` and `password`, verifies the account, and returns the same response shape with HTTP `200`. Duplicate email addresses return a safe `400` response, while invalid credentials return `401` without revealing whether the email exists.

`GET /api/profile` requires `Authorization: Bearer <token>` and returns the authenticated user together with `interests`, `currentSkills`, `experience`, and `learningPreferences`. `PUT /api/profile` updates only those editable fields and performs the write inside a transaction. The server rejects unknown fields, malformed arrays, invalid emails, short passwords, missing bearer tokens, expired tokens, and tokens with invalid signatures.

## Career catalog API

`GET /api/careers` returns the seeded career summaries with stable IDs, descriptions, required skills, and optional `environmentKey` values. `GET /api/careers/:careerId` returns one career with its required skills, free learning resources, roadmap starter steps, and VR environment metadata. The catalog is seeded by `server/src/db/migrations/002_career_catalog.sql`, which is safe to apply repeatedly through the migration runner. Learning resources are public documentation or free-access learning pages and are represented with `free: true`; the server does not call a paid provider to serve the catalog.

## Assessment API

`GET /api/assessment/questions` requires a bearer token, creates an authenticated in-progress assessment, and returns its `assessmentId` together with ordered question and option data. The response intentionally excludes internal scoring weights. `POST /api/assessment/submit` accepts the `assessmentId` and one answer for every published question, validates question-option ownership, stores the answers, calculates deterministic career category scores, and returns `resultId`, `completedAt`, `categoryScores`, and the top career IDs. A submitted assessment cannot be submitted twice. `GET /api/assessment/results/:resultId` returns the result only when it belongs to the authenticated user.

The starter questions and internal scoring weights are seeded by `server/src/db/migrations/003_assessment_seed.sql`. This migration uses local database data only and is safe to apply repeatedly through the migration runner. Scoring weights remain server-side and are never included in the public question response.

## Recommendation API

`GET /api/recommendations` requires a bearer token and uses the user’s latest completed assessment result. The optional `resultId` query parameter requests a specific result owned by the authenticated user. The response returns ranked career recommendations with `careerId`, display name, normalized score, explanation, `matchedSkills`, and `missingSkills`. The ranking is deterministic: assessment category scores provide the career-match signal, current profile skills provide the skill-gap signal, and ties are resolved consistently by matched-skill count and career name.

Recommendation rows are persisted in the `recommendations` table so later roadmap and skill-gap features can reuse the same result. No external AI provider or paid API is used for this phase. A user cannot read recommendations generated from another user’s assessment result.

## Skill-gap API

`GET /api/careers/:careerId/skill-gap` requires a bearer token and compares the authenticated user’s `currentSkills` profile field with the selected career’s required skills. It returns `{ careerId, skills }`, where every skill includes its display name, required level, and either `matched` or `missing` status. Unknown careers return `404`; the endpoint does not expose another user’s profile data and does not require an external API.

## Roadmap API

`GET /api/careers/:careerId/roadmap` requires a bearer token and returns the career’s ordered roadmap steps with `id`, `title`, `description`, `skill`, `order`, and the authenticated user’s `completed` state. `PATCH /api/roadmap/:stepId` accepts only `{ "completed": boolean }` and upserts progress for the authenticated user. A user cannot update or read another user’s progress, and missing careers or roadmap steps return safe `404` responses.

## AI advisor API

`POST /api/advisor/chat` requires a bearer token and accepts `{ "message": string, "careerId"?: string, "conversationId"?: string }`. The message must be between 3 and 2,000 characters; unknown fields are rejected. A new conversation is created when `conversationId` is omitted. Existing conversations are checked for ownership before any message is read or written.

The advisor assembles only the authenticated user’s approved profile, latest assessment summary, selected career, skill-gap information, and roadmap progress. The server-side prompt instructs the advisor to provide practical educational guidance, avoid guaranteed employment claims or high-stakes decisions, and never invent unavailable user information. Conversations and user/assistant messages are persisted in PostgreSQL for the authenticated user.

The default provider is local Ollama, configured through `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, and `AI_REQUEST_TIMEOUT_MS`. Ollama is optional: if it is unavailable or returns an error, the API uses a deterministic fallback response derived from the same career context and still returns a stable response shape. No hosted AI service or paid API key is required, and provider credentials—if a future approved provider is added—must remain server-side in environment variables.

## Security and quality hardening

The server applies a `1mb` JSON request-size limit, disables Express fingerprinting, validates the configured CORS origin, and adds `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` headers without changing JSON response bodies. Authentication and advisor routes use configurable in-memory rate limits from `AUTH_RATE_LIMIT_*` and `AI_RATE_LIMIT_*`; rate-limited responses return `429` with a `Retry-After` header. These limits are appropriate for the zero-cost local MVP; a horizontally scaled deployment should use an approved shared limiter before production.

Requests and unexpected server errors are logged as structured JSON containing request ID, method, path, status, duration, and safe error metadata. Request bodies, passwords, bearer tokens, provider keys, and database connection strings are not logged. Unknown errors return the same generic `500` response shape to clients.

`GET /api/health` remains the lightweight API liveness endpoint with its existing response shape. `GET /api/health/dependencies` checks the PostgreSQL dependency and returns `200` with `{ "status": "ok", "service": "career-guidance-api", "database": "ok" }` when available, or `503` with the same safe shape and `database: "unavailable"` when the database is not configured or cannot be reached.

## VR environment API

`GET /api/vr/environments` returns `{ "environments": [...] }` with safe metadata for the client career hub. Each item contains only `key`, `careerId`, `title`, `description`, and `available`; the server does not expose scene files, provider credentials, internal database fields, or implementation details. The endpoint is public because it serves non-sensitive catalog metadata.

The MVP seeds two high-quality environments: `ai-engineer-lab` for `career_ai_engineer` and `data-insights-studio` for `career_data_analyst`. The broader career catalog remains independent, so careers can exist without VR environments. Additional environments can be added later as rows in `vr_environments` without changing the core career, recommendation, or roadmap contracts.

The MVP does not record VR visits or VR progress. The client owns the 3D/VR scene and uses the environment metadata to select an experience; future progress requirements must be agreed through a backward-compatible contract change.

## Deployment and operations

The repository does not select a hosting provider or PostgreSQL vendor. That decision requires approval from both members and must preserve the zero-cost constraint. Until a provider is approved, the supported deployment process is provider-neutral and works with any Node.js runtime and PostgreSQL instance that can supply the documented environment variables.

Build and start the server with `pnpm --dir server build` followed by `pnpm --dir server start`. Run `pnpm --dir server typecheck` and `pnpm --dir server test` before a release. Configure `NODE_ENV=production`, a strong `AUTH_SECRET`, `DATABASE_URL`, `CORS_ORIGIN` set to the deployed frontend origin, and the approved rate-limit and AI settings. Keep `RUN_SEED_DATA=false` in production unless demo seed data has been explicitly approved; local development defaults to `true`.

Apply database migrations before starting the new server version with `pnpm --dir server db:migrate`. The migration runner applies each SQL file transactionally, records applied versions in `schema_migrations`, skips already-applied versions, and skips seed/catalog migrations when `RUN_SEED_DATA=false`. A failed migration exits nonzero; deployment should stop and preserve the previous healthy release rather than starting against an unknown schema.

Use `GET /api/health` for a lightweight process check and `GET /api/health/dependencies` for a PostgreSQL dependency check. A restart procedure is: stop the current process gracefully with `SIGTERM`, apply approved migrations, start `node dist/server.js`, then verify both health endpoints and the frontend CORS origin. A rollback should stop the new process, restore the previous application artifact and compatible environment, and only reverse database changes through a separately reviewed migration; never edit `schema_migrations` manually.

The server emits structured JSON request and error logs. Operators should retain request IDs when investigating failures, inspect status and duration fields, and avoid recording request bodies, passwords, tokens, provider keys, or database URLs. The current in-memory rate limiter is suitable for the local MVP; a multi-instance deployment requires an approved shared limiter before production scaling.

## Ownership

Member 2 owns routes, controllers, services, validators, database access, models, migrations, authentication, recommendation logic, skill-gap logic, roadmap logic, AI integration, tests, and deployment configuration. Member 1 should consume the documented API rather than accessing database tables directly.

## Suggested server flow

```text
Route → validation middleware → controller → service → database/provider → response
```

Routes should remain small. Business rules belong in services, request validation belongs in validators, and database operations belong in the database/model layer. External AI credentials must remain on the server and must never be sent to the client.
