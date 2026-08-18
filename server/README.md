# Server Workspace

The server is the Node.js, Express, TypeScript API owned primarily by Member 2. It currently includes configuration loading, JSON parsing, CORS, request IDs, safe request logging, a documented health endpoint, not-found handling, error handling, and an HTTP-level test scaffold.

## Local setup

From the repository root, install workspace dependencies with `pnpm install`. Start the API with `pnpm dev:server`; it runs at `http://localhost:4000` by default. Copy `.env.example` to `.env` when local values need to be customized. The database is not required for the foundation milestone; it will be introduced with the first migration.

Run `pnpm --dir server test` for the API smoke tests, `pnpm --dir server typecheck` for TypeScript validation, and `pnpm --dir server build` for the production build.

## API foundation

`GET /api/health` returns `{ "status": "ok", "service": "career-guidance-api" }`. Unknown routes return a JSON `404` response. Every response receives an `x-request-id` header for local debugging and future observability.

## Ownership

Member 2 owns routes, controllers, services, validators, database access, models, migrations, authentication, recommendation logic, skill-gap logic, roadmap logic, AI integration, tests, and deployment configuration. Member 1 should consume the documented API rather than accessing database tables directly.

## Suggested server flow

```text
Route → validation middleware → controller → service → database/provider → response
```

Routes should remain small. Business rules belong in services, request validation belongs in validators, and database operations belong in the database/model layer. External AI credentials must remain on the server and must never be sent to the client.
