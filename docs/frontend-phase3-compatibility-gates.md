# Frontend Phase 3 Compatibility and Device-Gate Evidence

**Date:** 20 August 2026

**Branch:** `feature/member1-phase3-compatibility-gates`

**Owner:** Member 1 — frontend and VR client

## Purpose and evidence boundary

This record documents the available Chromium baseline, the real Firefox and WebKit login-route smoke checks, and the checks that still require Microsoft Edge or physical devices. It does not claim target-hardware, touch-device, or WebXR coverage based on software emulation alone.

The authenticated responsive evidence for the learning-flow routes is recorded separately in [`frontend-phase2-resilience.md`](frontend-phase2-resilience.md). The earlier Chromium accessibility, contrast, and desktop VR-fallback baseline is recorded in [`frontend-quality-audit.md`](frontend-quality-audit.md) [1].

## Environment probe

The sandbox exposes Chromium and a display session. Temporary Playwright Firefox and WebKit engines were provisioned outside the repository for compatibility smoke checks. Microsoft Edge is not available. The sandbox also does not expose a supported touch device or target VR/WebXR hardware.

| Capability | Current evidence | Status |
|---|---|---|
| Chromium | Installed and used for the authenticated route captures and desktop VR fallback baseline | Available; covered by existing evidence |
| Firefox | Deployed `/login` route returned HTTP 200; title, email/password fields, sign-in/create-account controls rendered; no console or page errors | Login-route smoke passed; broader authenticated flow remains unverified |
| Safari/WebKit | Playwright WebKit deployed `/login` route returned HTTP 200; title, email/password fields, sign-in/create-account controls rendered; no console or page errors | WebKit login-route smoke passed; Safari-specific and broader authenticated flow remain unverified |
| Microsoft Edge | Executable unavailable | Pending Edge access |
| Desktop VR fallback | Existing Chromium sample measured 59.7 FPS over a two-second requestAnimationFrame window | Local baseline only; not target-device validation [1] |
| Touch interaction | No supported touch device or input-device interface is attached | Pending supported touch device |
| WebXR headset | No compatible headset is attached | Pending compatible WebXR hardware |

## Completed baseline evidence

The existing quality audit recorded successful Chromium checks for the frontend landmarks, form semantics, keyboard focus, representative contrast, and desktop VR fallback behavior [1]. It also explicitly identifies the limitation that a local Chromium sample is not a substitute for cross-browser, low-powered-device, touch-device, or headset testing. The Phase 2 authenticated capture batch adds route-level evidence at 375 px, 768 px, and 1440 px for assessment, profile, advisor, and roadmap [2].

These artifacts establish a useful local baseline without overstating device compatibility. They do not justify removing the remaining Phase 3 or Phase 4 TODO entries.

## Compatibility and performance tasks that remain open

The Firefox and WebKit login-route smoke checks passed in the temporary Playwright engines. The full checklist item remains open only for the Microsoft Edge check and a broader authenticated-flow run in each engine.

| Checklist item | Why it remains open | Required evidence to close it |
|---|---|---|
| Microsoft Edge compatibility and broader authenticated-flow coverage | Microsoft Edge is unavailable, and the current automated check covers the deployed login route rather than the complete authenticated learning flow | Run the authenticated route smoke and visual checks in Microsoft Edge and extend the route checks across the supported learning-flow pages |
| Desktop VR fallback performance on target hardware | The current 59.7 FPS result is from sandbox Chromium rather than a supported target device | Capture frame timing and interaction behavior on the intended target hardware under the agreed performance threshold |
| Touch interaction on the desktop VR fallback | No touch-capable device is attached | Exercise environment selection, canvas interaction, focus/keyboard alternatives, and navigation on a supported touch device |
| WebXR headset entry and exit | No headset or WebXR runtime is attached | Enter a real immersive session, verify the scene and controls, exit cleanly, and record the device/browser combination |

## TODO disposition

The Firefox and WebKit results narrow the browser gate, but the Microsoft Edge and broader authenticated-flow coverage requirement remains open. Target-device, touch, and headset items remain open because no physical hardware is attached. The frontend TODO continues to contain only tasks that lack their required evidence.

## References

[1]: frontend-quality-audit.md "Frontend Quality Audit"

[2]: frontend-phase2-resilience.md "Frontend Phase 2 Resilience Evidence"
