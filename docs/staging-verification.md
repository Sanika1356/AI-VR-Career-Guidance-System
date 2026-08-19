# Staging Verification Record

**Verification date:** 2026-08-19

**Scope:** Render Free frontend/API deployment with Neon PostgreSQL, using a synthetic clean test account. No credentials, tokens, personal information, or private connection strings are recorded here.

## Deployed targets

| Component | Verified target | Result |
|---|---|---|
| Backend API | `https://ai-vr-career-guidance-system.onrender.com` | Healthy |
| Frontend static site | `https://ai-vr-career-guidance-system-40ti.onrender.com` | HTTP 200 and React application rendered |
| Database dependency | Neon PostgreSQL through the deployed API | Healthy through `/api/health/dependencies` |

The `40ti` hostname is the active Render Static Site URL verified during this staging run. The frontend’s API base URL was confirmed to target the backend under the `/api` namespace, and the backend CORS response matched the active frontend origin.

## Verified API and security behavior

The backend health endpoint returned HTTP 200. Dependency health returned HTTP 200 with PostgreSQL healthy. A protected request without a bearer token returned HTTP 401 with a sanitized response. CORS preflight from the active frontend origin succeeded and returned the matching allow-origin value. Security headers included the configured permissions policy.

## Verified clean-account API journey

A synthetic account completed registration and login. The journey then exercised profile persistence, assessment question retrieval, assessment submission, recommendation generation, career detail retrieval, skill-gap data, roadmap retrieval and persistence, advisor fallback guidance, and VR metadata retrieval. The API-only journey completed successfully without a paid AI provider; the advisor returned the deterministic fallback when a local provider was unavailable.

## Verified browser journey

The deployed frontend loaded its landing page, sign-in route, and registration route. A synthetic account registered and authenticated successfully. Profile fields were saved and remained visible after persistence. The Render SPA rewrite was added and direct `/assessment` navigation then returned the application instead of a static-site 404.

The authenticated browser flow completed the five-question assessment, displayed the result, and rendered ranked recommendations. The broader career catalog showed AI Engineer, Data Analyst, Cybersecurity Analyst, Product Designer, and UX Researcher. AI Engineer career details displayed skills, resources, roadmap preview, and the available AI Engineering Lab environment. The roadmap page displayed two ordered steps and progress controls. The advisor accepted a synthetic question, rendered deterministic educational guidance, and preserved its disclaimer. The VR page exposed exactly the approved MVP environments: `ai-engineer-lab` (AI Engineering Lab) and `data-insights-studio` (Data Insights Studio). Selecting Data Insights Studio updated the selected scene and query string.

## Remaining approval gate

Staging verification is complete. Production promotion, final release tagging, and any live configuration changes remain blocked until both members approve the end-to-end demonstration and the user explicitly approves the production deployment action.

## Known MVP limitations

Render Free may cold-start. Local Ollama is optional and hosted environments use the deterministic advisor fallback when it is unavailable. Rate limiting is process-local for the single-instance MVP. VR is a desktop-friendly simulated experience and does not persist visits or progress. Actual WebXR support depends on the user’s browser and device.
