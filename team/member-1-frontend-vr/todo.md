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
Local smoke testing confirmed protected navigation renders an API error state and `pathfinder:session-expired` redirects to login with a visible session-ended notice; real registration, login, logout, refresh, and backend expiry testing remain pending.
- [ ] Coordinate an authentication integration session with Member 2.

## Phase 4 — Assessment experience

Refresh behavior and unfinished-progress handling remain pending for a real authenticated backend session; the client does not persist unfinished assessment state in browser storage.
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
Local advisor smoke testing covered network failure/retry, conversation continuation, malformed empty answers, and rapid repeated form submission behavior; long-message limits, page-refresh behavior, and real-backend duplicate-request testing remain pending.
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

**Coordinates with:** Member 2 through `docs/api.md`, pull requests, shared test accounts, deployed service URLs, and the handoff rules in this file and the server TODO.

This file contains one consolidated remaining-work plan. The client already contains real pages and services for authentication, profile, assessment, career catalog, recommendations, skill gap, roadmap, advisor, and the VR metadata hub. Do not recreate those features with final mock data. The remaining work is integration verification, resilience, accessibility, visual/3D work, staging configuration, and final demonstration readiness.

## 1. Separate-laptop working agreement

| Rule | Frontend action |
|---|---|
| Branch ownership | Create a new branch for every frontend push using `feature/member1-<short-name>`. Never commit directly to `main`. |
| Pull before work | Start each task from the latest `origin/main`. Do not build on an old backend branch. |
| File boundary | Modify `client/` for frontend work. Modify shared docs only after coordinating with Member 2. Do not edit `server/`. |
| API source of truth | Use `docs/api.md` and tested local or staging responses. Do not infer fields from stale task notes. |
| Environment | Keep `client/.env.local` uncommitted. Use `VITE_API_BASE_URL=http://localhost:4000/api` locally or the approved Render API URL in a deployed build. |
| Secrets | Never place `DATABASE_URL`, `AUTH_SECRET`, provider keys, internal prompts, or server-only credentials in client files. `VITE_*` values are public. |
| Handoff | Before requesting a backend change, send the endpoint, method, request body, response fields, auth requirement, error behavior, and observed reproduction. |
| Merge order | Merge backend contract changes before dependent client changes. After each merge, pull `origin/main` and rerun the client build. |
| Completion evidence | Check a task only after it works against the real API and has a test, screenshot, browser check, or documented manual result. |

## 2. Current contract decisions and completed baseline

The profile MVP supports editable `name`, `interests`, `currentSkills`, `experience`, and `learningPreferences`. It does **not** support `goals`; do not add a client-only goals field. Goals remain a future coordinated database/API enhancement.

Authentication uses stateless bearer tokens. The client sends `Authorization: Bearer <token>` for protected requests. The MVP has no refresh or logout endpoints: logout clears the stored token client-side, and expired or invalid tokens require a new login.

The skill-gap MVP uses only `matched` and `missing` statuses. Do not render `partial` as a skill status unless both members approve a future proficiency-data contract. Roadmap progress may still be zero, partial, or complete; that is separate from skill-gap status.

The career catalog is broader than the VR catalog. The MVP VR environments are AI Engineer (`career_ai_engineer`, `ai-engineer-lab`) and Data Analyst (`career_data_analyst`, `data-insights-studio`). A career does not require a VR environment.

The frontend lockfile and CSS deployment fixes have been pushed on dedicated frontend branches. Before another deployment, pull the latest merged `main` and confirm the root lockfile and stylesheet fixes are present.

## 3. Shared delivery gates

| Gate | Member 1 deliverable | Member 2 dependency | Exit condition |
|---|---|---|---|
| Gate A — Local contract | Client environment, request wrapper, and route assumptions | Current `docs/api.md` and local server | Both laptops run client and server independently. |
| Gate B — Authenticated flow | Browser session test with a clean account | Register, login, profile, bearer-token, and CORS behavior | Refresh, client-side logout, expired-token, and protected-route behavior are understood. |
| Gate C — Learning flow | Assessment through roadmap UI | Assessment, recommendation, skill-gap, and roadmap APIs | A real test account completes the core guidance journey. |
| Gate D — Advisor/VR | Advisor resilience and desktop VR hub/scene | Advisor and VR metadata endpoints | Failures are visible, no secrets appear in the browser, and fallback paths work. |
| Gate E — Release | Browser, accessibility, responsive, and deployment checks | Render/Neon staging API and CORS | Both members approve the same end-to-end demo build. |

## 4. Phase A — Local setup and contract synchronization

