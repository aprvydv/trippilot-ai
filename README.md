# TripPilot AI

A travel-planning portfolio project. Day 1 delivers a responsive itinerary builder with three curated destinations, group budget estimates, browser-local saving, and JSON export.

## Run

Requires Python 3 for a local server, and Node.js 20+ for tests.

```sh
python3 -m http.server 8000 --directory dist
node --test tests/planner.test.cjs
```

Open http://localhost:8000. No dependencies or API keys are needed.

## What is implemented

- Jaipur, Goa and Manali demo itineraries for 1–7 days and 1–10 travellers.
- Travel-style choices and validation.
- Illustrative group estimates, with an explicit over-budget message.
- Local save/restore and downloadable structured itinerary JSON.
- Automated tests for planning, cost calculations and invalid input.

## Limits

This is a deterministic prototype, not an AI-powered service yet. Costs are illustrative, not researched prices. They exclude travel to the destination, admission tickets and paid activities. Suggestions are not verified for current opening hours, availability or weather. Days after day 3 revisit the curated suggestions. Saved trips are local to one browser; there is no account, REST API, database or booking integration.

## Next meaningful milestones

1. Port the interface to React + TypeScript and test its form interactions.
2. Add a validated REST API and SQL trip storage.
3. Add an AI provider behind a server-side adapter, with grounded destination data and a demo fallback.
4. Add integration tests, CI, and deployment documentation.

## Architecture

`planner.js` is a pure planning module; `app.js` handles browser interactions; `style.css` handles layout. The pure module runs in the browser and in Node tests. AI assistance was used to build this initial version. No production AI capability is claimed.
