# REST API

All responses are JSON and use `Cache-Control: no-store`. Except health, endpoints require a trusted Sites user identity. JSON writes are limited to 8 KiB. Cross-origin POST/DELETE requests are rejected. SQL statements use bound parameters.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/health` | Runtime configuration status |
| POST | `/api/plan` | Validate inputs and generate a grounded AI or demo itinerary; store a private draft |
| POST | `/api/trips` | Save a generated draft by `planId`, or generate/save validated inputs |
| GET | `/api/trips` | Up to 50 saved trips for the current user, newest first |
| GET | `/api/trips/:id` | One owned trip; 404 for other users' records |
| DELETE | `/api/trips/:id` | Delete an owned trip; 404 if missing or not owned |

## Input

```json
{"destination":"Jaipur","days":3,"travellers":2,"budget":18000,"style":"balanced"}
```

Destinations: Jaipur, Goa, Manali, Rishikesh, Udaipur, Pondicherry. Days: integer 1–7. Travellers: integer 1–10. Budget: finite number 1000–1000000 rupees for the group. Styles: balanced, culture, nature, slow, food. Derived costs, itinerary content, provenance and owner IDs from the client are ignored.

`POST /api/plan` responds with `trip`, `generation` and `planId` when SQL storage is available. Generation contains `mode` (ai/demo), a reason, and catalog version. To save the exact displayed plan, send the same validated inputs plus its `planId` to `POST /api/trips`. The server marks that owned draft saved without calling the AI again. Repeated saves of the same ID do not create duplicates. Unsaved drafts older than 24 hours are pruned on that user's next generation request. Saved trips do not expire. When no draft ID exists (initial demo or imported legacy trip), the server computes the trip from inputs before saving it.

The browser's My saved trip button restores the latest SQL record. If no SQL trips exist, it can import a trip saved by the original browser-local version; save it to move it to SQL.

## Errors

| Status | Meaning |
| --- | --- |
| 400 | Invalid inputs, malformed JSON or plan ID |
| 401 | Missing authenticated identity |
| 403 | Cross-origin write |
| 404 | Unknown endpoint or missing/not-owned trip |
| 405 | Unsupported method |
| 413 | Body exceeds 8 KiB |
| 415 | Wrong content type |
| 500 | Sanitized unexpected server/database error |
| 503 | SQL binding unavailable |

AI outages return a valid 200 demo plan with `generation.reason: "provider_unavailable"`; they never masquerade as AI output.

## Integration tests

`tests/api.test.ts` calls the HTTP handler with real Request/Response objects and a real SQLite database initialized from committed migrations. A narrow D1 compatibility wrapper binds parameters to SQLite. Tests cover CRUD, owner isolation, draft saving, validation, request limits, database errors, grounded AI selections and fallback behavior. Provider responses are mocked; no paid API requests are made by tests. This is not a live-provider or real-browser test.

For an edited itinerary, `POST /api/trips` accepts `schedule`: one array of three curated activity names (morning, afternoon, evening) per trip day. The server validates destination membership and day count, recomputes costs and saves the supplied order without calling a provider. This result is marked `generation.edited=true`.
