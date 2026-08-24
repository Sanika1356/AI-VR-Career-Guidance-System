# Frontend TODO — Remaining Tasks Only

**Owner:** Member 1 — frontend, interaction design, accessibility, and VR.

Completed MVP implementation, responsive evidence, resilience checks, browser compatibility checks, and release work have been removed from this active checklist. Future product features are tracked in the repository-root [`TODO.md`](../../TODO.md).

> **Current boundary:** Chromium, Firefox, WebKit, and Microsoft Edge authenticated route smoke checks are documented. The remaining items require physical hardware that is not available in the current sandbox.

## Phase 3 — Physical device and performance validation

- [ ] Measure desktop VR fallback performance on supported target hardware. Record browser, operating system, device/GPU, frame timing, FPS, and obvious bottlenecks. The existing software-rendered sandbox measurement is only a baseline.
- [ ] Test desktop VR fallback interaction on a supported touchscreen device. Exercise environment selection, canvas press/drag, navigation actions, focus behavior, keyboard alternatives, and recovery from interrupted gestures. Record device, operating system, browser, viewport, and failures.

## Phase 4 — Real WebXR validation

- [ ] Implement and validate WebXR headset entry and exit only after the application has an approved WebXR session design and a compatible headset is available. Record browser/device, permission result, immersive-session entry, controls, exit cleanup, and fallback behavior. Do not claim completion from desktop canvas or emulation alone.

## Coordination

Before implementing a future feature from the unified roadmap, agree on the API and data contract with Member 2, add acceptance evidence, and create a dedicated `feature/member1-*` branch. Do not add client-only fields, statuses, or endpoints.
