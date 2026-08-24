# API Contract

This document is the shared agreement between the frontend and backend. Member 2 implements these endpoints. Member 1 consumes them and may use mock responses with the same shapes before the server is ready.

## General conventions

- Base path: `/api`
- Content type: `application/json`
- Authentication: stateless bearer token in the `Authorization: Bearer <token>` header
- Dates: ISO 8601 strings in UTC
- IDs: stable string identifiers; database-backed IDs use the repository's string ID convention
- Validation errors: HTTP `400`
- Unauthenticated requests: HTTP `401`
- Forbidden requests: HTTP `403`
- Missing resources: HTTP `404`
- Unexpected server errors: HTTP `500`
- Request tracing: every response includes an opaque `X-Request-Id`; clients may send one and should include it in support reports
- Operational privacy: structured logs and audit events never contain passwords, bearer tokens, raw prompts, raw answers, or full private profile text

## Health

### `GET /api/health`

Returns the server status and can be used by both members to verify local connectivity.

```json
{
  "status": "ok",
  "service": "career-guidance-api"
}
```

### Request IDs and operational signals

The server returns an opaque `X-Request-Id` header on every request and uses it to correlate a request log with a server-side audit event when applicable. API request logs contain method, path, status, and duration only. The backend also maintains rolling aggregate API latency/error, AI latency/failure/fallback, and labelled rate-limit counters; configurable thresholds emit redacted alert events without exposing user payloads.

## Authentication and profile

### `POST /api/auth/register`

Request:

```json
{
  "name": "Student Name",
  "email": "student@example.com",
  "password": "secure-password"
}
```

Response:

```json
{
  "user": {
    "id": "user_123",
    "name": "Student Name",
    "email": "student@example.com"
  },
  "token": "server-generated-token"
}
```

### `POST /api/auth/login`

Request:

```json
{
  "email": "student@example.com",
  "password": "secure-password"
}
```

Response:

```json
{
  "user": {
    "id": "user_123",
    "name": "Student Name",
    "email": "student@example.com"
  },
  "token": "server-generated-token"
}
```

### Authentication token lifecycle

The MVP returns a stateless bearer token from registration and login. The client sends it in the `Authorization: Bearer <token>` header for protected requests. The MVP does not expose refresh or logout endpoints: logout is implemented client-side by clearing the stored token, and an expired or invalid token receives HTTP `401` and requires a new login.

### `GET /api/profile`

Returns the authenticated user's profile, interests, current skills, and learning preferences.

### `PUT /api/profile`

Updates editable profile fields. The request and response must use the same field names as the frontend types.

## Privacy and account data

All privacy endpoints require the authenticated user’s bearer token. Optional collection is disabled by default for new and migrated accounts.

### `GET /api/privacy/consent`

Returns the authenticated user’s privacy choices.

```json
{
  "consent": {
    "analytics": false,
    "personalizedAi": false,
    "vrTelemetry": false,
    "policyVersion": "v1",
    "updatedAt": null
  }
}
```

### `PUT /api/privacy/consent`

Stores explicit boolean choices for optional analytics, personalized advisor context, and coarse VR telemetry.

Request:

```json
{
  "analytics": true,
  "personalizedAi": true,
  "vrTelemetry": false
}
```

### `GET /api/privacy/export`

Returns a JSON export of the authenticated user’s account, profile, privacy choices, assessments, results, recommendations, roadmap progress, conversations, and messages. Password hashes, bearer tokens, and server-only values are never included.

### `DELETE /api/privacy/account`

Permanently deletes the authenticated user and all account-owned records covered by the database cascade rules. The client must ask for confirmation, clear its local session, and return the user to sign-in after a successful deletion.

## Careers

### `GET /api/careers?language=<code>`

Returns available career paths. `language` is optional and defaults to `en`; the current local label seed includes `en` and `es`. A regional code such as `es-MX` first tries the regional label, then `es`, then `en`.

```json
[
  {
    "id": "career_ai_engineer",
    "name": "AI Engineer",
    "description": "Builds intelligent software systems.",
    "skills": ["Python", "Machine Learning", "APIs"],
    "environmentKey": "ai-engineer-lab"
  }
]
```

### `GET /api/careers/:careerId?language=<code>`

Returns full information for one career, including required skills, recommended learning resources, and the VR environment key when available. Career and skill labels use the same requested-language, base-language, then English fallback.

### `GET /api/careers/comparison?careerIds=<id1>,<id2>[,<id3>...]&language=<code>`

Returns a read-only comparison for two to five distinct careers from the local catalog. The response preserves the requested order and includes skills, project-authored work activities, a directional learning-effort label with roadmap/resource counts, transferable skills available in the ontology, optional VR environment metadata, and explicit uncertainty notes. It does not claim salary, employment probability, licensing status, or other external labor-market facts.

