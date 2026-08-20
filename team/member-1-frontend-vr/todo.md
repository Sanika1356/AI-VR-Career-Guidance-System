# Pathfinder Frontend TODO — Remaining Work Only

**Owner:** Member 1 — frontend and VR client

**Coordinates with:** Member 2 through `docs/api.md`, pull requests, shared test accounts, deployed service URLs, and the handoff rules in this file and the server TODO. This file intentionally contains only unfinished frontend work; completed phases and completed task headlines are recorded in the verified baseline instead of appearing as open items.

## Working agreement

| Rule | Frontend action |
|---|---|
| Branch ownership | Create a new branch for every frontend push using `feature/member1-<short-name>` or `chore/member1-<short-name>` for checklist-only changes. Never commit directly to `main`. |
| Pull before work | Start each task from the latest `origin/main`. Do not build on an old backend branch. |
| File boundary | Modify `client/` for frontend work. Modify this checklist only for frontend task tracking. Do not edit `server/`. |
| API source of truth | Use `docs/api.md` and tested local or staging responses. Do not infer fields from stale task notes. |
| Environment | Keep `client/.env.local` uncommitted. Use `VITE_API_BASE_URL=http://localhost:4000/api` locally or the approved Render API URL in a deployed build. |
| Secrets | Never place `DATABASE_URL`, `AUTH_SECRET`, provider keys, internal prompts, or server-only credentials in client files. `VITE_*` values are public. |
| Handoff | Before requesting a backend change, send the endpoint, method, request body, response fields, auth requirement, error behavior, and observed reproduction. |
| Evidence | Close a remaining item only after a real test, browser check, screenshot, or documented manual result. |

## Phase 2 — Learning-flow resilience and error checks

- [ ] Test assessment completion on narrow and wide screens against a real development database. The authenticated staging assessment completed at 896×768; narrow and wide viewport evidence remains pending.
- [ ] Test long career names, missing optional fields, and empty-array fixtures. The unavailable-career HTTP 404 and rendered error state are verified locally and in staging; controlled fixture data remains pending.
- [ ] Test server-failure responses for skill-gap and roadmap routes. Unauthorized access and a missing roadmap step are verified locally and in the attached smoke evidence; controlled server-failure injection remains open.
- [ ] Test advisor long-message limits, real-backend repeated submissions, and slow-network behavior. Page refresh, minimum-length validation, a non-empty advisor response, and invalid-token cross-page expiry redirect are verified; long-message, repeated-submit, and slow-network evidence remains open.

The current API already exposes the approved contracts. Do not add mock services, client-only goals, a `partial` skill-gap status, or saved-career state to close these checks.


## Phase 3 — Accessibility, responsive, browser, and performance quality

Authenticated assessment, profile, advisor, and AI Engineer roadmap responsive checks are documented in `docs/frontend-phase3-responsive.md`, with committed captures under `docs/assets/`, covering 375px, 768px, and 1440px staging viewports.

- [ ] Run browser compatibility checks on Firefox, Safari/WebKit, and Edge when those browser engines are available. Chromium local coverage and the manual accessibility matrix are documented.
- [ ] Measure desktop VR fallback performance on supported target hardware. A local Chromium baseline is complete; target-device evidence remains pending.
- [ ] Test touch interaction for the desktop VR fallback where a supported touch device is available.

## Phase 4 — WebXR and headset validation

WebXR implementation is deferred beyond the approved MVP and must not be added without explicit scope approval from both members.

- [ ] Test entering and exiting a headset session with a compatible WebXR device.

**Hardware gate:** Do not mark WebXR or headset validation complete based on the desktop fallback. The supported MVP path remains the desktop canvas experience.

## Phase 5 — Release and approval gates

- [ ] Obtain the user’s explicit approval before production promotion and final release tagging.

The final release handoff must include the tested client branch and commit, pull request, environment-variable names without secret values, supported browser and device notes, staging evidence, and a concise list of unresolved limitations.

## Dependency matrix for remaining work

| Remaining item | Required evidence or dependency | Current status |
|---|---|---|
| Assessment completion on narrow and wide screens | Authenticated browser session that can reach the local backend from the same network context | Pending; staging authenticated assessment completed at 896×768, but narrow and wide viewport evidence is still missing; the separate local browser retry showed `API OFFLINE` |
| Long names, empty arrays, and optional-field fixtures | Controlled fixture data or a dedicated test endpoint that does not alter the approved production contract | Pending; no safe fixture injection is available |
| Skill-gap and roadmap server-failure states | Controlled backend failure injection or a temporary test-only failure mode | Pending by explicit scope; unauthorized and missing-step responses are already covered |
| Advisor long-message, repeated-submit, slow-network, and cross-page expiry behavior | Authenticated browser session plus controlled network throttling or failure injection | Pending; invalid-token cross-page expiry redirect is verified in staging, but long-message, repeated-submit, and slow-network evidence still requires controlled browser/network testing |
| Authenticated responsive learning-flow checks | Browser session connected to the same backend context at desktop, tablet, and mobile sizes | Complete for staging assessment, profile, advisor, and AI Engineer roadmap at 375px, 768px, and 1440px; evidence is committed in `docs/frontend-phase3-responsive.md` |
| Firefox, Safari/WebKit, and Edge compatibility | Access to those browser engines | Pending; unavailable in the current sandbox |
| Target-device VR performance and touch interaction | Supported physical desktop/touch device | Pending; local Chromium baseline is complete |
| WebXR/headset entry and exit | Compatible WebXR headset and browser | Pending; hardware is unavailable and WebXR remains outside the approved desktop MVP |
| Production promotion and final release tag | User’s explicit approval after both members’ release review | Pending; approval must never be inferred |

## Completion rule

Member 1’s frontend work is complete only when the remaining resilience checks, authenticated responsive and browser checks, target-device checks, applicable hardware checks, and release approval have real evidence. External approval, backend coordination, unavailable browser engines, staging deployment, and WebXR hardware must not be inferred or self-approved.
