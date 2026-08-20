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

## Verified baseline — completed work removed from this TODO

The client implementation is complete for authentication, profile, assessment, career catalog and details, recommendations, skill gap, roadmap, advisor, VR metadata, and the dependency-free desktop VR fallback. The supported profile fields are `name`, `interests`, `currentSkills`, `experience`, and `learningPreferences`; `goals` remains deferred because it is not in the approved backend contract. Skill-gap status is limited to `matched` and `missing`; roadmap completion may be zero, partial, or complete.

The approved staging deployment was exercised with a synthetic account. Registration, login, profile persistence after refresh, assessment submission, recommendations, career details, skill-gap rendering, roadmap mutation, advisor fallback conversation, VR metadata selection, and switching between the AI Engineer and Data Analyst desktop environments passed. The verified staging API base is `https://ai-vr-career-guidance-system.onrender.com/api`, and the active frontend origin is `https://ai-vr-career-guidance-system-40ti.onrender.com` with matching CORS. The unavailable-career test returned HTTP 404 and rendered the existing retry and back-navigation error state after the initial Render cold start.

Assessment drafts persist in `sessionStorage` by assessment ID, restore the stage, answers, and current question after refresh, and clear after successful submission. Storage failures are non-blocking. Public home and career-catalog responsive spot checks, including the tablet navigation-wrap fix, passed at 375px, 768px, and 1440px. The manual accessibility matrix and Chromium quality audit are documented in `docs/frontend-quality-audit.md`; the local desktop VR performance baseline is documented there as well. The client quality gate passes formatting, TypeScript, and production build checks.

Frontend evidence PRs #61 and #67 are merged into `main`. Their missing-career staging and public responsive viewport evidence is part of this verified baseline. Sorting, filtering, saved-career state, profile goals, partial skill-gap status, and WebXR-dependent behavior remain outside the approved desktop MVP unless separately approved. The desktop canvas is the supported MVP VR path; headset validation requires compatible hardware.

## Phase 1 — Local backend integration checks

These checks are specific to the local backend environment and must not be marked complete based only on the deployed staging run.

- [x] Verify local invalid-token and missing-auth behavior against the real backend with a synthetic bearer token. The attached smoke run received HTTP 401 for unauthenticated `/profile`; browser-session redirect behavior is not inferred because the browser and backend attached contexts do not share a network namespace.
- [x] Coordinate one authentication integration session with Member 2 using a clean synthetic local account in the attached backend context. Registration returned HTTP 201 and the token was received without being printed.
- [x] Test empty optional profile fields and a direct unauthorized profile API response against the local backend. The attached smoke run accepted empty optional profile fields, persisted the profile, and returned HTTP 401 for unauthenticated `/profile`.

**Local integration evidence:** The attached `backend-smoke-attached` run used `http://127.0.0.1:4000/api` with origin `http://localhost:5173`, a synthetic account, and sanitized output. Health and dependency checks returned 200; registration returned 201; profile, assessment, recommendations, career detail, skill-gap, roadmap, advisor, and VR requests returned the expected successful statuses; unauthenticated profile returned 401. No token value or credential was recorded.

## Phase 2 — Learning-flow resilience and error checks

- [ ] Test assessment completion on narrow and wide screens against a real development database.
- [ ] Test long career names, missing optional fields, and empty-array fixtures. The unavailable-career HTTP 404 and rendered error state are verified locally and in staging.
- [ ] Test server-failure responses for skill-gap and roadmap routes. Unauthorized access and a missing roadmap step are verified locally; controlled server-failure injection remains open.
- [ ] Test advisor long-message limits, real-backend repeated submissions, slow-network behavior, and cross-page session expiry. Page refresh and minimum-length validation are verified locally; the attached smoke run confirmed a non-empty advisor response.

The current API already exposes the approved contracts. Do not add mock services, client-only goals, a `partial` skill-gap status, or saved-career state to close these checks.

## Phase 3 — Accessibility, responsive, browser, and performance quality

- [ ] Verify authenticated assessment and learning-flow behavior across supported desktop, tablet, and mobile viewport sizes. Public home and career-catalog spot checks are complete.
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
| Assessment completion on narrow and wide screens | Authenticated browser session that can reach the local backend from the same network context | Pending; the 2026-08-20 browser retry loaded the frontend but showed `API OFFLINE`, and a direct browser fetch to `/api/health` failed |
| Long names, empty arrays, and optional-field fixtures | Controlled fixture data or a dedicated test endpoint that does not alter the approved production contract | Pending; no safe fixture injection is available |
| Skill-gap and roadmap server-failure states | Controlled backend failure injection or a temporary test-only failure mode | Pending by explicit scope; unauthorized and missing-step responses are already covered |
| Advisor long-message, repeated-submit, slow-network, and cross-page expiry behavior | Authenticated browser session plus controlled network throttling or failure injection | Pending; only local API happy-path and client-side validation evidence is available |
| Authenticated responsive learning-flow checks | Browser session connected to the same backend context at desktop, tablet, and mobile sizes | Pending; the 2026-08-20 browser retry could not reach the attached backend, while public responsive smoke evidence is complete |
| Firefox, Safari/WebKit, and Edge compatibility | Access to those browser engines | Pending; unavailable in the current sandbox |
| Target-device VR performance and touch interaction | Supported physical desktop/touch device | Pending; local Chromium baseline is complete |
| WebXR/headset entry and exit | Compatible WebXR headset and browser | Pending; hardware is unavailable and WebXR remains outside the approved desktop MVP |
| Production promotion and final release tag | User’s explicit approval after both members’ release review | Pending; approval must never be inferred |

## Completion rule

Member 1’s frontend work is complete only when the remaining local integration checks, resilience checks, authenticated responsive and browser checks, target-device checks, applicable hardware checks, and release approval have real evidence. External approval, backend coordination, unavailable browser engines, staging deployment, and WebXR hardware must not be inferred or self-approved.
