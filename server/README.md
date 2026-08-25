# Server Workspace

The server is the Node.js, Express, TypeScript API owned primarily by Member 2. It includes configuration loading, JSON parsing, CORS, request IDs, safe request logging, a documented health endpoint, not-found handling, error handling, graceful shutdown, local PostgreSQL migrations, built-in password hashing, signed bearer tokens, and server tests. The implementation does not require a paid API key.

## Local setup

From the repository root, install workspace dependencies with `pnpm install`. Start the API with `pnpm dev:server`; it runs at `http://localhost:4000` by default. Copy `server/.env.example` to `server/.env` when local values need to be customized. The database foundation uses a local PostgreSQL instance; no hosted database is required.

The approved authentication contract uses `Authorization: Bearer <token>`. Passwords are hashed with Node.js built-in `crypto.scrypt`, and tokens are signed with Node.js built-in HMAC cryptography. No Firebase, Auth0, Clerk, or other external authentication service is used.

Run `pnpm --dir server test` for the API and security tests, `RUN_DB_INTEGRATION_TESTS=true pnpm --dir server test` for the opt-in real-PostgreSQL API flow, `pnpm --dir server typecheck` for TypeScript validation, and `pnpm --dir server build` for the production build. After PostgreSQL is running and `DATABASE_URL` is configured, run `pnpm --dir server db:migrate` to apply the SQL files in `server/src/db/migrations/`. For a disposable local database, `pnpm --dir server db:reset` drops and recreates the public schema, then reapplies all approved schema and seed migrations. The reset command refuses production mode and refuses non-local database hosts; never run it against Neon or another shared database.

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

The advisor assembles only the authenticated user’s approved profile, latest assessment summary, selected career, skill-gap information, and roadmap progress. The server-side prompt marks these sections as untrusted data, strips control characters and bounds context before provider use, instructs the advisor to ignore embedded instructions, and requires practical educational guidance without guaranteed employment claims or high-stakes decisions. Conversations and user/assistant messages are persisted in PostgreSQL for the authenticated user.

Gemini is the hosted provider path when `GEMINI_ENABLED=true` and `GEMINI_API_KEY` is configured. It uses Google’s current Interactions API at `/v1beta/interactions`, sends the normalized bare model ID in `model`, the grounded prompt in `input`, uses `store: false` to avoid provider-side conversation retention, and bounds output through `generation_config.max_tokens`. Set `GEMINI_MODEL` (default `gemini-2.5-flash`), `GEMINI_BASE_URL`, and `GEMINI_MAX_OUTPUT_TOKENS` server-side; never place the key in a `VITE_*` variable or commit it. Use a Gemini Free Tier project and do not enable billing if the goal is zero cost; Google still applies project-specific model and request limits. The advisor sends grounded profile, assessment, catalog, roadmap, and recent owned conversation context as untrusted data and asks Gemini for a detailed conversational answer. Local Ollama remains an alternative when `OLLAMA_ENABLED=true`, `OLLAMA_BASE_URL`, and `OLLAMA_MODEL` are reachable. If Gemini/Ollama is disabled, unavailable, returns an error, produces empty output, or is temporarily circuit-open, the API returns a detailed deterministic fallback with `mode: deterministic_fallback` rather than a generic provider error. `AI_RETRY_ATTEMPTS` controls bounded retries, capped at two retries by server configuration, `AI_MAX_RESPONSE_CHARS` bounds the stored and returned answer length with a default of 4,000 characters, and `AI_CIRCUIT_FAILURE_THRESHOLD` / `AI_CIRCUIT_COOLDOWN_MS` bound repeated provider failures before a cooldown probe is allowed. Provider credentials must remain server-side in environment variables. For operational diagnosis, the server emits sanitized `advisor_provider_selected`, `advisor_provider_succeeded`, and `advisor_provider_fallback` events. These include only the selected provider, boolean Gemini/Ollama configuration state, duration, a failure category, and an upstream HTTP status when applicable; they never include prompts, response bodies, URLs containing credentials, or provider keys. A `gemini` selection followed by `authentication`, `quota`, `upstream_http`, `timeout`, `network`, `response_shape`, or `empty_response` identifies a Gemini call that was attempted but failed. A `none` selection indicates that `GEMINI_ENABLED` was not parsed as `true`, the key was missing/blank, and Ollama was disabled. A successful Gemini request emits `advisor_provider_succeeded` and returns `mode: provider`.

## Security and quality hardening

The server applies a `1mb` JSON request-size limit, disables Express fingerprinting, validates the configured CORS origin, and adds `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` headers without changing JSON response bodies. Authentication and advisor routes use configurable in-memory rate limits from `AUTH_RATE_LIMIT_*` and `AI_RATE_LIMIT_*`; rate-limited responses return `429` with a `Retry-After` header. These limits are appropriate for the zero-cost local MVP; a horizontally scaled deployment should use an approved shared limiter before production.

Requests and unexpected server errors are logged as structured JSON containing request ID, method, path, status, duration, and safe error metadata. Request bodies, passwords, bearer tokens, provider keys, and database connection strings are not logged. Unknown errors return the same generic `500` response shape to clients.

