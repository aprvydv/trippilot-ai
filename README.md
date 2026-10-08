# TripPilot AI

A React + TypeScript travel planner with a validated REST API, private SQL trip storage, and a server-side AI adapter with an explicit demo fallback. The forest-green, sage and ivory dark interface is retained.

## Development

Node.js 22.13+ is required.

```sh
npm ci
npm run typecheck
npm test
npm run build
```

See [deployment configuration](docs/deployment.md) for local D1 migration, sign-in, server runtime and AI setup. See [API documentation](docs/api.md) for endpoints, validation and examples. GitHub Actions runs type checks, integration/UI tests and the production build on pushes and pull requests.

## Architecture

- `app/`: Vinext page, layout and HTTP route integration.
- `src/`: React components, typed planner inputs, dark styling, client API calls and legacy import.
- `server/api.ts`: Validated JSON REST API, request limits and owner authorization.
- `server/repository.ts`: Parameterized SQL persistence and private drafts.
- `server/ai.ts`: Fixed-endpoint OpenAI adapter, constrained structured output and demo fallback.
- `server/catalog.ts`: Versioned curated activity grounding.
- `db/schema.ts` and `drizzle/`: D1 schema and immutable generated migrations.
- `tests/`: Planner/UI tests and HTTP integration tests against real SQLite.

## Behavior

Generate a trip, save it to your account, restore your latest saved trip, or export JSON. SQL draft IDs ensure saving preserves the displayed itinerary without another provider request. Records are isolated by the trusted Sites user ID. Trips from the previous browser-local prototype can be imported when the account has no saved records.

## Current limits

Live AI requires server-side key activation and `AI_ENABLED=true`. Until configured, the deployed planner uses the deterministic demo fallback. The adapter is tested with mocked provider responses; no live-provider result is claimed. Grounding uses curated project data, not live web research. Costs remain illustrative and exclude travel to the destination, admission tickets and paid activities. Suggestions are not verified for opening hours, weather or availability. No booking integration is included. The current deployment is private; public sharing requires reviewing the trusted identity boundary and abuse controls.

AI coding assistance was used during implementation. Generated source is committed; credentials, runtime data and build output are ignored.
