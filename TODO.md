# AI+VR Career Guidance System — Unified Future Feature TODO

**Purpose:** This is the single forward-looking product roadmap for work after the current MVP release. Completed MVP implementation, deployment, resilience, browser, and release tasks are intentionally not repeated here. The current MVP remains the source of truth for the approved career catalog, API contract, local PostgreSQL setup, Render/Neon deployment, custom bearer authentication, two VR environments, and `matched`/`missing` skill-gap statuses.

> **Working rule:** Do not add a task to a member TODO merely because it is desirable. Add it here first, agree on the API/data contract, assign an owner, define acceptance evidence, and then split implementation into member-specific branches.

## Priority and ownership model

| Priority | Meaning                                              | Delivery rule                                                |
| -------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| P0       | Trust, safety, release, or blocker removal           | Must be completed before expanding user-facing scope         |
| P1       | High-value differentiator for the next major release | Complete after the contract and evaluation plan are approved |
| P2       | Valuable expansion                                   | Implement after P1 stability and measurable user benefit     |
| P3       | Optional enhancement                                 | Consider only after cost, privacy, and maintenance review    |

| Owner                  | Primary responsibility                                                               | Coordination requirement                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Frontend/VR workstream | React client, accessibility, interaction design, VR/WebXR, device testing            | Maintain the client against documented contracts and provide screenshots, device logs, and browser evidence |
| Backend/AI workstream  | Express API, PostgreSQL, migrations, scoring, AI boundaries, observability, security | Publish request/response/error contracts, tests, migrations, seed updates, and safe configuration guidance  |
| Project owner          | Product decisions, contract changes, evaluation, privacy, release demonstrations     | Approve shared types, profile fields, statuses, authentication, and release scope                           |

## Phase 0 — Product governance and measurement (P0) — completed

The product specification, success metrics and privacy-safe event vocabulary, API-contract change process, data dictionary, responsible-AI checklist, and architecture decision log are documented in [`docs/product-governance-pack.md`](docs/product-governance-pack.md) and accepted by the project owner.

## Phase 1 — Trust, security, privacy, and reliability (P0)

- [ ] Add scheduled PostgreSQL backup verification and a documented restore rehearsal using non-production data.
- [ ] Review CORS, security headers, request size limits, token expiry, password policy, session invalidation, and deployment environment variables before every major release.

**Acceptance evidence:** A security/privacy checklist, CI run, redacted audit-log sample, backup-restore record, and failure-injection test are committed without secrets.

## Phase 2 — Career intelligence and extensible catalog (P1)

- [ ] Add a scheduled, reviewable catalog-refresh pipeline with source version, imported-at time, license metadata, diff report, rollback, and manual approval before publication.
- [ ] Add labor-market or education-resource adapters only after source licensing, freshness, privacy, and cost are approved. Keep external data optional and cacheable.

**Acceptance evidence:** A versioned import fixture, ontology migration, diff report, explanation snapshot, career comparison contract, and tests proving the existing MVP catalog still works.

## Phase 3 — Better assessment and learner modeling (P1)

- [ ] Add optional learner goals, constraints, preferred work conditions, education stage, location preference, and time budget only through an approved contract change; do not add client-only fields.
- [ ] Add accessibility support for keyboard-only completion, screen readers, reduced motion, high contrast, readable error summaries, and save/resume across devices.
- [ ] Add fairness evaluation across synthetic demographic profiles without collecting sensitive demographic data by default.
- [ ] Add a user-controlled confidence and correction flow so learners can correct an inferred interest or skill rather than accepting it as fact.

**Acceptance evidence:** Versioned question fixtures, adaptive-sequence tests, accessible browser evidence, explanation examples, retake comparison screenshots, and fairness review notes.

## Phase 4 — Personalized roadmap and learning execution (P1)

