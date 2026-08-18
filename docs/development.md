# Development Guide

This document records the first shared development milestone and the commands both members use to run the project.

## Foundation milestone

The repository now has independent client and server workspaces managed by pnpm. The client is a Vite-powered React and TypeScript application. The server is an Express and TypeScript application with a health endpoint, request IDs, CORS, JSON parsing, safe not-found responses, and an error handler. The client app shell calls the health endpoint so the two workspaces can be verified together before authentication or database work begins.

| Check | Command | Expected result |
|---|---|---|
| Install | `pnpm install` | Workspace dependencies are installed |
| Client | `pnpm dev:client` | Client starts at port 5173 |
| Server | `pnpm dev:server` | API starts at port 4000 |
| Health | `curl http://localhost:4000/api/health` | Documented `status: ok` JSON |
| Tests | `pnpm test` | Server foundation tests pass |
| Types | `pnpm check` | Client and server type checks pass |
| Build | `pnpm build` | Both workspaces compile successfully |

## Integration handoff

Member 1 can now build screens against the shared response types in `client/src/types/api.ts` and the endpoint contract in `docs/api.md`. Member 2 can add database-backed routes without changing the client startup contract. Any API response change must be reflected in `docs/api.md`, the client types, and the corresponding test.
