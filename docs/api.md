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

## Health

### `GET /api/health`

Returns the server status and can be used by both members to verify local connectivity.

```json
{
  "status": "ok",
  "service": "career-guidance-api"
}
```

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

### `GET /api/careers`

Returns available career paths.

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

### `GET /api/careers/:careerId`

Returns full information for one career, including required skills, recommended learning resources, and the VR environment key when available.

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
        {"id": "option_a", "label": "Building software"},
        {"id": "option_b", "label": "Analyzing data"}
      ]
    }
  ]
}
```

### `POST /api/assessment/submit`

Request:

```json
{
  "assessmentId": "assessment_123",
  "answers": [
    {"questionId": "question_1", "optionId": "option_a"}
  ]
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

Returns the detailed assessment result and category scores.

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
      "missingSkills": ["Deep Learning"]
    }
  ]
}
```

## Skill gap and roadmap

### `GET /api/careers/:careerId/skill-gap`

Compares the user's known skills with the selected career's required skills.

```json
{
  "careerId": "career_ai_engineer",
  "skills": [
    {"name": "Python", "status": "matched", "level": "intermediate"},
    {"name": "Deep Learning", "status": "missing", "level": "beginner"}
  ]
}
```

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

The server enriches the question with the authenticated user's profile, assessment result, selected career, and skill gap before calling the AI provider.

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
  "sources": [],
  "createdAt": "2026-08-18T00:00:00.000Z"
}
```

The backend must protect provider credentials, apply input limits, handle provider failures, and avoid presenting unsupported claims as certain career advice.

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
