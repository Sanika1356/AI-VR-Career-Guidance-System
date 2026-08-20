# Frontend Phase 2 Resilience Evidence

**Date:** 20 August 2026

**Branch:** `feature/member1-phase2-resilience-batch`

**Environment:** Local frontend at `http://localhost:5173/`, local backend at `http://127.0.0.1:4000/api`, local PostgreSQL database, Chromium, and a synthetic test account.

**Scope:** Learning-flow resilience, authenticated responsive evidence, profile edge behavior, and documented limitations.

## Summary

The feasible Phase 2 checks were executed against the real local backend rather than mocks. The attached smoke run completed **23/23 assertions successfully**. It covered authentication, protected navigation, profile loading and persistence, empty optional profile values, invalid credentials, assessment retrieval and submission, recommendations, career details, skill-gap data, roadmap progress, missing roadmap steps, advisor responses, and the MVP VR catalog.

The authenticated viewport batch captured all four learning-flow routes at **375 px, 768 px, and 1440 px** widths. The committed images are available under [`docs/assets/frontend-phase2/`](assets/frontend-phase2/) and the overview contact sheet is [`docs/assets/frontend-phase2/contact-sheet.png`](assets/frontend-phase2/contact-sheet.png).

## Local backend smoke results

The smoke runner used a newly generated synthetic account and did not print or persist its bearer token. The database dependency reported `ok`, the API health status reported `ok`, and the configured local frontend origin was `http://localhost:5173`.

| Area | Checks exercised | Result |
|---|---|---|
| Health and database | `GET /api/health`; `GET /api/health/dependencies` | Passed; HTTP 200 and database status `ok` |
| Authentication | Synthetic registration; bearer token receipt; protected request | Passed; registration HTTP 201 and token received |
| Profile | Authenticated GET; PUT persistence; empty `interests` and `currentSkills`; invalid empty experience | Passed; valid update HTTP 200, persisted empty arrays, invalid payload HTTP 400 |
| Unauthorized and invalid-token behavior | Unauthenticated profile GET; invalid/expired bearer token; unauthenticated roadmap access | Passed; HTTP 401 responses |
| Assessment | Questions; submission; result retrieval | Passed; questions HTTP 200, submission HTTP 200, result HTTP 200 |
| Recommendations and career | Recommendations; AI Engineer details; unknown career | Passed; HTTP 200, HTTP 200, and expected HTTP 404 |
| Skill gap | AI Engineer skill-gap response and status contract | Passed; HTTP 200 and statuses limited to the approved `matched`/`missing` MVP values |
| Roadmap | Roadmap retrieval; valid step completion; missing-step completion | Passed; HTTP 200, HTTP 200, and expected HTTP 404 |
| Advisor | Authenticated advisor request and non-empty answer | Passed; HTTP 200 and response present |
| VR catalog | MVP environment catalog | Passed; HTTP 200 and both approved MVP environments present |

The smoke output is intentionally sanitized: it records status and boolean outcomes only, without credentials, tokens, or real user data.

## Explicit direct profile authorization check

In addition to the smoke runner, a direct unauthenticated request was sent to `PUT /api/profile` with a valid-shaped payload. The local backend returned **HTTP 401**, confirming that profile writes cannot be performed without a bearer token.

The invalid/expired-token smoke check likewise returned HTTP 401 for `GET /api/profile`. The client auth service handles this response by clearing the local session, emitting the session-expiry event, and redirecting to `/login?reason=session-expired&returnTo=...`. Client-side logout, protected navigation, refresh persistence, and missing-session redirect behavior were already verified in the preceding frontend batches.

## Authenticated responsive evidence

The capture set covers the assessment, profile, advisor, and AI Engineer roadmap routes. Each route was loaded with the authenticated synthetic session at the three agreed widths.

| Route | 375 px | 768 px | 1440 px |
|---|---|---|---|
| Assessment | [`assessment-375.png`](assets/frontend-phase2/assessment-375.png) | [`assessment-768.png`](assets/frontend-phase2/assessment-768.png) | [`assessment-1440.png`](assets/frontend-phase2/assessment-1440.png) |
| Profile | [`profile-375.png`](assets/frontend-phase2/profile-375.png) | [`profile-768.png`](assets/frontend-phase2/profile-768.png) | [`profile-1440.png`](assets/frontend-phase2/profile-1440.png) |
| Advisor | [`advisor-375.png`](assets/frontend-phase2/advisor-375.png) | [`advisor-768.png`](assets/frontend-phase2/advisor-768.png) | [`advisor-1440.png`](assets/frontend-phase2/advisor-1440.png) |
| Roadmap | [`roadmap-375.png`](assets/frontend-phase2/roadmap-375.png) | [`roadmap-768.png`](assets/frontend-phase2/roadmap-768.png) | [`roadmap-1440.png`](assets/frontend-phase2/roadmap-1440.png) |

The mobile review found vertical stacking without horizontal clipping. The profile account email truncates within its card as expected, while the career-profile form continues below the fold. The advisor notice and conversation content stack vertically, and the roadmap progress card and summary cards remain inside the mobile column. At 768 px, the profile uses the intended two-column account/profile composition and the navigation remains readable after the tablet wrapping fix. At 1440 px, the advisor content is centered with aligned notice, conversation, and message controls and no observed overflow.

## Assessment completion coverage

The authenticated assessment route was captured at narrow, tablet, and wide widths against the real local backend. The route loaded the real question state and presented the completion entry point at each viewport. The API smoke run separately completed an authenticated assessment submission and result retrieval. The capture set therefore confirms route rendering and real API connectivity at all three widths; a full answer-by-answer completion recording is not claimed beyond the successful API submission because the current evidence run did not retain a screen recording of every question interaction.

## Remaining Phase 2 limitations

The following items remain open because the sandbox does not provide a safe, controlled way to generate the required evidence. They are intentionally not marked complete in the frontend TODO.

| Pending check | Reason it remains open |
|---|---|
| Long career names, missing optional fields, and empty-array fixtures under controlled data | No safe fixture-injection harness is available without altering the approved production contract or database fixtures. Empty optional profile arrays themselves were verified in the smoke run. |
| Controlled HTTP 500 responses for skill-gap and roadmap routes | No controlled failure-injection endpoint or test harness is available. Unauthorized HTTP 401 behavior and missing-step HTTP 404 behavior were verified, but they do not substitute for a server-failure test. |
| Advisor long-message, repeated-submission, slow-network, and cross-page session-expiry cases | Basic validation, response rendering, refresh, and invalid-token redirect are covered; controlled browser/network evidence for these remaining cases was not captured. |

## External Phase 3–4 gates

Firefox, Safari/WebKit, and Edge are not available in the sandbox. Target-device VR performance and touch interaction require supported physical hardware. WebXR headset entry and exit require a compatible headset. These items remain open in the TODO and are not represented as completed by the Chromium screenshots or the existing desktop fallback baseline.

## Quality and release boundary

This evidence batch does not promote production, change deployment configuration, or create a release tag. The project’s production-promotion gate remains subject to the user’s explicit statement: **“I explicitly approve production promotion.”**