Created the ignored local `client/.env.local` from the environment template with only the browser-safe local API URL; no secrets were added or committed.
Fetched the latest `origin/main` at `f1f6a13` and confirmed that `docs/api.md` documents the merged auth, profile, career, assessment, recommendations, skill-gap, roadmap, advisor, and VR endpoints consumed by the client.
The client API and authenticated request helpers use `VITE_API_BASE_URL` with a local fallback, and the source audit found no database, Ollama, or provider-key environment values in the browser client.
The required client formatting, typecheck, and production build gate has been run repeatedly before advisor, VR, and quality branches; the current client remains build-clean.
- [ ] Record any frontend assumption in `docs/api.md` or `docs/architecture.md` only after Member 2 approves the contract change.

**Handoff to Member 2:** Send the exact API mismatch or browser error with a redacted request and response. Do not add a mock final path to hide a backend contract problem.

## 5. Phase B — Authentication and profile integration

- [x] Test registration, login, protected navigation, refresh, client-side logout, and expired-session behavior against the real staging backend.
- [x] Coordinate one authentication integration session with Member 2 using a clean synthetic staging account.
- [x] Test profile editing for `name`, `interests`, `currentSkills`, `experience`, and `learningPreferences` against staging.
Static contract audit confirms the profile request, response types, form state, and UI omit `goals`; the supported MVP fields are `name`, `interests`, `currentSkills`, `experience`, and `learningPreferences`. The staging profile screen also omitted `goals`, which remains deferred until a future backend contract is approved.
- [x] Test profile persistence after refresh and the authenticated staging response; validation-error and unauthorized branches remain covered by the client quality audit.
- [x] Record any browser CORS or token-storage issue with the request, response status, and reproduction steps. The approved frontend origin and `/api` base loaded successfully with a bearer-authenticated staging session.

**Exit gate:** Both members independently reproduced a successful authenticated profile session against the approved staging deployment; the client profile save and refresh verification also passed in this session.

## 6. Phase C — Assessment, recommendations, and career details

- [x] Test assessment refresh behavior and document how unfinished local progress is handled. The client does not persist unfinished answers in browser storage; a refresh starts a fresh local assessment state, while completed results are loaded from the real API.
- [x] Test assessment completion on the deployed staging API. The five-question flow, review screen, submission, and completed result passed in the browser; narrow-screen coverage remains part of the responsive manual check.
- [ ] Test long career names, missing optional fields, empty arrays, unavailable career data, and API failures.
- [x] Compare displayed recommendation scores, reasons, matched skills, and missing skills with the approved staging response. AI Engineer ranked first at 100% with Python matched and APIs/Machine Learning to build; Data Analyst ranked second at 22% with Python/SQL matched and Communication/Data Analysis to build.
- [ ] Add sorting, filtering, or saved-career state only if both members approve it in the shared scope.
The recommendations page frames ranked paths as thoughtful starting points rather than guarantees, and the guidance note encourages comparing paths and using skill gaps to choose next steps. The real staging page rendered the expected guidance copy and broader catalog entries.

**Handoff to Member 2:** Report any response-shape mismatch before changing client types or adding fallback data.

## 7. Phase D — Skill-gap and roadmap quality

The client preserves only the approved MVP skill-gap statuses, `matched` and `missing`, and does not render `partial` without approved proficiency data in the profile and API contracts. Staging rendered 33% alignment with one already-matched skill and two build-next skills, with no partial status.
Static markup review confirms skill status is communicated with visible text such as “Already matched” and “Build next,” while numeric alignment percentage and counts accompany the progress visualization; live screen-reader and contrast checks remain pending.
- [x] Verify that changing a roadmap step updates the completion state, percentage, and completed-step count correctly. Staging verified 0% (0/2) → 50% (1/2) → 100% (2/2) after real updates.
- [x] Test roadmap states with zero, partial, and complete progress; “partial progress” here refers to roadmap completion, not a skill-gap status. The staging session observed all three states.
- [ ] Test unauthorized, missing-career, missing-step, and server-failure responses.

## 8. Phase E — AI advisor interface

- [ ] Test long messages, repeated submissions, network failures, retry behavior, conversation continuation, and page refresh behavior.

The advisor browser smoke test confirmed the advisory disclaimer remains visible and avoids guaranteed-outcome language. The real staging question returned a safe fallback response and retained both conversation messages.
No provider label was added because the current API does not expose a safe provider-status field; the client shows a generic provider/network error instead. This remains the approved staging behavior.
The empty-answer stub produced a readable incomplete-response error, retained the user message, exposed Retry question, and did not render an empty advisor bubble; the real staging advisor also returned a non-empty safe fallback.
A client source audit found no provider keys, system prompts, private profile payloads, or debug logging exposed in the browser bundle.

**Handoff to Member 2:** Report provider timeout, fallback, output-length, or safety problems with a redacted request and response.

