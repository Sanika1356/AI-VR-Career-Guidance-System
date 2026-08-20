# Frontend Phase 3 Compatibility and Device-Gate Evidence

**Date:** 20 August 2026

**Branch:** `feature/member1-phase3-compatibility-gates`

**Owner:** Member 1 — frontend and VR client

## Purpose and evidence boundary

This record closes the evidence-gathering work that is possible in the current sandbox and preserves the checks that require unavailable browser engines or physical devices. It does not claim cross-browser, touch-device, target-hardware, or WebXR coverage based on Chromium-only observations.

The authenticated responsive evidence for the learning-flow routes is recorded separately in [`frontend-phase2-resilience.md`](frontend-phase2-resilience.md). The earlier Chromium accessibility, contrast, and desktop VR-fallback baseline is recorded in [`frontend-quality-audit.md`](frontend-quality-audit.md) [1].

## Environment probe

The sandbox exposes Chromium and a display session. The following alternate browser executables were not available: Firefox, Firefox ESR, Microsoft Edge, Microsoft Edge Stable, and Google Chrome. The sandbox also does not expose `/dev/input` or an attached touch device. No target VR hardware or compatible WebXR headset is attached.

| Capability | Current evidence | Status |
|---|---|---|
| Chromium | Installed and used for the authenticated route captures and desktop VR fallback baseline | Available; covered by existing evidence |
| Firefox | Executable unavailable | Pending external browser/device access |
| Safari/WebKit | No Safari/WebKit runtime is available in the Linux sandbox | Pending external browser/device access |
| Microsoft Edge | Executable unavailable | Pending external browser/device access |
| Desktop VR fallback | Existing Chromium sample measured 59.7 FPS over a two-second requestAnimationFrame window | Local baseline only; not target-device validation [1] |
| Touch interaction | No supported touch device or input-device interface is attached | Pending supported touch device |
| WebXR headset | No compatible headset is attached | Pending compatible WebXR hardware |

## Completed baseline evidence

The existing quality audit recorded successful Chromium checks for the frontend landmarks, form semantics, keyboard focus, representative contrast, and desktop VR fallback behavior [1]. It also explicitly identifies the limitation that a local Chromium sample is not a substitute for cross-browser, low-powered-device, touch-device, or headset testing. The Phase 2 authenticated capture batch adds route-level evidence at 375 px, 768 px, and 1440 px for assessment, profile, advisor, and roadmap [2].

These artifacts establish a useful local baseline without overstating device compatibility. They do not justify removing the remaining Phase 3 or Phase 4 TODO entries.

## Compatibility and performance tasks that remain open

| Checklist item | Why it remains open | Required evidence to close it |
|---|---|---|
| Firefox, Safari/WebKit, and Edge compatibility | The corresponding engines are unavailable in this environment | Run the authenticated route smoke and visual checks in each supported engine, recording route outcomes and any engine-specific findings |
| Desktop VR fallback performance on target hardware | The current 59.7 FPS result is from sandbox Chromium rather than a supported target device | Capture frame timing and interaction behavior on the intended target hardware under the agreed performance threshold |
| Touch interaction on the desktop VR fallback | No touch-capable device is attached | Exercise environment selection, canvas interaction, focus/keyboard alternatives, and navigation on a supported touch device |
| WebXR headset entry and exit | No headset or WebXR runtime is attached | Enter a real immersive session, verify the scene and controls, exit cleanly, and record the device/browser combination |

## TODO disposition

No Phase 3 or Phase 4 checklist item was removed. The evidence is sufficient to document the blockers and preserve the existing Chromium baseline, but it is not sufficient to mark unavailable-browser, target-device, touch, or headset checks complete. The frontend TODO therefore continues to contain only tasks that lack their required evidence.

## References

[1]: frontend-quality-audit.md "Frontend Quality Audit"

[2]: frontend-phase2-resilience.md "Frontend Phase 2 Resilience Evidence"
