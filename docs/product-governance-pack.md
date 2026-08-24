# Product Governance Pack

**Project:** AI-VR Career Guidance System

**Status:** Phase 0 foundation for future feature work

**Owner:** The project owner now manages the complete product. Frontend/VR and backend/AI are workstreams within one coordinated ownership model.

## 1. Product specification

### 1.1 Product goal

Pathfinder helps learners explore career domains, understand why careers may fit their interests and existing skills, identify skill gaps, follow an actionable learning roadmap, ask grounded career questions, and optionally explore selected careers through an accessible desktop or immersive VR experience.

The product is an **educational decision-support system**, not a job-placement service, psychological diagnostic, professional licensing authority, or guarantee of employment. It must communicate uncertainty and encourage learners to verify time-sensitive claims.

### 1.2 Target learner

The primary learner is a student or early-career person who is exploring multiple technology and non-technology career directions, has incomplete information about their current skills, and wants a concrete next step. The experience should also be usable by a college instructor or mentor reviewing a learner’s progress only when the learner explicitly grants access.

### 1.3 Supported career scope

The catalog must remain broader than the VR catalog. AI Engineer and Data Analyst are the approved MVP examples, while future catalog domains may include software engineering, cybersecurity, design, business, healthcare, education, research, product, and other reviewed domains. A career does not require a VR environment to appear in the guidance system.

The career catalog should use stable internal IDs and preserve source provenance. O*NET and ESCO are candidate future data adapters because they publish occupational and skill information suitable for career guidance and job/skill matching [1] [2]. An adapter must remain optional and must not replace the current local catalog until licensing, freshness, privacy, and maintenance are reviewed.

### 1.4 Current MVP boundary

The released MVP includes local PostgreSQL persistence, stateless bearer authentication, editable learner profile fields supported by the current contract, a seeded assessment, recommendations, matched/missing skill-gap results, ordered roadmaps, an advisor route with deterministic fallback behavior, a broader career catalog, and two VR environment records. The desktop VR experience is a canvas fallback; immersive WebXR is future scope.

### 1.5 Explicit non-goals

The system will not infer protected traits, diagnose mental-health conditions, promise employment, submit job applications, provide regulated financial/legal/medical advice, expose private learner data publicly, or treat an AI answer as authoritative merely because it sounds confident. It will not require every catalog career to have a VR environment.

### 1.6 Success metrics

| Metric | Definition | Desired direction | Privacy rule |
|---|---|---|---|
| Assessment completion | Authenticated assessments reaching a valid submitted result divided by started assessments | Increase | Store aggregate counts and opaque IDs; never store answer text in analytics |
| Recommendation explanation usefulness | Positive learner rating for why a career was recommended | Increase | Store rating, version, and aggregate reason code; not free-text by default |
| Roadmap activation | Learners who open a roadmap and begin at least one step | Increase | Store aggregate milestone event and opaque user ID with retention limit |
| Roadmap completion | Roadmap steps completed within the selected plan | Increase | Store step status and timestamps; allow deletion/export |
| Advisor helpfulness | Positive answer rating divided by rated answers | Increase | Store rating and evaluation ID; redact conversation content |
| VR fallback engagement | Consent-based sessions that load an environment and interact with a control | Increase | Store coarse event only; no raw movement or biometric data |
| Return usage | Learners who return within 7 and 30 days | Increase | Use pseudonymous event IDs and a documented retention period |
| Safety rate | Flagged or corrected AI outputs divided by evaluated outputs | Decrease | Store redacted evaluation labels and model/config version |
| Reliability | Successful API requests, error rate, and request timing by route | Improve | Store request ID, route, status, and timing; never tokens or payloads |

### 1.7 Initial event vocabulary and retention

The initial privacy-safe event vocabulary is `assessment_started`, `assessment_completed`, `recommendations_viewed`, `career_viewed`, `skill_gap_viewed`, `roadmap_viewed`, `roadmap_step_completed`, `advisor_answer_rated`, `vr_environment_loaded`, `vr_control_used`, `session_expired`, `data_export_requested`, and `account_deleted`. Events must contain event name, UTC timestamp, application version, coarse route, consent state, and a short-lived pseudonymous subject ID. Default retention is 90 days for product analytics and 30 days for operational request metrics; deletion and export must cover event records associated with the account where technically possible.

