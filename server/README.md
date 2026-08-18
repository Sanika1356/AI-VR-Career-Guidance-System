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

## Ownership

Member 2 owns routes, controllers, services, validators, database access, models, migrations, authentication, recommendation logic, skill-gap logic, roadmap logic, AI integration, tests, and deployment configuration. Member 1 should consume the documented API rather than accessing database tables directly.

## Suggested server flow

```text
Route → validation middleware → controller → service → database/provider → response
```

Routes should remain small. Business rules belong in services, request validation belongs in validators, and database operations belong in the database/model layer. External AI credentials must remain on the server and must never be sent to the client.
