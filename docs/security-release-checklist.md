# Security and Release Checklist

**Project:** AI-VR Career Guidance System
**Scope:** Phase 1 trust, security, privacy, and reliability controls
**Owner:** Project owner across the frontend/VR and backend/AI workstreams

This checklist is the release companion for the custom bearer-authenticated MVP. It separates controls enforced by code from checks that require deployment or operational evidence. It must be reviewed before production promotion, and it must never be used to claim that a physical device, hosted database, or backup rehearsal was tested when it was not.

## Controls enforced by code

| Area | Current control | Evidence |
|---|---|---|
| Authentication abuse | Registration and login share an in-memory per-IP limiter. Repeated failed attempts receive HTTP 429 and `Retry-After`. | `server/src/routes/auth.routes.ts`, `server/src/middleware/rate-limit.ts` |
| Advisor abuse | Advisor requests require authentication, have a labelled AI limiter, and validate messages to 3–2,000 characters. | `server/src/routes/advisor.routes.ts`, `server/src/validators/advisor.ts` |
| Catalog scraping | Public career list/detail requests have a labelled per-IP catalog limiter. | `server/src/routes/career.routes.ts` |
| Payload abuse | Express JSON parsing uses `REQUEST_BODY_LIMIT_BYTES`; malformed JSON and oversized bodies return safe 400/413 envelopes. | `server/src/app.ts`, `server/src/middleware/error-handler.ts` |
| Secret handling | Server secrets are read from server-only environment variables. Browser `VITE_*` examples contain only public configuration. | `.env.example` files, `.gitignore`, CI secret scan |
| Feature containment | AI advisor can be disabled with `AI_ADVISOR_ENABLED`; external career data and unfinished WebXR default to disabled. | `server/src/config/env.ts`, `server/src/middleware/feature-flag.ts`, `client/src/config/features.ts` |
| Privacy | Optional collection is opt-in, advisor personalization is consent-gated, exports use allowlisted fields, and deletion uses database cascades. | Privacy API, migration `005_privacy_controls.sql`, privacy tests |
| Auditability | Audit events store request IDs and small primitive metadata only. Passwords, tokens, raw prompts, raw answers, and full profile text are excluded. | Migration `006_audit_events.sql`, `server/src/services/audit.service.ts` |
| Observability | Request IDs, safe structured request logs, aggregate API/AI metrics, labelled rate-limit counts, and one-per-window threshold alerts are enabled. | `server/src/utils/metrics.ts`, middleware tests |

## Release review gates

Before each production release, verify that `AUTH_SECRET`, `DATABASE_URL`, `CORS_ORIGIN`, and the frontend API base URL are set to the intended environment and are not present in committed files or browser bundles. Confirm that `RUN_SEED_DATA=false` is used unless demo seed data is explicitly approved, and confirm that rate limits and request-body limits are appropriate for the hosting topology. If the service runs behind a proxy, verify that IP-based throttling uses the correct proxy configuration before relying on it for abuse prevention.

Run the client quality gate, server typecheck/build/tests, migration checks, the authenticated PostgreSQL-backed API integration suite against a disposable database, dependency audit, and secret scan in CI. Review the generated request and audit signals for absence of credentials and private message content. Confirm that any feature flag is set consistently across the client and server and that disabled experimental features fail safely or remain hidden while the stable desktop fallback remains available. The repository workflow is `.github/workflows/quality.yml`; it applies all migrations to PostgreSQL 16 and runs the integration contract with deterministic AI providers disabled.

## Operational items still requiring evidence

The repository now provides a guarded non-production backup and restore rehearsal in [`docs/backup-restore-rehearsal.md`](backup-restore-rehearsal.md), implemented by `server/scripts/backup-restore-rehearsal.sh`. Hosted or production backup verification, provider-specific restore evidence, and any recurring operational schedule remain pending until a safe database-access procedure, isolated restore target, restricted backup identity, retention policy, alerting, and named owner are approved. Production credentials must not be pasted into the repository or this document. Physical touch, target-device, and headset validation remain separate hardware-gated items and are not covered by this checklist.