The current Phase 1 implementation also persists a separate server-side audit stream for `auth_register_success`, `auth_login_success`, `privacy_consent_changed`, `profile_changed`, `recommendation_generated`, `advisor_requested`, `data_exported`, and `account_deleted`. Audit metadata is limited to request IDs and small allowlisted primitive fields; passwords, bearer tokens, raw prompts, raw answers, and full profile text are excluded. The API emits structured request logs and maintains rolling aggregate API latency/error, AI latency/failure/fallback, and labelled rate-limit counters. Configurable thresholds emit one redacted alert event per metric window; these operational counters are not a substitute for the future consent-aware analytics pipeline.

## 2. Shared API-contract change process

The API contract in `docs/api.md` remains the source of truth. A contract change is required for a new endpoint, request field, response field, enum/status, authentication rule, error envelope, database-backed relationship, or behavior that changes an existing client assumption.

| Step | Required artifact | Owner |
|---|---|---|
| 1. Proposal | Problem, user value, non-goals, privacy impact, cost, and backward-compatibility statement | Proposer |
| 2. Contract draft | Method/path, auth rule, request, success response, validation errors, unauthorized/forbidden/not-found/server errors, pagination or limits, and examples | Project owner |
| 3. Client impact | Updated shared types, loading/error states, accessibility implications, and migration fallback | Project owner — frontend/VR workstream |
| 4. Data impact | Schema change, migration, indexes, seed fixture, rollback, retention, and ownership rules | Project owner — backend/AI workstream |
| 5. Test plan | Unit, integration, contract, security, failure, and browser evidence required for completion | Project owner |
| 6. Implementation | Dedicated branch, focused commits, no secrets, and no unrelated refactors | Project owner |
| 7. Review | Project owner confirms the contract, tests, privacy, and failure behavior | Project owner |
| 8. Release | Update changelog, deployment notes, TODO status, and rollback instructions | Project owner |

Backward-compatible additions should be preferred. Removing or renaming a field requires a deprecation period or a coordinated client/server release. The client must not invent fields or call database/provider APIs directly.

## 3. Data dictionary

| Entity | Required fields | Optional fields | Sensitive data and controls |
|---|---|---|---|
| User | `id`, `name`, `email`, password hash, created/updated timestamps | Account status, last-login timestamp | Passwords are hashed; tokens and raw credentials are never logged |
| Profile | User ID, supported interests, current skills, experience, learning preferences | Future goals/constraints only after an approved contract change | Learner-entered text is private, exportable, deletable, and untrusted input |
| Assessment | Assessment ID, version, ordered questions, status, created/completed timestamps | Locale, question-bank version | Answer content is account data; answer keys stay server-side |
| Assessment result | Result ID, user ID, assessment ID/version, career scores, completed timestamp | Explanation reasons, confidence, comparison link | Expose only user-authorized results; do not present as diagnosis |
| Career | Stable ID, domain, name, description, required skills, source/version | Aliases, education paths, resources, labor-market metadata, VR key | Source, license, freshness, and uncertainty must be retained |
| Skill | Stable ID, canonical name, aliases, domain | Level scale, prerequisites, related/transferable skills | Taxonomy source/version and mapping confidence required |
| Recommendation | User/result ID, career ID, score, rank, explanation reasons, algorithm version | Confidence, matched/missing evidence | Never imply certainty; preserve algorithm version for comparison |
| Skill gap | User/career ID, skill ID, status, evidence, calculation version | Priority, target level, transferability | MVP statuses remain `matched` and `missing` until the project owner approves a richer model |
| Roadmap | Roadmap ID, user/career ID, version, ordered steps | Time budget, target dates, resource links | User controls completion; source links require provenance |
| Roadmap step | Step ID, roadmap ID, order, skill, title, description, completed state | Estimate, notes, evidence links | Notes and attachments are private account data |
| Advisor conversation | Conversation ID, user ID, scope, created/updated timestamps | Retention setting, deleted timestamp | Conversation text is sensitive; redact and delete on request |
| Advisor message | Message ID, conversation ID, role, created timestamp | Provider/model version, citations, rating | Do not store raw prompt/answer by default; sanitize sources |
| VR environment | Stable key, career ID, title, description, availability | Runtime, version, asset manifest, accessibility metadata | Environment metadata is public-safe; visits are not persisted in MVP |
| Consent | User ID, purpose, version, decision, timestamp | Withdrawal timestamp | Separate purposes; withdrawal must stop optional collection |
| Analytics event | Event ID, event name, timestamp, version, coarse route | Pseudonymous subject ID, consent state | Minimize payload, limit retention, support deletion/export |
| Audit event | Event ID, actor type, action, resource class, request ID, timestamp | Outcome and reason code | Never store passwords, bearer tokens, raw prompts, or full profile text |