```json
{
  "careers": [
    {
      "id": "career_ai_engineer",
      "name": "AI Engineer",
      "domain": "technology",
      "description": "Builds intelligent software systems.",
      "skills": ["Machine Learning", "Python"],
      "workActivities": [
        "Build and evaluate a small intelligent-system feature"
      ],
      "learningEffort": {
        "label": "substantial",
        "roadmapStepCount": 2,
        "resourceCount": 3
      },
      "transferableSkills": ["Communication"],
      "environment": {
        "key": "ai-engineer-lab",
        "title": "AI Engineering Lab",
        "available": true
      },
      "uncertainty": [
        "Project-authored comparison metadata is directional and is not a labor-market forecast or qualification."
      ]
    }
  ]
}
```

The route is rate-limited with the catalog limiter. It returns `400` for fewer than two, more than five, malformed, or duplicate IDs and `404` when any requested career is not in the catalog.

## Assessment

### `GET /api/assessment/questions`

Returns ordered assessment questions without exposing answer keys or internal scoring weights.

```json
{
  "assessmentId": "assessment_123",
  "questions": [
    {
      "id": "question_1",
      "text": "Which activity interests you most?",
      "type": "single-choice",
      "options": [
        { "id": "option_a", "label": "Building software" },
        { "id": "option_b", "label": "Analyzing data" }
      ]
    }
  ]
}
```

### `GET /api/assessment/next?assessmentId=<id>&answeredQuestionIds=<id1,id2>`

Returns the next published question for an in-progress assessment. The selector is deterministic: it prioritizes the least-covered question domain, then the lowest difficulty, then stable display order. The `answeredQuestionIds` query value is optional and is a bounded comma-separated list. When all published questions are answered, the response returns `done: true` and `question: null`.

```json
{
  "assessmentId": "assessment_123",
  "done": false,
  "question": {
    "id": "question_2",
    "text": "Which project sounds useful?",
    "type": "single-choice",
    "options": [{ "id": "option_a", "label": "Automating a workflow" }]
  },
  "selection": {
    "strategy": "coverage-first-deterministic",
    "reason": "Selects the least-covered domain, then the lowest difficulty and stable display order."
  }
}
```

The client keeps this route opt-in behind `VITE_ENABLE_ADAPTIVE_ASSESSMENT=false` by default; the existing complete-question-set flow remains the safe fallback until adaptive sequencing is enabled and browser-tested.

### `POST /api/assessment/submit`

Request:

```json
{
  "assessmentId": "assessment_123",
  "answers": [{ "questionId": "question_1", "optionId": "option_a" }]
}
```

Response:

```json
{
  "resultId": "result_123",
  "completedAt": "2026-08-18T00:00:00.000Z",
  "topCareerIds": ["career_ai_engineer", "career_data_analyst"]
}
```

### `GET /api/assessment/results/:resultId`

Returns the detailed assessment result and category scores. When stored answer evidence is available, the response also includes `explanations`. Each explanation identifies the career signal, the score contribution, a low/medium/high heuristic confidence label, up to three supporting answer signals, and a caveat that the result is not a diagnosis or guarantee.

```json
{
  "resultId": "result_123",
  "completedAt": "2026-08-18T00:00:00.000Z",
  "categoryScores": { "career_ai_engineer": 5 },
  "topCareerIds": ["career_ai_engineer"],
  "explanations": [
    {
      "careerId": "career_ai_engineer",
      "score": 5,
      "confidence": "high",
      "supportingSignals": [
        "Which activity interests you most?: Building software"
      ],
      "caveat": "This explanation summarizes assessment signals; it is not a diagnosis or a guarantee of fit."
    }
  ]
}
```

### `GET /api/assessment/results/:resultId/comparison?previousResultId=<id>`

Compares the authenticated learner’s current result with one earlier owned result. Results remain immutable; the comparison is derived at request time from stored answers and scores. It reports changed answer selections, career score deltas, top-career additions/removals, and the question-bank versions used for both attempts. When versions differ, `questionBankVersionMatches` is `false` and the explanation asks the learner to interpret changes cautiously.

```json
{
  "currentResultId": "result_new",
  "previousResultId": "result_old",
  "currentCompletedAt": "2026-08-24T00:00:00.000Z",
  "previousCompletedAt": "2026-08-18T00:00:00.000Z",
  "currentQuestionBankVersion": 1,
  "previousQuestionBankVersion": 1,
  "questionBankVersionMatches": true,
  "changedAnswers": [
    {
      "questionId": "question_1",
      "questionText": "Which activity interests you most?",
      "previousOptionId": "option_b",
      "previousOptionLabel": "Analyzing data",
      "currentOptionId": "option_a",
      "currentOptionLabel": "Building software"
    }
  ],
  "scoreChanges": [
    {
      "careerId": "career_ai_engineer",
      "previousScore": 2,
      "currentScore": 5,
      "delta": 3
    }
  ],
  "topCareerChanges": { "added": ["career_ai_engineer"], "removed": [] },
  "explanation": [
    "1 answer changed; score differences reflect those selections and the pinned question-bank version."
  ]
}
```

The comparison endpoint never exposes option scoring JSON, accepts only two different result IDs, and returns `404` if either result is not owned by the authenticated user.

## Recommendations

### `GET /api/recommendations`

