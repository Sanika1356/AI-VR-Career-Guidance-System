# Member 1 — Frontend and VR Remaining Work

**Owner:** Member 1

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

- [ ] Create `client/.env.local` from the current frontend environment template without committing secrets.
- [ ] Pull the latest `origin/main` and confirm that `docs/api.md` matches the backend commit being tested.
- [ ] Confirm that all client requests use `VITE_API_BASE_URL` and that no server-only value reaches the browser bundle.
- [ ] Run the client typecheck and production build before starting each feature phase.
- [ ] Record any frontend assumption in `docs/api.md` or `docs/architecture.md` only after Member 2 approves the contract change.

**Handoff to Member 2:** Send the exact API mismatch or browser error with a redacted request and response. Do not add a mock final path to hide a backend contract problem.

## 5. Phase B — Authentication and profile integration

- [ ] Test registration, login, protected navigation, refresh, client-side logout, and expired-session behavior against the real local backend.
- [ ] Coordinate one authentication integration session with Member 2 using a clean local account.
- [ ] Test profile editing for `name`, `interests`, `currentSkills`, `experience`, and `learningPreferences`.
- [ ] Omit `goals` from the profile request and UI until a future backend contract is approved.
- [ ] Test validation errors, empty optional fields, persistence after refresh, and unauthorized responses.
- [ ] Record any browser CORS or token-storage issue with the request, response status, and reproduction steps.

**Exit gate:** Both members can independently reproduce a successful authenticated profile session from separate laptops.

## 6. Phase C — Assessment, recommendations, and career details

- [ ] Test assessment refresh behavior and document how unfinished local progress is handled.
- [ ] Test assessment completion on narrow and wide screens against a real development database.
- [ ] Test long career names, missing optional fields, empty arrays, unavailable career data, and API failures.
- [ ] Compare displayed recommendation scores, reasons, matched skills, and missing skills with Member 2’s documented test responses.
- [ ] Add sorting, filtering, or saved-career state only if both members approve it in the shared scope.
- [ ] Keep recommendation language framed as guidance rather than a guaranteed outcome.

**Handoff to Member 2:** Report any response-shape mismatch before changing client types or adding fallback data.

## 7. Phase D — Skill-gap and roadmap quality

- [ ] Preserve the approved MVP skill-gap statuses: `matched` and `missing`.
- [ ] Do not render `partial` as a skill status until approved proficiency data exists in both profile and API contracts.
- [ ] Verify that skill status is not communicated by color alone and that labels remain understandable to keyboard and screen-reader users.
- [ ] Verify that changing a roadmap step updates completion state, percentage, and completed-step count correctly.
- [ ] Test roadmap states with zero, partial, and complete progress; roadmap partial progress is not the skill-gap `partial` status.
- [ ] Test unauthorized, missing-career, missing-step, and server-failure responses.

## 8. Phase E — AI advisor interface

- [ ] Test long messages, repeated submissions, network failures, retry behavior, conversation continuation, and page refresh behavior.

The advisor browser smoke test confirmed the advisory disclaimer remains visible and avoids guaranteed-outcome language.
No provider label was added because the current API does not expose a safe provider-status field; the client shows a generic provider/network error instead.
- [ ] Verify that malformed or empty advisor responses produce a readable error and do not corrupt the conversation UI.
A client source audit found no provider keys, system prompts, private profile payloads, or debug logging exposed in the browser bundle.

- [ ] Keep the advisory disclaimer visible and avoid language that promises employment or guaranteed outcomes.
- [ ] Verify that malformed or empty advisor responses produce a readable error and do not corrupt the conversation UI.
- [ ] Confirm that no provider key, system prompt, or private profile data appears in browser logs or rendered debugging output.
- [ ] Add a provider/fallback label only if Member 2 exposes a safe provider-status field in the API.


**Handoff to Member 2:** Report provider timeout, fallback, output-length, or safety problems with a redacted request and response.

## 9. Phase F — 3D career hub and VR environments


The production client build remained stable before and after the desktop scene work; the MVP uses a dependency-free canvas implementation rather than adding Three.js or React Three Fiber.
The desktop career hub is implemented with keyboard navigation, pointer focus, horizontal drag look controls, readable instructions, and a reduced-motion path.
The AI Engineer environment renders a readable green-lime laboratory scene.
The Data Analyst environment renders a distinct cyan analytics studio scene.
The scene uses bounded movement and incremental horizontal look controls rather than a disorienting free-flight camera.

The VR page has API loading, empty, and error states, and the canvas provides an unsupported-device fallback; the MVP has no external 3D asset payloads.

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
The client keeps the metadata-only `GET /api/vr/environments` contract and does not move database or provider calls into the browser.

**Handoff to Member 2:** If the scene needs new metadata, propose the field and explain why existing safe metadata is insufficient before requesting a backend change.

## 10. Phase G — Frontend quality and integration

- [ ] Verify every active page has loading, success, empty, and error behavior appropriate to its API.
- [ ] Verify responsive behavior across supported desktop, tablet, and mobile viewport sizes.
- [ ] Run accessibility checks for keyboard navigation, focus order, labels, contrast, semantic headings, and non-color status cues.
- [ ] Run browser compatibility checks on the supported browsers.
- [ ] Test slow network behavior, refresh during API requests, duplicate submissions, and expired sessions.
- [ ] Remove unused mock data, debug logs, placeholder text, and unfinished active routes.
- [ ] Confirm images, icons, models, fonts, and other assets have appropriate usage rights or are original project assets.
- [ ] Open a final frontend integration pull request after the backend staging contract is stable.

## 11. Phase H — Staging, release, and presentation

- [ ] Set the deployed client’s `VITE_API_BASE_URL` to the approved Render API URL ending in `/api` at frontend build time.
- [ ] Confirm Member 2 has set Render `CORS_ORIGIN` to the exact deployed frontend origin.
- [ ] Run the complete flow with a fresh or approved demo account: register, login, profile, assessment, recommendations, career details, skill gap, roadmap, advisor, and VR metadata.
- [ ] Verify the production build output and test the deployed application after a fresh deployment.
- [ ] Rehearse the desktop fallback and VR demo path.
- [ ] Document known limitations, especially device requirements for WebXR and advisor fallback behavior.
- [ ] Prepare a short product walkthrough, screenshots, or screen recording if required.
- [ ] Help Member 2 perform the final end-to-end test and resolve or document every assigned issue.
- [ ] Obtain both members’ approval before the final merge and release tag.

## 12. Definition of done for Member 1

Member 1’s work is complete when the client builds from a clean checkout, uses real documented APIs, handles loading and failure states, passes the agreed browser and accessibility checks, contains no final mock path or secret, and completes the shared staging flow with Member 2’s backend.

The final handoff to Member 2 must include the client branch, pull request, tested commit, environment variable names without secret values, supported browser/device notes, screenshots or manual test evidence, and a short list of unresolved limitations.
