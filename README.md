# AI-VR Career Guidance System

An AI-assisted career discovery platform that combines structured assessment, explainable recommendations, learning roadmaps, and immersive VR career exploration.

## Current milestone: foundation

The repository is divided into two independently runnable workspaces. Member 1 owns the browser experience in `client/`; Member 2 owns the API and future database/AI services in `server/`. Both workspaces are connected through the shared contracts in `docs/`.

| Workspace | Start command | Responsibility |
|---|---|---|
| Client | `pnpm dev:client` | React UI, assessment flows, recommendations, roadmap, advisor chat, and VR experience |
| Server | `pnpm dev:server` | REST API, authentication, PostgreSQL, scoring, recommendations, AI integration, and operations |

## Quick start

Install [Node.js](https://nodejs.org/) and pnpm, then run `pnpm install` from the repository root. Copy `.env.example` to `.env` if local configuration is needed. Start the client and server in separate terminals with `pnpm dev:client` and `pnpm dev:server`. Open `http://localhost:5173` and confirm that the app reports the API connection status.

Run `pnpm test` for server smoke tests, `pnpm check` for TypeScript checks, and `pnpm build` for both production builds. See [`docs/development.md`](docs/development.md) for the foundation milestone and [`docs/architecture.md`](docs/architecture.md) for ownership boundaries.

## Team plans

The full delivery checklists are maintained in [`team/member-1-frontend-vr/todo.md`](team/member-1-frontend-vr/todo.md) and [`team/member-2-backend-ai-database/todo.md`](team/member-2-backend-ai-database/todo.md). Keep feature branches short-lived and update the shared API contract whenever a response shape changes.
