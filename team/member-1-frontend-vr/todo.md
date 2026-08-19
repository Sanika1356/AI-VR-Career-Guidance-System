# Member 1 — Frontend and VR Remaining Work

**Owner:** Member 1

**Primary areas:** `client/`, frontend-related parts of `docs/`, and the 3D/VR experience
**Works with:** Member 2 through the API contract in `docs/api.md`

This checklist covers the complete project from repository setup to final delivery. Check items only after the implementation has been tested and documented.

## Phase 0 — Understand the project and agree with Member 2

- [ ] Read the root `README.md`, `docs/architecture.md`, and `docs/api.md`.
- [ ] Confirm the frontend stack with Member 2: React, TypeScript, Vite, Tailwind, routing, charts, Three.js, and React Three Fiber.
- [ ] Confirm the authentication approach and how the client stores or receives the session.
- [ ] Confirm the API base URL, local development ports, request headers, error format, and date format.
- [ ] Confirm the visual direction, color palette, typography, responsive breakpoints, and accessibility expectations.
- [ ] Confirm the minimum viable user journey: register, login, assessment, recommendations, career details, skill gap, roadmap, AI advisor, and VR.
- [ ] Add any agreed frontend assumptions to `docs/architecture.md` or `docs/api.md`.

## Phase 1 — Local setup and frontend foundation

- [ ] Clone the repository and configure Git identity.
- [ ] Create the frontend environment file from `.env.example` without committing secrets.

## Phase 2 — Design system and landing experience

- [ ] Test the landing page in the supported browsers.
- [ ] Confirm copy and visual choices with Member 2 before merging.

## Phase 3 — Authentication and profile UI

The profile MVP is complete for the API-supported fields: name, interests, current skills, experience level, and learning preferences. Goals are intentionally deferred as a future enhancement until they are added to the backend contract.
- [ ] Test registration, login, logout, protected navigation, refresh, and expired sessions.
- [ ] Coordinate an authentication integration session with Member 2.

## Phase 4 — Assessment experience

- [ ] Test refresh behavior and decide how unfinished local progress is handled.
- [ ] Test assessment completion on narrow and wide screens.
- [ ] Integrate with Member 2's assessment endpoints using a real development database.

## Phase 5 — Recommendation and career detail UI

- [ ] Build the recommendations page using the agreed response shape.
- [ ] Display ranked career cards with score, reason, matched skills, and missing skills.
- [ ] Add sorting or filtering only if approved in the scope.
- [ ] Add loading skeletons and an empty-results state.
- [ ] Add a clear explanation that recommendations are guidance rather than a guaranteed outcome.
- [ ] Display career description, responsibilities, required skills, learning resources, and VR availability.
- [ ] Add navigation from a recommendation card to career details.
- [ ] Add a saved or selected-career state if required by the product flow.
- [ ] Connect the UI to `GET /api/recommendations`, `GET /api/careers`, and `GET /api/careers/:careerId`.
- [ ] Test long career names, missing optional fields, empty arrays, and API failures.
- [ ] Compare the displayed score and reason with Member 2's test responses.

## Phase 6 — Skill-gap and roadmap UI

- [ ] Build the skill-gap overview page.
- [ ] Display matched, partially developed, and missing skills with clear visual states.
- [ ] Avoid using color alone to communicate skill status.
- [ ] Add accessible labels and a text alternative for charts or visual summaries.
- [ ] Build the learning roadmap page.
- [ ] Display ordered roadmap steps, target skills, descriptions, and completion status.
- [ ] Add progress percentage and completed-step count.
- [ ] Add the agreed interaction for marking a roadmap step complete.
- [ ] Add loading, empty, and error states.
- [ ] Connect the UI to `GET /api/careers/:careerId/skill-gap`, `GET /api/careers/:careerId/roadmap`, and `PATCH /api/roadmap/:stepId`.
- [ ] Verify that changing a roadmap step updates the progress display correctly.
- [ ] Test the pages with zero, partial, and complete progress.

## Phase 7 — AI advisor interface

- [ ] Design the AI advisor page and conversation layout.
- [ ] Build the message list with user and advisor message states.
- [ ] Build the message input with length validation and submit behavior.
- [ ] Add disabled, loading, retry, and provider-error states.
- [ ] Add conversation start and conversation continuation behavior.
- [ ] Display timestamps only where useful and keep the interface readable.
- [ ] Add a clear notice about the advisory nature of AI responses.
- [ ] Add safe handling for empty responses and unexpected response shapes.
- [ ] Connect the UI to `POST /api/advisor/chat`.
- [ ] Test long messages, repeated submissions, network failures, and page refresh behavior.
- [ ] Confirm with Member 2 that the UI does not expose provider keys or internal prompts.

## Phase 8 — 3D career hub and VR environments