## 9. Phase F — 3D career hub and VR environments


The production client build remained stable before and after the desktop scene work; the MVP uses a dependency-free canvas implementation rather than adding Three.js or React Three Fiber.
The desktop career hub is implemented with keyboard navigation, pointer focus, horizontal drag look controls, readable instructions, and a reduced-motion path.
The AI Engineer environment renders a readable green-lime laboratory scene.
The Data Analyst environment renders a distinct cyan analytics studio scene.
The scene uses bounded movement and incremental horizontal look controls rather than a disorienting free-flight camera.

The VR page has API loading, empty, and error states, and the canvas provides an unsupported-device fallback; the MVP has no external 3D asset payloads.


The MVP has no models or texture payloads to optimize; the canvas scene uses lightweight procedural visuals. Formal performance measurement remains pending.
Keyboard, mouse, reduced-motion, and unsupported-device fallback behavior is implemented and locally smoke-tested; touch and headset hardware testing remain pending.
- [ ] Add WebXR support only after desktop 3D mode works reliably.
- [ ] Test entering and exiting a headset session where hardware is available.
The client keeps the metadata-only `GET /api/vr/environments` contract and does not move database or provider calls into the browser.

**Handoff to Member 2:** If the scene needs new metadata, propose the field and explain why existing safe metadata is insufficient before requesting a backend change.

## 10. Phase G — Frontend quality and integration

Static audit confirms the active catalog, career-detail, assessment, recommendations, skill-gap, roadmap, and VR pages expose appropriate loading, success, empty, and error branches; authenticated dashboard and profile summaries expose loading, success, and error states because empty profile data is a valid editable state rather than an empty collection.
- [ ] Verify responsive behavior across supported desktop, tablet, and mobile viewport sizes.
The client now provides visible focus rings for shared buttons, custom navigation links, outline actions, and VR environment cards; the complete manual accessibility matrix for focus order, contrast, headings, and non-color cues remains pending.
- [ ] Run browser compatibility checks on the supported browsers.
Local checks covered protected-route expiry and rapid advisor form submission behavior; slow-network, refresh-during-request, real-backend duplicate-submission, and cross-page expiry testing remain pending.
The local quality audit found no unused mock API paths, debug logs, provider secrets, or unfinished active routes; the stale unused route-placeholder computation was removed in the client quality branch.
The MVP desktop scenes use original dependency-free canvas visuals and do not bundle external images, icons, models, fonts, or provider assets.
- [ ] Open a final frontend integration pull request after the backend staging contract is stable.

## 11. Phase H — Staging, release, and presentation

- [x] Set the deployed client’s `VITE_API_BASE_URL` to the approved Render API URL ending in `/api` at frontend build time. The verified staging base is `https://ai-vr-career-guidance-system.onrender.com/api`.
- [x] Confirm Member 2 has set Render `CORS_ORIGIN` to the exact deployed frontend origin. The verified frontend origin is `https://ai-vr-career-guidance-system-40ti.onrender.com`.
- [x] Run the complete flow with a fresh or approved demo account: register, login, profile, assessment, recommendations, career details, skill gap, roadmap, advisor, and VR metadata. The full flow passed in the deployed browser session with a synthetic staging account.
- [ ] Verify the production build output and test the deployed application after a fresh deployment. The deployed application smoke test passed; the local production-build gate is being rerun before this item is closed.
The local desktop fallback and VR demo path were rehearsed with both MVP environments, and the deployed staging run verified both metadata selections and environment switching. WebXR and headset validation remain hardware-dependent.
Known limitations are documented by the current implementation: WebXR and headset support require compatible hardware and a future WebXR phase; the desktop canvas is the supported MVP fallback; advisor responses are guidance only and use the backend’s safe fallback behavior when the provider is unavailable.
The local walkthrough scope is prepared: authentication/profile, assessment, recommendations, career details, skill gap, roadmap, advisor, and both desktop VR environments with their fallback states. The deployed browser smoke test supplied staging screenshots and route evidence; a polished recording remains optional.
- [x] Help Member 2 perform the final end-to-end test and resolve or document every assigned issue. The approved staging flow passed; remaining limitations are WebXR/headset hardware validation, browser compatibility, and approval gates.
- [ ] Obtain both members’ approval before the final merge and release tag.

## 12. Definition of done for Member 1

Member 1’s work is complete when the client builds from a clean checkout, uses real documented APIs, handles loading and failure states, passes the agreed browser and accessibility checks, contains no final mock path or secret, and completes the shared staging flow with Member 2’s backend.

The final handoff to Member 2 must include the client branch, pull request, tested commit, environment variable names without secret values, supported browser/device notes, screenshots or manual test evidence, and a short list of unresolved limitations.
