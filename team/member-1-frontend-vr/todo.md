# Member 1 Todo: Frontend + VR

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
- [ ] Create a branch named `feature/member1-frontend-foundation`.
- [x] Initialize the React/TypeScript client inside `client/`.
- [x] Add the agreed frontend dependencies and record them in the client package file.
- [ ] Create the frontend environment file from `.env.example` without committing secrets.
- [x] Add a clear start command and verify that the development server runs locally.
- [x] Configure TypeScript and linting with strict, readable settings.
- [ ] Configure formatting and apply it to the initial client files.
- [x] Create the initial client folders: components, pages, features, layouts, services, types, assets, and libraries.
- [x] Create the application entry point and root layout.
- [x] Add a reusable page container and responsive layout system.
- [ ] Add navigation and route placeholders for every planned screen.
- [ ] Add a not-found page and a basic error boundary.
- [ ] Add loading, empty, and generic error UI components.
- [ ] Add a reusable button, input, card, modal, badge, progress bar, and notification component.
- [ ] Create initial shared types for User, Career, AssessmentQuestion, Recommendation, SkillGapItem, RoadmapStep, ChatMessage, and VREnvironment.
- [x] Add a frontend README with local setup and test commands.
- [ ] Run the client build and fix all TypeScript and lint errors.
- [ ] Commit the foundation with a focused message and open a pull request.

## Phase 2 — Design system and landing experience

- [ ] Create the shared color tokens and typography styles.
- [ ] Design the landing page hero section.
- [ ] Add a concise explanation of assessment, AI guidance, skill-gap analysis, roadmap, and VR exploration.
- [ ] Add a clear call-to-action for registration and login.
- [ ] Add responsive behavior for mobile, tablet, and desktop widths.
- [ ] Add accessible headings, labels, focus states, keyboard navigation, and sufficient contrast.
- [ ] Add the footer and project information section.
- [ ] Add placeholders for future screenshots or 3D preview assets.
- [ ] Test the landing page in the supported browsers.
- [ ] Confirm copy and visual choices with Member 2 before merging.

## Phase 3 — Authentication and profile UI

- [ ] Build the registration page with name, email, password, and validation states.
- [ ] Build the login page with email, password, validation, and server-error states.
- [ ] Build logout behavior.
- [ ] Implement the client authentication state and protected-route behavior.
- [ ] Add a session-expired state that returns the user to login safely.
- [ ] Build the profile page.
- [ ] Add editable interests, skills, experience level, learning preferences, and goals as agreed in the API contract.
- [ ] Add profile loading, save-success, validation-error, and server-error states.
- [ ] Build the dashboard shell with summary cards and navigation.
- [ ] Use mock profile data until the authentication and profile APIs are available.
- [ ] Connect the UI to `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/profile`, and `PUT /api/profile`.
- [ ] Verify that authentication failures are shown clearly without exposing sensitive details.
- [ ] Test registration, login, logout, protected navigation, refresh, and expired sessions.
- [ ] Coordinate an authentication integration session with Member 2.

## Phase 4 — Assessment experience

- [ ] Design the assessment introduction screen.
- [ ] Build the question component for the agreed question types.
- [ ] Build answer controls with keyboard and screen-reader support.
- [ ] Add question progress, back, next, and submit controls.
- [ ] Prevent submission when required answers are missing.
- [ ] Preserve answers while navigating between questions.
- [ ] Add a confirmation state before final submission.
- [ ] Add loading behavior during question retrieval and submission.
- [ ] Add a recoverable error state when questions cannot be loaded.
- [ ] Create mock questions matching the API contract.
- [ ] Connect the UI to `GET /api/assessment/questions`.
- [ ] Connect the UI to `POST /api/assessment/submit`.
- [ ] Build the assessment completion state.
- [ ] Test refresh behavior and decide how unfinished local progress is handled.
- [ ] Test assessment completion on narrow and wide screens.
- [ ] Integrate with Member 2's assessment endpoints using a real development database.

## Phase 5 — Recommendation and career detail UI

- [ ] Build the recommendations page using the agreed response shape.
- [ ] Display ranked career cards with score, reason, matched skills, and missing skills.
- [ ] Add sorting or filtering only if approved in the scope.
- [ ] Add loading skeletons and an empty-results state.
- [ ] Add a clear explanation that recommendations are guidance rather than a guaranteed outcome.
- [ ] Build the career details page.
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
- [ ] Use mock skill-gap and roadmap data while the APIs are being built.
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
- [ ] Create mock advisor responses for UI development.
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
- [ ] Create the Data Scientist environment with a simple, performant scene.
- [ ] Add career metadata and navigation from the hub to each environment.
- [ ] Add a visible exit or return-to-career-details control.
- [ ] Add loading and fallback UI if a 3D asset fails.
- [ ] Optimize models, textures, lighting, and draw calls for browser performance.
- [ ] Add a non-VR desktop fallback for unsupported devices.
- [ ] Test keyboard, mouse, touch where applicable, and reduced-motion preferences.
- [ ] Add WebXR support only after desktop 3D mode works reliably.
- [ ] Test entering and exiting a headset session where hardware is available.
- [ ] Ensure VR is an enhancement and does not block users from completing the core product journey.
- [ ] Connect safe career and progress metadata from the backend as agreed.

## Phase 9 — Frontend quality and integration

- [ ] Replace all mock data used in the final user journey with real API calls.
- [ ] Verify that every request has loading, success, empty, and error behavior.
- [ ] Verify protected routes and unauthorized responses.
- [ ] Verify responsive behavior across supported viewport sizes.
- [ ] Run accessibility checks and fix keyboard, focus, labels, contrast, and semantic issues.
- [ ] Run browser compatibility checks.
- [ ] Test slow network behavior and refresh during API requests.
- [ ] Test the complete flow: register, login, profile, assessment, recommendations, career details, skill gap, roadmap, AI advisor, and VR.
- [ ] Verify that the frontend does not contain secrets or server-only configuration.
- [ ] Update `README.md` and relevant docs when the UI behavior changes.
- [ ] Review Member 2's API changes for frontend compatibility.
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
