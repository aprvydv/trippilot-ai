# Deployment and configuration

## Runtime

TripPilot is a React + TypeScript app hosted as a Vinext Cloudflare Worker. The retained Sites build plugin emits the Worker and copies migrations. The hosting manifest declares `d1: "DB"`; there is no static-only declaration. Sites provisions D1 and applies pending schema migrations before the Worker is deployed. Never run schema DDL from an API request.

The current Site remains owner-private. Sites dispatch handles sign-in and supplies `oai-authenticated-user-id`. API code uses that stable identifier to scope every SQL read/write. Directly exposing this Worker without trusted dispatch requires replacing this identity integration; client-supplied headers are not an authentication system.

## Local development

```sh
npm ci
npm run db:generate  # only after changing db/schema.ts
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_lowly_grandmaster.sql
npm run dev
```

Use the actual filename in `drizzle/`. Apply pending local migrations once, in order; never replay applied migrations. Local and hosted D1 databases are separate. Portable local previews use the starter's mock sign-in; hosted requests use Sites identity. Tests provide identity to the isolated handler, not to a public production endpoint.

## AI configuration

| Server value | Purpose | Default |
| --- | --- | --- |
| `AI_ENABLED` | Enables provider requests only when exactly `true` | Disabled |
| `AI_MODEL` | Structured-output-capable OpenAI model | `gpt-4o-mini` |
| `OPENAI_API_KEY` | Provider secret, server-only | Unset |

Configure hosted values with Sites runtime environment tools. For OpenAI key creation/activation, enable OpenAI Developers and follow its API-key skill and approval flow. No key is included in this repository, build or client bundle. Missing configuration activates the deterministic demo fallback. Local values belong in ignored runtime files; `.env.example` documents names only.

The adapter calls the fixed OpenAI Chat Completions endpoint with strict structured output, catalog ID enums and a 12-second timeout. It validates the returned day count and all activity IDs independently. Provider failure, timeout, refusal, invalid JSON or unsupported activities selects the demo plan. Costs are always computed by the server. No provider credentials, raw errors or provider response content are returned to the browser.

Destination grounding uses `server/catalog.ts`, version `2026-10-09-v1`, built from the project's curated suggestions. It does not claim live availability, sourced prices, or externally verified travel data. AI rearranges allowed activities; it does not browse or book.

## Publication and CI

```sh
npm run typecheck
npm test
npm run build
```

GitHub Actions runs the same checks. Deployment is a separate Sites workflow: obtain the existing project's source credential, sync/push source with the Sites helper, package the verified Worker output, then save/deploy that commit. Preserve the existing project ID and access policy. Do not commit credentials, `.wrangler`, `.sites-runtime`, `.env`, `.dev.vars` or generated `dist/` output.

Inspect `/api/health` after publication. It reports binding and AI configuration without exposing keys. A configured binding is not a full database read/write check; the API integration tests exercise actual SQL against the migration in SQLite.
