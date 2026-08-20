# Frontend Advisor Resilience Evidence

**Date:** 20 August 2026

**Branch:** `feature/member1-advisor-submit-guard`

**Scope:** Authenticated local browser checks against the real local backend, plus a client-side race-condition fix.

## Findings and fix

The advisor page accepted a synthetic question at exactly the approved 2,000-character limit. The rendered counter displayed `2000/2000`, the submit control remained available, and the request completed through the real local backend with a non-empty advisor response. The textarea returned to its idle state after completion.

A rapid two-click test initially exposed a client race: two immediate clicks occurred before React had applied the asynchronous `isSending` state update, resulting in two user messages. The page now uses a ref-backed sending lock in `AdvisorPage.tsx`. The lock is set synchronously before the request begins and cleared in `finally`, so the submission function itself rejects re-entrant calls. The retry action uses the same guarded function.

After the fix, the same rapid two-click test added exactly one user message and produced no visible error. The client quality gate also passed: Prettier reported all files formatted, TypeScript completed without errors, and the Vite production build succeeded.

| Check | Result | Evidence |
|---|---|---|
| Exactly 2,000-character question accepted | Passed | Live authenticated Chromium page showed `2000/2000`; real backend returned an advisor response |
| Real advisor response rendered | Passed | The submitted synthetic question and non-empty advisor answer appeared in the conversation |
| Rapid repeated submission | Passed after fix | Two immediate clicks added one user message rather than two; no alert was visible |
| Client quality gate | Passed | `pnpm --dir client check` completed formatting, typecheck, and production build |
| Slow-network behavior | Pending | Requires controlled browser/network throttling evidence |
| Cross-page session expiry during an advisor flow | Pending | Requires a controlled multi-page/session-expiry browser scenario |

## TODO disposition

The completed advisor limit and repeated-submission checks were removed from `team/member-1-frontend-vr/todo.md`. Slow-network behavior and cross-page session expiry remain listed because the current browser run did not provide controlled network throttling or a cross-page expiry scenario.