- [ ] Add prerequisite-aware skill-gap prioritization based on career value, dependency order, learner time budget, confidence, and transferable skills.
- [ ] Add reminders and notification preferences with quiet hours and an opt-out path; keep email or messaging integrations optional and zero-cost by default.
- [ ] Add portfolio evidence attachments through a private storage design with file type limits, malware scanning plan, ownership checks, deletion, and no public exposure by default.
- [ ] Add offline-friendly draft handling for assessment and roadmap notes, with conflict resolution when the device reconnects.

**Acceptance evidence:** Roadmap migration, API contract, dependency-order tests, resource provenance examples, progress screenshots, and privacy/security tests for attachments.

## Phase 5 — Grounded AI advisor and evaluation (P1)

- [ ] Add conversation memory controls: per-conversation scope, clear-history action, retention setting, export, deletion, and no hidden sensitive memory.
- [ ] Add prompt/response redaction and observability that stores metrics and evaluation IDs rather than raw sensitive conversations by default.
- [ ] Add a human-review or escalation pathway for unsafe, discriminatory, or high-impact guidance.

**Acceptance evidence:** Provider-neutral interface tests, grounded answer examples with citations, injection test corpus, red-team report, redacted evaluation scores, and cost/latency dashboard.

## Phase 6 — VR fallback quality and WebXR (P1)

- [ ] Finish the remaining physical validation: target-device desktop fallback frame timing, touchscreen interaction, and compatible-headset entry/exit.
- [ ] Add a capability detector that distinguishes desktop canvas fallback, inline WebXR, and immersive WebXR. Never show an immersive control when `immersive-vr` is unsupported.
- [ ] Add explicit WebXR lifecycle support: user-activated `requestSession('immersive-vr')`, XR render loop, session `end` handling, cleanup, permissions messaging, and fallback recovery.
- [ ] Add headset-friendly scene controls, controller/select events, recentering, seated/standing mode, and a clear exit action.
- [ ] Add guided career simulations: inspect tools, complete a short task, receive feedback, and connect the experience to a skill-gap item.
- [ ] Add scene-level accessibility: captions, audio-description option, comfort settings, seated mode, reduced motion, contrast, non-VR controls, and motion-sickness recovery.
- [ ] Add asset budgets, lazy loading, texture limits, draw-call monitoring, frame-time telemetry, and graceful low-power fallback.
- [ ] Add device/browser compatibility matrix and automated smoke coverage for desktop fallback, inline WebXR, and immersive WebXR where hardware exists.

**Acceptance evidence:** WebXR capability matrix, headset recordings or device logs, target-device frame-time report, touch test report, session lifecycle tests, and screenshots showing fallback behavior.

## Phase 7 — Experiential career practice (P2)

- [ ] Add short, domain-specific work simulations for AI engineering, data analysis, healthcare, design, business, education, cybersecurity, and other approved domains.
- [ ] Add scenario branching so learners can make decisions and see trade-offs rather than passively viewing a scene.
- [ ] Add rubric-based feedback tied to canonical skills, with a clear distinction between practice feedback and a professional qualification.
- [ ] Add project briefs that produce portfolio artifacts, reflection notes, and skill evidence.
- [ ] Add role-play modes for stakeholder communication, teamwork, presentation, and technical interviews.
- [ ] Add mock interview practice with transcript, rubric, optional speech input, and explicit privacy controls; keep browser speech features optional.
- [ ] Add a resume/portfolio builder that maps user-approved evidence to skills and never invents achievements.

**Acceptance evidence:** At least three complete simulations, skill-linked rubrics, artifact ownership tests, accessible fallback flows, and learner usability feedback.

## Phase 8 — Collaboration and career readiness (P2)

- [ ] Add shareable, privacy-controlled progress reports that exclude sensitive profile and conversation details by default.
- [ ] Add mentor or instructor review mode with explicit invitation, least-privilege access, audit history, and revoke access.
- [ ] Add classroom/cohort support only after organization boundaries, tenant isolation, roles, and data export/deletion are designed.
- [ ] Add peer discussion or study groups with moderation, reporting, blocking, and retention controls.
- [ ] Add job-description parsing as an optional import that extracts skills for comparison but does not automatically apply or submit for jobs.
- [ ] Add interview and application preparation plans that connect a target role to evidence-backed skills and learning milestones.

