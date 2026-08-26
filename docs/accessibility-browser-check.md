# Accessibility Browser Check

**Verification date:** 2026-08-26  
**Target:** Local Pathfinder client at `http://localhost:5173/`

The initial page exposes a visible-on-focus `Skip to main content` link before the header navigation. After a keyboard `Tab`, the skip link received focus and displayed its focus treatment. Activating it changed the fragment to `#main-content` and moved focus to the `<main id="main-content" tabindex="-1">` landmark. The route-focus implementation was made StrictMode-safe so initial page load does not steal focus from the skip link.

This is targeted browser evidence only. It does not replace full keyboard, screen-reader, contrast, reduced-motion, mobile, or assistive-technology validation.
