# AI + VR Career Guidance System

This repository contains the AI + VR Career Guidance System. The project helps students complete an assessment, discover suitable career paths, understand their skill gaps, follow a learning roadmap, ask an AI career advisor questions, and explore careers through an interactive 3D/VR experience.

## Team ownership

| Owner | Primary responsibility | Main location |
|---|---|---|
| Member 1 | Frontend, user experience, charts, and 3D/VR | `client/` and `team/member-1-frontend-vr/` |
| Member 2 | Backend, database, authentication, recommendation logic, and AI | `server/` and `team/member-2-backend-ai-database/` |
| Both members | API decisions, code review, testing, documentation, and final integration | `docs/`, pull requests, and integration sessions |

## Repository layout

```text
.
├── client/                         # React/TypeScript frontend owned by Member 1
├── server/                         # Node/Express/TypeScript backend owned by Member 2
├── docs/                           # Shared architecture, API, database, and testing documents
├── team/
│   ├── member-1-frontend-vr/       # Member 1 plan and ownership notes
│   └── member-2-backend-ai-database/# Member 2 plan and ownership notes
├── .github/                        # GitHub issue and pull-request templates
├── .env.example                    # Variable names only; never add real secrets
└── README.md
```

## Recommended workflow

1. Both members read the shared documents in `docs/`.
2. Each member works on a separate feature branch and owns the files assigned in their team folder.
3. Member 1 may use mock data while Member 2 builds the real APIs.
4. Every endpoint change is recorded in `docs/api.md` before the frontend is connected.
5. Work is merged into `main` through a pull request and a review by the other member.
6. The team integrates early after authentication, assessment, recommendations, AI, and VR milestones.

## Planned user journey

```text
Register → Login → Profile → Assessment → Recommendations
→ Career Details → Skill Gap → Learning Roadmap
→ AI Career Advisor → 3D/VR Career Environment
```

## Documentation index

- [Architecture](docs/architecture.md)
- [API contract](docs/api.md)
- [Member 1 todo](team/member-1-frontend-vr/todo.md)
- [Member 2 todo](team/member-2-backend-ai-database/todo.md)

## Local environment

Copy `.env.example` into a local `.env` file for the part of the project you are running. Do not commit `.env` or any real credentials. The exact commands for installing dependencies and starting the client and server will be added when the application scaffolding is implemented.

## Definition of done

The project is complete when a new student can register, log in, complete the assessment, receive ranked career recommendations, inspect the required skills for a selected career, view a personalized learning roadmap, ask the AI advisor a question, and enter the working desktop 3D/VR career experience. The complete flow must be tested with a clean database and documented setup instructions.
