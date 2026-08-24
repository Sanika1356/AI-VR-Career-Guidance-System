# Frontend Phase 3 Compatibility and Device-Gate Evidence

**Date:** 20 August 2026

**Branch:** `feature/member1-phase3-compatibility-gates`

**Owner:** Member 1 — frontend and VR client

## Purpose and evidence boundary

This record documents the Chromium baseline, the Firefox/WebKit/Microsoft Edge authenticated route smoke checks, and the checks that still require physical devices. It does not claim target-hardware, touch-device, or WebXR coverage based on software emulation alone.

The authenticated responsive evidence for the learning-flow routes is recorded separately in [`frontend-phase2-resilience.md`](frontend-phase2-resilience.md). The earlier Chromium accessibility, contrast, and desktop VR-fallback baseline is recorded in [`frontend-quality-audit.md`](frontend-quality-audit.md) [1].

## Environment probe

The sandbox exposes Chromium and a display session. Temporary Playwright Firefox and WebKit engines and the official Microsoft Edge Linux package were used outside the repository for compatibility smoke checks. The sandbox does not expose a supported touch device or target VR/WebXR hardware.

| Capability | Current evidence | Status |
|---|---|---|
| Chromium | Installed and used for the authenticated route captures and desktop VR fallback baseline | Available; covered by existing evidence |
| Firefox | Authenticated `/profile`, `/assessment`, `/advisor`, skill-gap, and roadmap routes returned HTTP 200; protected header remained visible; no console or page errors | Authenticated route smoke passed |
| Safari/WebKit | Authenticated `/profile`, `/assessment`, `/advisor`, skill-gap, and roadmap routes returned HTTP 200; protected header remained visible; no console or page errors | WebKit authenticated route smoke passed |
| Microsoft Edge | Authenticated `/profile`, `/assessment`, `/advisor`, skill-gap, and roadmap routes returned HTTP 200; protected header remained visible; no console or page errors | Authenticated route smoke passed |
| Desktop VR fallback | Existing Chromium sample measured 59.7 FPS over a two-second requestAnimationFrame window | Local baseline only; not target-device validation [1] |
| Touch interaction | No supported touch device or input-device interface is attached | Pending supported touch device |
| WebXR headset | No compatible headset is attached | Pending compatible WebXR hardware |

## Completed baseline evidence

The existing quality audit recorded successful Chromium checks for the frontend landmarks, form semantics, keyboard focus, representative contrast, and desktop VR fallback behavior [1]. It also explicitly identifies the limitation that a local Chromium sample is not a substitute for cross-browser, low-powered-device, touch-device, or headset testing. The Phase 2 authenticated capture batch adds route-level evidence at 375 px, 768 px, and 1440 px for assessment, profile, advisor, and roadmap [2].

These artifacts establish a useful local baseline without overstating device compatibility. They do not justify removing the remaining Phase 3 or Phase 4 TODO entries.

## Compatibility and performance tasks that remain open

The authenticated route smoke passed in Firefox 141.0, WebKit 26.0, and Microsoft Edge 151.0. Each engine loaded `/profile`, `/assessment`, `/advisor`, `/careers/career_ai_engineer/skill-gap`, and `/careers/career_ai_engineer/roadmap` with HTTP 200 responses, retained the protected signed-in header, and produced no console or page errors. The browser compatibility checklist is therefore closed.

| Checklist item | Why it remains open | Required evidence to close it |
|---|---|---|
| Desktop VR fallback performance on target hardware | The current 59.7 FPS result is from sandbox Chromium rather than a supported target device | Capture frame timing and interaction behavior on the intended target hardware under the agreed performance threshold |
| Touch interaction on the desktop VR fallback | No touch-capable device is attached | Exercise environment selection, canvas interaction, focus/keyboard alternatives, and navigation on a supported touch device |
| WebXR headset entry and exit | No headset or WebXR runtime is attached | Enter a real immersive session, verify the scene and controls, exit cleanly, and record the device/browser combination |

## TODO disposition

The Firefox, WebKit, and Microsoft Edge authenticated route results close the browser compatibility task. Target-device, touch, and headset items remain open because no physical hardware is attached. The frontend TODO continues to contain only tasks that lack their required evidence.

## References

[1]: frontend-quality-audit.md "Frontend Quality Audit"

[2]: frontend-phase2-resilience.md "Frontend Phase 2 Resilience Evidence"
