# Frontend TODO — Remaining Tasks Only

**Owner:** Member 1 — frontend and VR client

Only tasks that still lack the required evidence are listed below.

> **Current validation boundary (2026-08-24):** `cd client && pnpm check` passes, including formatting, TypeScript, and production build checks. Chromium, Firefox, WebKit, and Microsoft Edge authenticated route smoke checks are recorded. Target hardware, touch input, and a compatible WebXR headset remain unavailable.

## Phase 3 — Browser, device, and performance quality

- [ ] Measure desktop VR fallback performance on supported target hardware.
- [ ] Test touch interaction for the desktop VR fallback on a supported touch device.

## Phase 4 — WebXR and headset validation

- [ ] Test entering and exiting a headset session with a compatible WebXR device. Desktop canvas fallback evidence cannot close this task, and no compatible headset is attached.