- [ ] Review the selected 3D/VR scope and define the minimum desktop experience.
- [ ] Add Three.js and React Three Fiber only after confirming the frontend build remains stable.
- [ ] Create the career hub scene with a clear entry point and readable labels.
- [ ] Add a desktop keyboard and mouse interaction model.
- [ ] Add camera controls and prevent disorienting default behavior.
- [ ] Create the AI Engineer environment with a simple, performant scene.
- [ ] Create the Data Analyst environment with a simple, performant scene.
- [ ] Add career metadata and navigation from the hub to each environment.
- [ ] Keep the career catalog broader than the MVP VR catalog: VR environments are optional and selected through stable, extensible environment metadata. The MVP VR catalog includes only AI Engineer (`career_ai_engineer`, `ai-engineer-lab`) and Data Analyst (`career_data_analyst`, `data-insights-studio`).
- [ ] Add a visible exit or return-to-career-details control.


**Owns:** `client/`, frontend-related documentation, browser behavior, responsive UI, accessibility, and the 3D/VR experience.

**Coordinates with:** Member 2 through `docs/api.md`, pull requests, shared test accounts, and the handoff rules in this file and the server TODO.

This file contains only remaining work. The real client pages and services for authentication, profile, assessment, career catalog, recommendations, skill gap, roadmap, advisor, and the VR metadata hub already exist. Do not re-create them with mock data. Remaining tasks below are mainly integration testing, resilience, visual/3D work, deployment configuration, and final demonstration readiness.

## 1. Separate-laptop working agreement

| Rule | Frontend action |
|---|---|
| Branch ownership | Create a new branch for each frontend push using `feature/member1-<short-name>`. Never commit directly to `main`. |
| Pull before work | Start each phase from the latest `origin/main`. Do not build on an old backend branch. |
| File boundary | Modify `client/` for frontend work. Modify shared docs only after coordinating with Member 2. Do not edit `server/`. |
| API source of truth | Use `docs/api.md` and the deployed or local server responses. Do not infer fields from stale TODO text. |
| Environment | Keep `client/.env.local` uncommitted. Use `VITE_API_BASE_URL=http://localhost:4000/api` locally or the approved Render API URL for a deployed build. |
| Handoff | Before requesting a backend change, report endpoint, method, request body, response fields, auth requirement, and the observed error. |
| Merge order | Merge backend contract changes before merging client code that depends on them. After every merge, pull `origin/main` and re-run the client build. |
| Completion evidence | Check a task only after the feature works against the real API and has a test, screenshot, browser check, or documented manual result. |

## 2. Shared delivery gates

| Gate | Member 1 deliverable | Member 2 dependency | Exit condition |
|---|---|---|---|
| Gate A — Local contract | Client environment, request wrapper, and route assumptions | Current `docs/api.md` and local server | Both laptops can run client and server independently. |
| Gate B — Authenticated flow | Browser session test with a clean account | Register, login, profile, and bearer-token behavior | Refresh, logout, expired-token, and protected-route behavior are understood. |
| Gate C — Learning flow | Assessment through roadmap UI | Assessment, recommendation, skill-gap, and roadmap APIs | A real test account completes the core guidance journey. |
| Gate D — Advisor/VR | Advisor resilience and desktop VR hub/scene | Advisor and VR metadata endpoints | Failures are visible, no secrets appear in the browser, and fallback paths work. |
| Gate E — Release | Browser/accessibility/responsive checks and deployment variables | Render/Neon staging API and CORS | Both members approve the same end-to-end demo build. |

## 3. Phase A — Local setup and contract synchronization

- [ ] Create `client/.env.local` from the current frontend environment template without committing secrets.
- [ ] Pull the latest `origin/main` and confirm that `docs/api.md` matches the backend branch being used.
- [ ] Record any frontend assumption in `docs/api.md` or `docs/architecture.md` only after Member 2 approves the contract change.
- [ ] Confirm that all client requests use `VITE_API_BASE_URL` and that the browser never receives `DATABASE_URL`, `AUTH_SECRET`, provider keys, or internal prompts.
- [ ] Run the client typecheck and production build before starting each feature phase.

**Handoff to Member 2:** Send the exact API contract or field mismatch if the current documentation does not support a real client flow. Do not add a mock final path to hide a contract problem.

## 4. Phase B — Authentication and profile integration

- [ ] Test registration, login, logout, protected navigation, refresh, and expired-session behavior against the real local backend.
- [ ] Coordinate one authentication integration session with Member 2 using a clean local database account.
- [ ] Test profile editing, validation errors, empty optional fields, and refresh persistence against the real profile API.
- [ ] Record any browser CORS or token-storage issue with the request, response status, and reproduction steps.

**Exit gate:** Member 1 and Member 2 can independently reproduce a successful authenticated profile session from separate laptops.

## 5. Phase C — Assessment, recommendations, and career details

