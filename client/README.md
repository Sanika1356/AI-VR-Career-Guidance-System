# Client Workspace

This workspace contains the React and TypeScript browser application owned primarily by Member 1.

## Ownership

Member 1 owns pages, reusable components, layouts, client-side services, shared client types, visual assets, charts, and the Three.js/React Three Fiber experience. Member 2 should avoid changing these files unless the change is required to keep the API integration working.

## Suggested feature areas

```text
src/features/authentication/
src/features/assessment/
src/features/recommendations/
src/features/career-details/
src/features/skill-gap/
src/features/roadmap/
src/features/advisor/
src/features/vr/
```

## Integration rule

Use the response shapes in `../docs/api.md`. Mock data is allowed during UI development, but mock objects must match the documented API types so that replacing a mock service with a real request does not require rewriting the interface.