## 4. Responsible-AI review checklist

Before an AI-backed change is released, the project owner must record the following checks:

- [ ] The feature states what the model can and cannot do, including uncertainty and fallback behavior.
- [ ] The prompt and retrieval boundary uses only the learner data necessary for the task and respects account authorization.
- [ ] Profile text, imported career text, job descriptions, and external resources are treated as untrusted data and cannot override system safety rules.
- [ ] The answer is grounded in approved catalog, skill, roadmap, or cited source data when it makes factual career claims.
- [ ] Time-sensitive claims such as salary, demand, licensing, or course availability include a source, date, or verification instruction.
- [ ] Tests cover hallucination, prompt injection, sensitive requests, discrimination, overconfidence, repetitive answers, provider failure, timeout, rate limit, and empty context.
- [ ] The system avoids protected-trait inference and does not use sensitive demographics for recommendations by default.
- [ ] The user can correct an inference, clear conversation context, delete data, and report an unsafe answer.
- [ ] Logs and analytics are redacted and contain model/configuration IDs rather than private prompts and raw responses.
- [ ] Evaluation uses a versioned, redacted dataset with helpfulness, grounding, safety, refusal quality, and bias review.
- [ ] A deterministic non-provider fallback remains usable for core career, skill-gap, and roadmap guidance.
- [ ] The release record lists known limitations and the human escalation path for high-impact or unsafe guidance.

## 5. Architecture decision log

| ID | Decision | Rationale | Status |
|---|---|---|---|
| ADR-001 | Keep the current REST API and PostgreSQL backend for the MVP | Simple two-person ownership, local fallback, and clear client/server boundary | Accepted |
| ADR-002 | Keep custom stateless bearer authentication for the released MVP | Avoid a forced provider migration and keep the zero-cost local workflow | Accepted |
| ADR-003 | Keep the career catalog broader than the VR catalog | Career guidance must remain useful when no VR environment exists | Accepted |
| ADR-004 | Keep VR environment metadata independent from career/recommendation/roadmap contracts | Additional environments can be added without changing core guidance APIs | Accepted |
| ADR-005 | Keep skill-gap MVP statuses limited to `matched` and `missing` | Avoid inventing semantics until both members approve a richer proficiency model | Accepted |
| ADR-006 | Use provider-neutral AI boundaries and deterministic fallback behavior | Prevent provider lock-in and preserve core functionality during outages | Accepted |
| ADR-007 | Treat external O*NET/ESCO imports as optional adapters | Preserve local reproducibility while enabling richer future career intelligence | Proposed for next feature phase |
| ADR-008 | Treat immersive WebXR as a separate capability layer over desktop fallback | Hardware support, permissions, lifecycle, and accessibility differ from canvas fallback | Proposed for next feature phase |

## 6. Definition of done for governance work

Phase 0 governance is complete when the project owner reviews this document, the root roadmap links to it, the shared API contract points to the change process, and future feature PRs reference the relevant metric, entity, safety check, decision, and acceptance evidence.

## References

[1]: https://www.onetcenter.org/database.html "O*NET Database at O*NET Resource Center"

[2]: https://esco.ec.europa.eu/en/use-esco/use-esco-services-api "Use ESCO Services (API)"

[3]: https://www.nist.gov/itl/ai-risk-management-framework "NIST AI Risk Management Framework"