- [ ] Test assessment refresh behavior and document how unfinished local progress is handled.
- [ ] Test assessment completion on narrow and wide screens against a real development database.
- [ ] Test long career names, missing optional fields, empty arrays, unavailable career data, and API failures.
- [ ] Compare displayed recommendation scores, reasons, matched skills, and missing skills with Member 2’s documented test responses.
- [ ] Add sorting, filtering, or saved-career state only if both members approve it in the shared scope.
- [ ] Test that the UI explains recommendations as guidance rather than guaranteed outcomes.

**Handoff to Member 2:** Report any response-shape mismatch before changing client types or adding fallback data.

## 6. Phase D — Skill gap and roadmap quality

- [ ] Preserve the approved MVP skill-gap statuses: `matched` and `missing`. Do not render `partial` until the profile and API contracts gain approved proficiency data.
- [ ] Verify that skill status is not communicated by color alone and that labels remain understandable to keyboard and screen-reader users.
- [ ] Verify that changing a roadmap step updates the completion state, percentage, and completed-step count correctly.
- [ ] Test roadmap states with zero, partial, and complete progress; “partial progress” here refers to roadmap completion, not a skill-gap status.
- [ ] Test unauthorized, missing-career, missing-step, and server-failure responses.

## 7. Phase E — AI advisor interface

- [ ] Test long messages, repeated submissions, network failures, retry behavior, conversation continuation, and page refresh behavior.
- [ ] Keep the advisory disclaimer visible and avoid language that promises employment or guaranteed outcomes.
- [ ] Add an explicit provider/fallback label only if Member 2 later exposes a safe provider-status field in the API.
- [ ] Verify that malformed or empty advisor responses produce a readable error and do not corrupt the conversation UI.
- [ ] Confirm that no provider key, system prompt, or private profile data is exposed in browser logs or rendered debugging output.

**Handoff to Member 2:** Report provider timeout, fallback, output-length, or safety problems with a redacted request and response.

## 8. Phase F — 3D career hub and VR environments

- [ ] Confirm the frontend build remains stable before adding Three.js or React Three Fiber.
- [ ] Create a performant desktop career hub with keyboard and mouse interaction.
- [ ] Create the AI Engineer environment with a simple, readable scene.
- [ ] Create the Data Analyst environment with a simple, readable scene.
- [ ] Add camera controls that avoid disorienting default behavior.

- [ ] Add loading and fallback UI if a 3D asset fails.
- [ ] Optimize models, textures, lighting, and draw calls for browser performance.
- [ ] Test keyboard, mouse, touch where applicable, reduced-motion preferences, and unsupported-device fallback.
- [ ] Add WebXR support only after desktop 3D mode works reliably.
- [ ] Test entering and exiting a headset session where hardware is available.
- [ ] Keep the metadata-only `GET /api/vr/environments` contract; do not move database or provider calls into the browser.

**Handoff to Member 2:** If the scene needs new metadata, propose the field and explain why existing safe metadata is insufficient before requesting a backend change.

## 9. Phase G — Frontend quality and integration

- [ ] Verify every active page has loading, success, empty, and error behavior appropriate to its API.
- [ ] Verify responsive behavior across supported desktop, tablet, and mobile viewport sizes.
- [ ] Run accessibility checks for keyboard navigation, focus order, labels, contrast, semantic headings, and non-color status cues.
- [ ] Run browser compatibility checks on the supported browsers.
- [ ] Test slow network behavior, refresh during API requests, duplicate submissions, and expired sessions.
- [ ] Remove unused mock data, debug logs, placeholder text, and unfinished active routes.
- [ ] Confirm images, icons, models, fonts, and other assets have appropriate usage rights or are original project assets.
- [ ] Open a final frontend integration pull request after the backend staging contract is stable.

## 10. Phase H — Staging, release, and presentation

- [ ] Set the deployed client’s `VITE_API_BASE_URL` to the approved Render API URL ending in `/api` at frontend build time.
- [ ] Confirm Member 2 has set Render `CORS_ORIGIN` to the exact deployed frontend origin.
- [ ] Run the complete flow with a fresh or approved demo account: register, login, profile, assessment, recommendations, career details, skill gap, roadmap, advisor, and VR.
- [ ] Verify the production build output and test the deployed application after a fresh deployment.
- [ ] Rehearse the desktop fallback and VR demo path.
- [ ] Document known limitations, especially device requirements for WebXR and advisor fallback behavior.
- [ ] Prepare a short product walkthrough, screenshots, or screen recording if required.
- [ ] Help Member 2 perform the final end-to-end test and resolve or document every assigned issue.
- [ ] Obtain both members’ approval before the final merge and release tag.

## 11. Definition of done for Member 1

Member 1’s work is complete when the client builds from a clean checkout, uses real documented APIs, handles loading and failure states, passes the agreed browser/accessibility checks, does not contain secrets or final mock paths, and completes the shared staging flow with Member 2’s backend.

The final handoff to Member 2 must include the client branch, pull request, tested commit, environment variable names without secret values, supported browser/device notes, and a short list of any unresolved limitations.
