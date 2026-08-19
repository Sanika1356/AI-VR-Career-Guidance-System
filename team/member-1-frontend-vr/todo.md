# Pathfinder Frontend TODO — Remaining Work Only

**Owner:** Member 1 — frontend and VR client

**Coordinates with:** Member 2 through `docs/api.md`, pull requests, shared test accounts, deployed service URLs, and the handoff rules in this file and the server TODO. This file contains only unfinished frontend work; completed implementation and staging tasks are recorded as baseline evidence, not active checklist items.

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

Assessment drafts now persist in `sessionStorage` by assessment ID, restore the stage, answers, and current question after refresh, and clear after successful submission. Storage failures are non-blocking. The client quality gate passes formatting, TypeScript, and production build checks.

Sorting, filtering, saved-career state, profile goals, partial skill-gap status, and WebXR-dependent behavior remain outside the approved desktop MVP unless separately approved. The desktop canvas is the supported MVP VR path; headset validation requires compatible hardware.

## Phase 1 — Local backend integration checks

These checks are specific to the local backend environment and should not be marked complete based only on the deployed staging run.

- [ ] Test token-expiry behavior specifically against the real local backend; registration, login, protected navigation, refresh, client-side logout, and missing-session redirect are verified locally.
- [ ] Coordinate one authentication integration session with Member 2 using a clean local account.
- [ ] Test empty optional profile fields and a direct unauthorized profile API response against the local backend; required-name validation and valid persistence after refresh are verified locally.

**Local integration evidence required:** Record the environment, route, account type, response status, and reproduction steps without committing credentials or secrets.

## Phase 2 — Learning-flow resilience and error checks

- [ ] Test assessment completion on narrow and wide screens against a real development database.

- [x] Test long career names, missing optional fields, empty arrays, unavailable career data, and API failures. Staging returned HTTP 404 `career_not_found` for `/careers/not-a-real-career`; after the initial Render cold-start loading period, retrying the route rendered the existing readable error state with `Try again` and `Back to career paths` controls. Long-name and synthetic empty-array fixtures remain outside the deployed catalog.
- [ ] Compare displayed recommendation scores, reasons, matched skills, and missing skills with Member 2’s documented test responses.
- [ ] Add sorting, filtering, or saved-career state only if both members approve it in the shared scope.
The recommendations page frames ranked paths as thoughtful starting points rather than guarantees, and the guidance note encourages comparing paths and using skill gaps to choose next steps.

**Handoff to Member 2:** Report any response-shape mismatch before changing client types or adding fallback data.

## 7. Phase D — Skill-gap and roadmap quality

The client preserves only the approved MVP skill-gap statuses, `matched` and `missing`, and does not render `partial` without approved proficiency data in the profile and API contracts.
Static markup review confirms skill status is communicated with visible text such as “Already matched” and “Build next,” while numeric alignment percentage and counts accompany the progress visualization; live screen-reader and contrast checks remain pending.
- [ ] Verify that changing a roadmap step updates the completion state, percentage, and completed-step count correctly.
- [ ] Test roadmap states with zero, partial, and complete progress; “partial progress” here refers to roadmap completion, not a skill-gap status.
- [ ] Test unauthorized, missing-career, missing-step, and server-failure responses.

## 8. Phase E — AI advisor interface

- [ ] Test long messages, repeated submissions, network failures, retry behavior, conversation continuation, and page refresh behavior.

The advisor browser smoke test confirmed the advisory disclaimer remains visible and avoids guaranteed-outcome language.
No provider label was added because the current API does not expose a safe provider-status field; the client shows a generic provider/network error instead.
The empty-answer stub produced a readable incomplete-response error, retained the user message, exposed Retry question, and did not render an empty advisor bubble.
A client source audit found no provider keys, system prompts, private profile payloads, or debug logging exposed in the browser bundle.

**Handoff to Member 2:** Report provider timeout, fallback, output-length, or safety problems with a redacted request and response.

## 9. Phase F — 3D career hub and VR environments


- [ ] Test long career names, missing optional fields, empty arrays, and career API failures; unavailable-career HTTP 404 and its rendered error state are verified locally and in staging.
- [ ] Test server-failure responses for skill-gap and roadmap routes; unauthorized access and a missing roadmap step are verified locally.
- [ ] Test advisor long-message limits, real-backend repeated submissions, slow-network behavior, and cross-page session expiry; page refresh and minimum-length validation are verified locally.


The current API already exposes the approved contracts. Do not add mock services, client-only goals, a `partial` skill-gap status, or saved-career state to close these checks.

## Phase 3 — Accessibility, responsive, browser, and performance quality

- [ ] Verify authenticated assessment and learning-flow behavior across supported desktop, tablet, and mobile viewport sizes. Public home and career-catalog spot checks, including the tablet navigation-wrap fix, are complete.
- [ ] Run browser compatibility checks on Firefox, Safari/WebKit, and Edge when those browser engines are available. Chromium local coverage and the manual accessibility matrix are documented in `docs/frontend-quality-audit.md`.
- [ ] Measure desktop VR fallback performance on supported target hardware. A local Chromium baseline is documented in `docs/frontend-quality-audit.md`; target-device evidence remains pending.
- [ ] Test touch interaction for the desktop VR fallback where a supported touch device is available.

## Phase 4 — WebXR and headset validation

WebXR implementation is deferred beyond the approved MVP and must not be added without explicit scope approval from both members.

- [ ] Test entering and exiting a headset session with a compatible WebXR device.

**Hardware gate:** Do not mark WebXR or headset validation complete based on the desktop fallback. The supported MVP path remains the desktop canvas experience.

## Phase 5 — Release and approval gates

- [ ] Merge the currently open frontend evidence pull requests after their checks pass. Review completed for [PR #61](https://github.com/Sanika1356/AI-VR-Career-Guidance-System/pull/61) and [PR #67](https://github.com/Sanika1356/AI-VR-Career-Guidance-System/pull/67); both remain open with no configured automated checks (`Checks 0`) and no human review, so merge remains pending.
- [ ] Obtain the user’s explicit approval before production promotion and final release tagging.

The final release handoff must include the tested client branch and commit, pull request, environment-variable names without secret values, supported browser and device notes, staging evidence, and a concise list of unresolved limitations.

## Completion rule

Member 1’s frontend work is complete only when the remaining local integration checks, resilience checks, responsive and browser checks, accessibility matrix, deployment confirmation, and applicable hardware checks have real evidence, and the user approves production promotion and final release tagging. External approval, backend coordination, staging deployment, browser-matrix access, and WebXR hardware must not be inferred or self-approved.
