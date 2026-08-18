# System Architecture

## 1. Purpose

The system is divided into a browser client and an API server. The client owns presentation, interaction, charts, and the 3D/VR experience. The server owns authentication, persistence, assessment processing, recommendation logic, skill-gap calculation, roadmap generation, and AI access.

```text
Student browser
      │
      │ HTTPS/JSON
      ▼
React + TypeScript client
      │
      │ REST API
      ▼
Node.js + Express server
      │
      ├── PostgreSQL database
      ├── Recommendation services
      ├── Skill-gap and roadmap services
      └── AI advisor provider
```

## 2. Ownership boundaries

| Boundary | Member 1 | Member 2 |
|---|---|---|
| User interface | Owns all pages, components, navigation, form states, loading states, and responsive behavior | Reviews API assumptions and verifies error states are supported |
| 3D/VR | Owns the career hub, career environments, controls, scene loading, and WebXR fallback | Provides career metadata and progress data through documented endpoints |
| API | Consumes documented endpoints and reports missing fields or usability issues | Designs, implements, validates, tests, and documents endpoints |
| Database | Requests required fields through the API contract | Owns schema, migrations, seed data, constraints, and backups for development |
| AI | Owns chat layout and user interaction | Owns prompt orchestration, profile context, safety rules, rate limits, and provider integration |
| Quality | Performs UI, accessibility, browser, and VR checks | Performs API, database, security, AI, and deployment checks |

## 3. Main modules

### Client modules

The client should contain pages for the landing experience, authentication, profile, assessment, recommendations, career details, skill gap, roadmap, AI advisor, and VR career hub. Reusable UI belongs in `client/src/components/`; feature-specific code belongs under `client/src/features/`; API clients belong in `client/src/services/`; and shared TypeScript contracts belong in `client/src/types/`.

### Server modules

The server should expose versioned routes under `/api`. Routes should remain thin and delegate business rules to services. Controllers should translate validated HTTP input into service calls. Database access belongs in `server/src/db/` and data models belong in `server/src/models/`. Authentication and authorization belong in middleware. External AI calls must remain server-side.

## 4. Development milestones

| Milestone | Client outcome | Server outcome | Integration check |
|---|---|---|---|
| Foundation | App shell and navigation | Health endpoint and database connection | Client and server run locally |
| Authentication | Register/login/profile screens | Auth and profile APIs | Protected dashboard works |
| Assessment | Question flow and submission UI | Questions, answers, submission, and result APIs | One assessment completes end to end |
| Recommendations | Ranked career cards | Scoring and recommendation services | Scores render from real data |
| Skill gap and roadmap | Skill-gap and roadmap pages | Gap calculation and roadmap APIs | Selected career produces actionable results |
| AI advisor | Chat experience | Context-aware AI service | User receives a profile-aware answer |
| VR | Desktop 3D hub and environments | Career/progress data support | VR entry is connected to a career |
| Release | Responsive, accessible, polished UI | Tested, secured, deployable API | Clean-user full-system demo passes |

## 5. Integration rules

The API contract in `docs/api.md` is the shared source of truth. A response field should not be renamed or removed without a documented change and a pull request. New fields should be backward-compatible where possible. Every endpoint must define success, validation failure, unauthorized, not-found, and server-error behavior where applicable.

The client must not access the database directly. The client must not contain database credentials, AI provider keys, or server-only secrets. The server must validate every request even when the client already performs validation.

## 6. Branch and pull-request rules

Use short-lived branches such as `feature/member1-assessment-ui` or `feature/member2-assessment-api`. Keep commits focused and use descriptive messages. Before opening a pull request, update the branch from `main`, run the relevant checks, update documentation, and explain how the change was tested. The other member reviews the pull request before merging.

## 7. Shared definition of done

A feature is complete only when its UI or API implementation, validation, loading/error states, tests, documentation, and integration behavior are finished. A feature that works only with mock data is considered a frontend development milestone, not a final feature.
