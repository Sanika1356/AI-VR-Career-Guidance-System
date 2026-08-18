# Server Workspace

This workspace contains the Node.js, Express, TypeScript, and PostgreSQL API owned primarily by Member 2.

## Ownership

Member 2 owns routes, controllers, services, validators, database access, models, migrations, authentication, recommendation logic, skill-gap logic, roadmap logic, AI integration, tests, and deployment configuration. Member 1 should consume the documented API rather than accessing database tables directly.

## Suggested server flow

```text
Route → validation middleware → controller → service → database/provider → response
```

Routes should remain small. Business rules belong in services, request validation belongs in validators, and database operations belong in the database/model layer. External AI credentials must remain on the server and must never be sent to the client.

## Integration rule

Implement and test the endpoint shapes in `../docs/api.md`. If a response must change, update the contract and coordinate with Member 1 before merging.
