# Client Workspace

The client is the React and TypeScript browser application owned primarily by Member 1. It currently includes the Vite foundation, a responsive Pathfinder app shell, shared API types, and a health-check client for verifying local server connectivity.

## Local setup

From the repository root, install workspace dependencies with `pnpm install`. Before starting the client, copy `.env.example` to `.env.local` inside this directory. Local development always uses the same-origin `/api` proxy to reach `http://localhost:4000`, even if an old remote URL remains in `VITE_API_BASE_URL`. Set `VITE_USE_REMOTE_API=true` only when intentionally testing the deployed API from local Vite; otherwise leave it `false`. The template contains no credentials, and browser-exposed `VITE_*` variables must never contain secrets.

Start the browser client with `pnpm dev:client`; it runs at `http://localhost:5173` by default. The client and authentication services use the same resolved API base, so login, health checks, and advisor requests cannot silently target different hosts.

From `client/`, use `pnpm format` to apply formatting, `pnpm format:check` to verify it, `pnpm typecheck` for strict TypeScript validation, and `pnpm build` for the production build. The combined `pnpm check` command runs formatting verification, typechecking, and the production build in sequence.

## Ownership

Member 1 owns pages, reusable components, layouts, client-side services, shared client types, visual assets, charts, and the Three.js/React Three Fiber experience. Member 2 should avoid changing these files unless the change is required to keep the API integration working.

## Suggested feature areas

```text
src/features/authentication/
src/features/assessment/
src/features/recommendations/
src/features/career-details/
src/features/skill-gap/
src/features/roadmap/
src/features/advisor/
src/features/vr/
```

## Integration rule

Use the response shapes in `../docs/api.md`. Mock data is allowed during UI development, but mock objects must match the documented API types so that replacing a mock service with a real request does not require rewriting the interface.
