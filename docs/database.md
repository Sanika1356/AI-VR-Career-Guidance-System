# Database Design Outline

This document is an initial shared outline. Member 2 owns the implementation, migrations, seed data, and database tests. Both members should review changes because database fields become API fields consumed by the client.

## Core entities

| Entity | Purpose | Important relationships |
|---|---|---|
| `users` | Login identity and account status | One user has one profile and many assessment results |
| `profiles` | Interests, skills, experience, and preferences | Belongs to one user |
| `skills` | Canonical skill names and levels | Related to careers and user profiles |
| `careers` | Career catalog and descriptions | Related to skills and VR environments |
| `career_skills` | Required skills for each career | Joins careers and skills |
| `assessment_questions` | Published assessment questions | Has many answer options |
| `assessment_options` | Allowed answers and internal scoring metadata | Belongs to a question |
| `assessment_results` | A user's completed assessment and category scores | Belongs to a user and assessment session |
| `assessment_answers` | Answers submitted for a result | Belongs to a result and question |
| `recommendations` | Ranked career results and explanations | Belongs to an assessment result and career |
| `roadmap_steps` | Ordered learning steps for a career | Belongs to a career |
| `roadmap_progress` | A user's completion state for roadmap steps | Belongs to a user and roadmap step |
| `conversations` | Optional AI advisor conversation metadata | Belongs to a user |
| `messages` | Optional AI advisor message history | Belongs to a conversation |
| `vr_environments` | Safe metadata for client-side 3D scenes | Related to a career |

## Design rules

- Use foreign keys and uniqueness constraints to protect relationships.
- Keep authentication credentials separate from profile data.
- Do not store raw passwords, provider keys, or unnecessary sensitive data.
- Store canonical skill names once and reference them from join tables.
- Use transactions for multi-step writes such as assessment submission.
- Add indexes for user IDs, career IDs, result IDs, and fields used for filtering.
- Use migrations for every schema change.
- Seed only non-sensitive demo data.
- Make development reset procedures explicit and impossible to trigger accidentally in production.

## Review checklist

- [ ] Every table has a primary key.
- [ ] Every required relationship has a foreign key.
- [ ] Unique fields have database-level uniqueness constraints.
- [ ] Invalid status values are prevented by validation or database constraints.
- [ ] Timestamps are stored consistently.
- [ ] User-owned data cannot be retrieved by another user.
- [ ] Assessment result ownership is checked in every result endpoint.
- [ ] Roadmap progress ownership is checked before updates.
- [ ] Database migrations run successfully on a clean database.
- [ ] Seed data supports the documented demonstration path.
