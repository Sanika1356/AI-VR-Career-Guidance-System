# Member 1 Todo: Frontend + VR

**Owner:** Member 1
**Primary areas:** `client/`, frontend-related parts of `docs/`, and the 3D/VR experience
**Works with:** Member 2 through the API contract in `docs/api.md`

This checklist covers the complete project from repository setup to final delivery. Check items only after the implementation has been tested and documented.

## Phase 0 — Understand the project and agree with Member 2

- [ ] Add any agreed frontend assumptions to `docs/architecture.md` or `docs/api.md`.

## Phase 1 — Local setup and frontend foundation

- [ ] Create the frontend environment file from `.env.example` without committing secrets.

## Phase 2 — Design system and landing experience

- [ ] Test the landing page in the supported browsers.
- [ ] Confirm copy and visual choices with Member 2 before merging.

## Phase 3 — Authentication and profile UI

- [ ] Test registration, login, logout, protected navigation, refresh, and expired sessions.
- [ ] Coordinate an authentication integration session with Member 2.

## Phase 4 — Assessment experience

- [ ] Test refresh behavior and decide how unfinished local progress is handled.
- [ ] Test assessment completion on narrow and wide screens.
- [ ] Integrate with Member 2's assessment endpoints using a real development database.

## Phase 5 — Recommendation and career detail UI

- [ ] Add sorting or filtering only if approved in the scope.
- [ ] Add a saved or selected-career state if required by the product flow.
- [ ] Test long career names, missing optional fields, empty arrays, and API failures.
- [ ] Compare the displayed score and reason with Member 2's test responses.

## Phase 6 — Skill-gap and roadmap UI

- [ ] Avoid using color alone to communicate skill status.
- [ ] Verify that changing a roadmap step updates the progress display correctly.
- [ ] Test the pages with zero, partial, and complete progress.

## Phase 7 — AI advisor interface

- [ ] Add an explicit provider/fallback label only if the backend later exposes a safe provider-status field.
- [ ] Display timestamps only where useful and keep the interface readable.
- [ ] Test long messages, repeated submissions, network failures, and page refresh behavior.

## Phase 8 — 3D career hub and VR environments

- [ ] Add Three.js and React Three Fiber only after confirming the frontend build remains stable.
- [ ] Add a desktop keyboard and mouse interaction model.
- [ ] Add camera controls and prevent disorienting default behavior.
- [ ] Create the AI Engineer environment with a simple, performant scene.
- [ ] Create the Data Analyst environment with a simple, performant scene.
- [ ] Add loading and fallback UI if a 3D asset fails.
- [ ] Optimize models, textures, lighting, and draw calls for browser performance.
- [ ] Test keyboard, mouse, touch where applicable, and reduced-motion preferences.
- [ ] Add WebXR support only after desktop 3D mode works reliably.
- [ ] Test entering and exiting a headset session where hardware is available.

## Phase 9 — Frontend quality and integration

- [ ] Verify that every request has loading, success, empty, and error behavior.
- [ ] Verify responsive behavior across supported viewport sizes.
- [ ] Run accessibility checks and fix keyboard, focus, labels, contrast, and semantic issues.
- [ ] Run browser compatibility checks.
- [ ] Test slow network behavior and refresh during API requests.
- [ ] Test the complete flow: register, login, profile, assessment, recommendations, career details, skill gap, roadmap, AI advisor, and VR.
- [ ] Open a final frontend integration pull request.

## Phase 10 — Release preparation and presentation

- [ ] Remove unused mock data, debug logs, placeholder text, and unfinished routes.
- [ ] Confirm that all images, icons, models, and fonts have appropriate usage rights or are original project assets.
- [ ] Add a short product walkthrough for the final demonstration.
- [ ] Prepare screenshots or a screen recording of the core journey if required.
- [ ] Rehearse the VR fallback and the desktop demo path.
- [ ] Confirm the deployed frontend points to the correct backend URL.
- [ ] Verify production build output.
- [ ] Test the deployed application with a fresh account or approved demo account.
- [ ] Document known limitations, especially device requirements for WebXR.
- [ ] Help Member 2 perform the final end-to-end test.
- [ ] Confirm every assigned issue is closed or documented.
- [ ] Tag the final release after both members approve the demo build.
