# TripPilot AI

A React + TypeScript travel-planning portfolio project. Create curated demo itineraries with illustrative group budgets, save a trip in your browser, and export it as JSON.

## Run locally

Requires Node.js 22.12+ (Node 22 LTS is used in CI).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. No API key is required.

## Validation and production build

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

GitHub Actions runs type checking, tests and a production build on pushes to `main` and pull requests. Deployment is separate from CI. Vite emits static assets to `dist/`; source files, not generated bundles, are committed.

## Implemented

- Responsive React interface with the original forest-green, sage and ivory dark theme.
- Reusable trip form, itinerary and day-card components.
- TypeScript models for trip inputs, budget estimates and day-by-day itineraries.
- Runtime validation for user input and restored trip data.
- Jaipur, Goa and Manali suggestions for 1–7 days and 1–10 travellers.
- Over-budget warnings, browser-local save/restore, and downloadable JSON.
- Planner and UI tests covering form submission, storage failures, corrupt saved data, backwards compatibility, and downloads.

## Source map

| File | Responsibility |
| --- | --- |
| `src/types.ts` | Trip input, destination, style and itinerary types |
| `src/planner.ts` | Curated data, validation, budget calculations |
| `src/components/TripForm.tsx` | Controlled, labelled trip form |
| `src/components/Itinerary.tsx` | Budget summary and day cards |
| `src/storage.ts` | Save/restore and JSON download |
| `src/App.tsx` | Form, generated trip and feedback state |
| `tests/` | Vitest + Testing Library tests |
| `.github/workflows/ci.yml` | Automated checks and build |

Form state and generated trip are separate: editing a field does not change the displayed trip until submission. Save and export use the displayed trip. Restoration recalculates costs from validated inputs, so stored derived values are not trusted. Trips saved by the original JavaScript version remain compatible.

## Current limits

This is a deterministic prototype, not an AI-powered service yet. Costs are illustrative, not live prices. They exclude travel to the destination, admission tickets and paid activities. Suggestions are not verified for current opening hours, availability or weather. Days after day 3 revisit the curated suggestions. Saved trips are local to one browser. There is no account, backend API, SQL database or booking integration yet. Tests use a simulated DOM; real-browser visual verification is separate.

## Next milestones

1. Add a validated REST API and SQL trip storage.
2. Add an AI provider behind a server-side adapter, with grounded destination data and a demo fallback.
3. Add API integration tests and documented deployment configuration.

AI coding assistance was used during implementation. This does not imply the deployed planner uses AI to generate itineraries.