**Acceptance evidence:** Permission matrix, cross-user isolation tests, share/revoke screenshots, moderation policy, and redacted end-to-end collaboration demo.

## Phase 9 — Analytics, research, and continuous improvement (P2)

- [ ] Add privacy-preserving product analytics with event minimization, consent, retention, deletion, and aggregate-only dashboards.
- [ ] Add recommendation quality monitoring for empty results, repeated careers, unexplained ranking changes, stale skills, and catalog drift.
- [ ] Add AI quality monitoring for grounding, refusal rate, latency, fallback rate, user feedback, and unsafe-output review.
- [ ] Add VR telemetry only with consent and coarse metrics; do not collect raw movement or biometric data by default.
- [ ] Add experiment flags and pre-registered evaluation plans for assessment, advisor, and VR changes. Avoid dark patterns and never hide core functionality from a control group without review.

**Acceptance evidence:** Consent-aware event schema, aggregate dashboard, quality alerts, experiment plan, and published limitations copy.

## Phase 10 — Release excellence (P0/P1)

- [ ] Add end-to-end tests from registration through assessment, recommendation, skill gap, roadmap, advisor, VR fallback, data deletion, and logout/session expiry.
- [ ] Add API contract tests generated from `docs/api.md` and shared client types.
- [ ] Add visual regression captures at mobile, tablet, desktop, Firefox, WebKit, Edge, and supported headset/touch configurations as available.
- [ ] Add accessibility testing with keyboard, screen reader, contrast, focus order, reduced motion, and touch alternatives.
- [ ] Add load and soak tests for health, authentication, catalog, recommendations, roadmap, and advisor rate limits using synthetic data only.
- [ ] Add disaster-recovery rehearsal, migration rollback plan, release checklist, changelog, and rollback procedure for Render/Neon.
- [ ] Maintain a release matrix showing code commit, database migration version, frontend API base URL, backend CORS origin, seed mode, tests, and known limitations.
- [ ] Require both members’ final demonstration approval before a major release; retain explicit user approval as a separate production gate.

**Acceptance evidence:** CI artifacts, accessibility report, load-test summary, release matrix, rollback rehearsal, changelog, and signed demonstration approval.

## Feature decision guardrails

- [ ] Do not add third-party authentication, AI, job, email, analytics, or storage providers without an explicit cost, privacy, failure-mode, and account-ownership decision.
- [ ] Prefer local PostgreSQL, deterministic services, free/open data sources, and provider-neutral adapters for the college-project budget.
- [ ] Do not expose server secrets in `VITE_*` variables or commit credentials, real connection strings, bearer tokens, or private user data.
- [ ] Do not add profile fields, career statuses, skill statuses, or VR environments directly in the client without updating the shared contract and backend tests.
- [ ] Do not claim AI accuracy, psychometric validity, employability, medical/mental-health suitability, salary accuracy, or WebXR readiness without evidence.
- [ ] Keep the career catalog broader than the VR catalog. Additional domains and careers must not require a VR environment.

## Research references

The roadmap’s career-intelligence direction is compatible with the official O*NET database, which provides occupational, worker, skill, interest, software, and work-activity information in multiple formats and under a Creative Commons license [1]. The European Commission’s ESCO services provide web and local APIs for skills and occupations used in job matching, skills intelligence, and career guidance [2]. WebXR requirements and session lifecycle terminology follow the WebXR API documentation and specification [3] [4].

[1]: https://www.onetcenter.org/database.html "O*NET Database at O*NET Resource Center"
[2]: https://esco.ec.europa.eu/en/use-esco/use-esco-services-api "Use ESCO Services (API)"
[3]: https://developer.mozilla.org/en-US/docs/Web/API/XRSystem/requestSession "MDN XRSystem.requestSession()"
[4]: https://www.w3.org/TR/webxr/ "W3C WebXR Device API Specification"
