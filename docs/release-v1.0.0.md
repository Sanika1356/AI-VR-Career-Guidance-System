# Release v1.0.0

**Release date:** 24 August 2026

**Release commit:** `b7e37aede9a4cb0c3297744300ca35411221fabe`

**Tag:** `v1.0.0`

## Approval and scope

The user explicitly approved production promotion with the statement: “I explicitly approve production promotion.” The release candidate is the latest integrated `origin/main` commit at the time of approval. The release includes the completed backend implementation, frontend learning-flow resilience work, responsive evidence, and the documented external validation boundary.

## Validation

The frontend quality gate passed formatting, TypeScript, and the production build. The backend typecheck and production build passed. The backend test suite reported 51 passing tests, 1 skipped test, and 0 failures.

The deployed Render API returned HTTP 200 from both `/api/health` and `/api/health/dependencies`, with the database dependency reported as `ok`.

## Known validation boundary

The repository intentionally retains frontend validation items that require environments unavailable in the sandbox: Firefox/Safari/WebKit/Edge compatibility, target-device VR fallback performance, touch-device interaction, and WebXR headset entry/exit. These are not represented as completed by Chromium or desktop fallback evidence.

No secrets, credentials, connection strings, or provider API keys are included in this release record.
