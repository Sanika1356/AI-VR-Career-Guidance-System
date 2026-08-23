# Frontend TODO — Remaining Tasks Only

**Owner:** Member 1 — frontend and VR client

Only tasks that still lack the required evidence are listed below.

> **Current validation boundary (2026-08-23):** `cd client && pnpm check` passes, including formatting, TypeScript, and production build checks. The available sandbox provides Chromium only; Firefox, Safari/WebKit, Edge, touch/input devices, and a compatible WebXR headset are unavailable. These results confirm frontend tooling health but do not close the cross-browser, hardware, touch, WebXR, or release-approval tasks below.

## Phase 3 — Browser, device, and performance quality

- [ ] Run compatibility checks on Firefox, Safari/WebKit, and Edge.
- [ ] Measure desktop VR fallback performance on supported target hardware.
- [ ] Test touch interaction for the desktop VR fallback on a supported touch device.

## Phase 4 — WebXR and headset validation

- [ ] Test entering and exiting a headset session with a compatible WebXR device. Desktop canvas fallback evidence cannot close this task, and no compatible headset is attached.

## Phase 5 — Release and approval gates

- [ ] Obtain the user’s explicit approval before production promotion, then perform final release tagging. Approval must be stated explicitly and must never be inferred.