Returns ranked career recommendations for the authenticated user or a specified result.

```json
{
  "recommendations": [
    {
      "careerId": "career_ai_engineer",
      "career": "AI Engineer",
      "score": 91,
      "reason": "Strong programming and analytical skills",
      "matchedSkills": ["Python", "Problem Solving"],
      "missingSkills": ["Deep Learning"],
      "evidence": {
        "assessmentScore": 91,
        "matchedSkillCount": 2,
        "missingSkillCount": 1,
        "confidence": "high",
        "tradeOffs": ["Build Deep Learning before this path will feel easier."]
      }
    }
  ]
}
```

The `evidence` object explains the ranking without exposing internal scoring weights. `assessmentScore` is the normalized score already returned as `score`; the counts summarize the existing matched and missing skill arrays. `confidence` is a calibrated heuristic label (`low`, `medium`, or `high`), and `tradeOffs` states the principal development cost or limitation visible from the current assessment and profile. These fields are informational and do not guarantee career fit.

## Skill gap and roadmap

### `GET /api/careers/:careerId/skill-gap`

Compares the user's known skills with the selected career's required skills.

```json
{
  "careerId": "career_ai_engineer",
  "skills": [
    {
      "name": "Python",
      "status": "matched",
      "level": "intermediate",
      "priority": "low",
      "prerequisites": [],
      "blockedBy": [],
      "transferableTo": [],
      "priorityReason": "Already present in your profile; maintain and apply it."
    },
    {
      "name": "Deep Learning",
      "status": "missing",
      "level": "beginner",
      "priority": "medium",
      "prerequisites": ["Python"],
      "blockedBy": ["Python"],
      "transferableTo": [],
      "priorityReason": "Build Python first."
    }
  ]
}
```

`status` remains limited to `matched` and `missing`. `priority` is deterministic: missing foundational prerequisites are `high`, other missing skills are `medium`, and matched skills are `low`. `prerequisites` and `blockedBy` are readable ontology skill names; `transferableTo` lists readable local relationships when present. `priorityReason` explains the ordering without estimating a learner’s time or guaranteeing an outcome.

### `GET /api/careers/:careerId/roadmap`

Returns an ordered learning plan.

```json
{
  "careerId": "career_ai_engineer",
  "steps": [
    {
      "id": "roadmap_step_1",
      "title": "Strengthen Python",
      "description": "Complete the agreed Python practice module.",
      "skill": "Python",
      "order": 1,
      "completed": false
    }
  ]
}
```

### `PATCH /api/roadmap/:stepId`

Updates completion state for a roadmap step.

## AI career advisor

### `POST /api/advisor/chat`

The server enriches the question with the authenticated user's profile, assessment result, selected career, skill gap, and roadmap before calling the AI provider when personalized-AI consent allows that context. Profile text, assessment data, catalog descriptions, roadmap text, and the user question are passed to the provider as untrusted data; instructions inside those values are not treated as system instructions. Catalog-derived source references are returned in `sources` when the selected career has them.

Request:

```json
{
  "message": "Should I learn machine learning or cybersecurity first?",
  "careerId": "career_ai_engineer",
  "conversationId": "conversation_123"
}
```

Response:

```json
{
  "conversationId": "conversation_123",
  "answer": "Based on your assessment and current skills, ...",
  "sources": ["local://catalog/career_ai_engineer"],
  "confidence": "medium",
  "caveat": "Confidence reflects the amount of approved context available, not the truth or outcome of the advice. Verify consequential decisions with authoritative sources and trusted people.",
  "createdAt": "2026-08-18T00:00:00.000Z"
}
```

The backend must protect provider credentials, apply input limits, handle provider failures, and avoid presenting unsupported claims as certain career advice. The response `confidence` is a deterministic context-coverage label (`low`, `medium`, or `high`), not a claim that the advice is true or that an outcome is likely. The `caveat` instructs the learner to verify consequential decisions with authoritative sources and trusted people. If the configured local provider is unavailable, returns an empty or malformed response, or exhausts its bounded retries, the endpoint returns a deterministic fallback that explains the limitation and still suggests a small next learning activity from the available skill-gap context. The fallback is general guidance, not a diagnosis, employment guarantee, or external labor-market claim. Consequential education, licensing, salary, employment, and other time-sensitive claims must be verified against an appropriate authoritative source; the local catalog references are not labor-market forecasts.

## VR support

### `GET /api/vr/environments`

Returns environments that the client can display in the career hub.

```json
{
  "environments": [
    {
      "key": "ai-engineer-lab",
      "careerId": "career_ai_engineer",
      "title": "AI Engineer Lab",
      "description": "Explore an AI engineering workspace.",
      "available": true
    }
  ]
}
```

The VR scene itself is owned by Member 1. The server supplies only safe environment metadata; the MVP does not persist VR visits or progress. A career may exist in the broader catalog without having a VR environment.

## Contract change procedure

When an endpoint must change, the member proposing the change updates this document, adds or updates the matching frontend type, explains the reason in the pull request, and confirms whether the change is backward-compatible. Both members review the change before implementation is merged.