`GET /api/health` remains the lightweight API liveness endpoint with its existing response shape. `GET /api/health/dependencies` checks the PostgreSQL dependency and returns `200` with `{ "status": "ok", "service": "career-guidance-api", "database": "ok" }` when available, or `503` with the same safe shape and `database: "unavailable"` when the database is not configured or cannot be reached.

## VR environment API

`GET /api/vr/environments` returns `{ "environments": [...] }` with safe metadata for the client career hub. Each item contains only `key`, `careerId`, `title`, `description`, and `available`; the server does not expose scene files, provider credentials, internal database fields, or implementation details. The endpoint is public because it serves non-sensitive catalog metadata.

The MVP seeds two high-quality environments: `ai-engineer-lab` for `career_ai_engineer` and `data-insights-studio` for `career_data_analyst`. The broader career catalog remains independent, so careers can exist without VR environments. Additional environments can be added later as rows in `vr_environments` without changing the core career, recommendation, or roadmap contracts.

The MVP does not record VR visits or VR progress. The client owns the 3D/VR scene and uses the environment metadata to select an experience; future progress requirements must be agreed through a backward-compatible contract change.

## Deployment and operations

The approved deployment target for the college-project MVP is **Render Free** for the Node.js API and **Neon Free** for PostgreSQL. This repository contains preparation only; no Render or Neon account was created, no project was provisioned, and no credentials were requested. Local Node.js plus local PostgreSQL remains the supported fallback.

Render’s official [free deployment documentation](https://render.com/docs/free) describes Free web services as suitable for testing, hobby projects, and previews rather than production applications. It documents 750 free instance hours per workspace per calendar month, automatic sleep after inactivity, cold-start latency, and ephemeral local filesystem behavior. The API therefore stores durable state only in PostgreSQL and should be treated as a staging/demo service until the team approves a production plan. Neon’s official [plans documentation](https://neon.com/docs/introduction/plans) lists the Free plan at $0/month for prototypes and small teams, with included project, branch, compute, storage, and network-transfer limits. Usage must remain within the included limits to preserve the zero-cost goal.

`server/render.yaml` is a minimal Render Blueprint. Its build command uses `pnpm install --frozen-lockfile && pnpm --dir server build`; the root workspace lockfile is synchronized with both workspace manifests, so reproducible CI-style installation is expected. Because Render Free does not provide the paid-only Pre-Deploy Command, its Start Command is `pnpm --dir server db:migrate && pnpm --dir server start`; this applies pending migrations before the API starts and fails closed if migration fails. It sets `RUN_SEED_DATA=true` for the MVP so approved catalog migrations can apply on first startup, while the migration runner safely skips versions already recorded in `schema_migrations`. The manifest marks `DATABASE_URL`, `AUTH_SECRET`, and `CORS_ORIGIN` as values that must be supplied privately in the Render environment. It does not define a Render database because the approved database is Neon. `server/deployment/neon.env.example` shows the placeholder-only Neon connection shape; never commit a real connection string or password. The verified free-tier notes are retained in `server/deployment-free-tier-findings.md`.

Build and start the server with `pnpm --dir server build` followed by `pnpm --dir server start`. Run `pnpm --dir server typecheck` and `pnpm --dir server test` before a release. Configure `NODE_ENV=production`, a strong `AUTH_SECRET`, `DATABASE_URL`, `CORS_ORIGIN` set to the deployed frontend origin, and the approved rate-limit and AI settings. Keep `RUN_SEED_DATA=false` in production unless demo seed data has been explicitly approved; local development defaults to `true`.

Apply database migrations locally with `pnpm --dir server db:migrate`, or use `pnpm --dir server db:reset` only for a disposable localhost database. The Render Free Start Command runs `pnpm --dir server db:migrate && pnpm --dir server start` from the repository root. The migration runner applies each SQL file transactionally, records applied versions in `schema_migrations`, skips already-applied versions, and skips seed/catalog migrations only when `RUN_SEED_DATA=false`. A failed migration exits nonzero; the API process does not start against an unknown schema.

Use `GET /api/health` for a lightweight process check and `GET /api/health/dependencies` for a PostgreSQL dependency check. A restart procedure is: stop the current process gracefully with `SIGTERM`, apply approved migrations, start `node dist/server.js`, then verify both health endpoints and the frontend CORS origin. A rollback should stop the new process, restore the previous application artifact and compatible environment, and only reverse database changes through a separately reviewed migration; never edit `schema_migrations` manually.

The server emits structured JSON request and error logs. Operators should retain request IDs when investigating failures, inspect status and duration fields, and avoid recording request bodies, passwords, tokens, provider keys, or database URLs. The current in-memory rate limiter is suitable for the local MVP; a multi-instance deployment requires an approved shared limiter before production scaling.

## Ownership

Member 2 owns routes, controllers, services, validators, database access, models, migrations, authentication, recommendation logic, skill-gap logic, roadmap logic, AI integration, tests, and deployment configuration. Member 1 should consume the documented API rather than accessing database tables directly.

## Suggested server flow

```text
Route → validation middleware → controller → service → database/provider → response
```

Routes should remain small. Business rules belong in services, request validation belongs in validators, and database operations belong in the database/model layer. External AI credentials must remain on the server and must never be sent to the client.
