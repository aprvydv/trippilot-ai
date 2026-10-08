// @vitest-environment node
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleApi as rawHandleApi } from '../server/api';
import type { SavedTrip } from '../server/repository';
import { defaultInput } from '../src/planner';
import { activities } from '../server/catalog';
type TestResponse = Omit<Response, 'json'> & { json(): Promise<SavedTrip & { trips: SavedTrip[]; planId: string }> };
async function handleApi(...args: Parameters<typeof rawHandleApi>): Promise<TestResponse> { return await rawHandleApi(...args) as unknown as TestResponse; }

// The HTTP handler runs against real SQLite using the same migration and parameterized SQL as D1.
let sqlite: DatabaseSync; let db: D1Database;
beforeEach(() => {
  sqlite = new DatabaseSync(':memory:');
  for (const file of readdirSync('drizzle').filter(name => name.endsWith('.sql')).sort()) sqlite.exec(readFileSync(`drizzle/${file}`, 'utf8'));
  const prepare = (sql: string, values: (string | number | null)[] = []) => ({
    bind: (...args: (string | number | null)[]) => prepare(sql, args),
    run: async () => ({ success: true, meta: { changes: Number(sqlite.prepare(sql).run(...values).changes) } }),
    first: async () => sqlite.prepare(sql).get(...values) || null,
    all: async () => ({ success: true, results: sqlite.prepare(sql).all(...values) }),
  });
  db = { prepare } as unknown as D1Database;
});
afterEach(() => { sqlite.close(); vi.restoreAllMocks(); });
function req(path: string, method = 'GET', body?: unknown, owner: string | null = 'alice', extra: Record<string, string> = {}) {
  return new Request(`https://trip.test/api${path}`, { method, headers: { ...(owner ? { 'oai-authenticated-user-id': owner } : {}), ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...extra }, body: body === undefined ? undefined : JSON.stringify(body) });
}

describe('REST API and SQL integration', () => {
  it('saves exactly the generated draft without another AI request', async () => {
    const fetcher = vi.fn();
    const generated = await (await handleApi(req('/plan', 'POST', defaultInput), { DB: db }, fetcher)).json();
    expect((await (await handleApi(req('/trips'), { DB: db })).json()).trips).toHaveLength(0);
    const saved = await (await handleApi(req('/trips', 'POST', { ...defaultInput, planId: generated.planId }), { DB: db }, fetcher)).json();
    expect(saved.trip).toEqual(generated.trip); expect(saved.id).toBe(generated.planId);
    expect((await (await handleApi(req('/trips'), { DB: db })).json()).trips).toHaveLength(1);
    expect(fetcher).not.toHaveBeenCalled();
    expect((await handleApi(req('/trips', 'POST', { ...defaultInput, planId: generated.planId }, 'bob'), { DB: db })).status).toBe(404);
  });
  it('creates, lists, reads and deletes a trip through HTTP requests', async () => {
    const created = await handleApi(req('/trips', 'POST', defaultInput), { DB: db });
    expect(created.status).toBe(201); const saved = await created.json();
    expect(saved.trip.estimate).toBe(13200); expect(saved.generation.mode).toBe('demo');
    const listed = await (await handleApi(req('/trips'), { DB: db })).json(); expect(listed.trips[0].id).toBe(saved.id);
    expect((await handleApi(req(`/trips/${saved.id}`), { DB: db })).status).toBe(200);
    expect((await handleApi(req(`/trips/${saved.id}`, 'DELETE'), { DB: db })).status).toBe(200);
    expect((await handleApi(req(`/trips/${saved.id}`), { DB: db })).status).toBe(404);
  });
  it('isolates owners for list, get and delete', async () => {
    const saved = await (await handleApi(req('/trips', 'POST', defaultInput), { DB: db })).json();
    expect((await (await handleApi(req('/trips', 'GET', undefined, 'bob'), { DB: db })).json()).trips).toHaveLength(0);
    for (const method of ['GET', 'DELETE']) expect((await handleApi(req(`/trips/${saved.id}`, method, undefined, 'bob'), { DB: db })).status).toBe(404);
    expect((await handleApi(req(`/trips/${saved.id}`), { DB: db })).status).toBe(200);
  });
  it('rejects unauthenticated requests and cross-origin writes', async () => {
    expect((await handleApi(req('/trips', 'GET', undefined, null), { DB: db })).status).toBe(401);
    expect((await handleApi(req('/trips', 'POST', defaultInput, 'alice', { origin: 'https://evil.test' }), { DB: db })).status).toBe(403);
  });
  it('validates inputs before SQL writes and ignores forged derived fields', async () => {
    expect((await handleApi(req('/trips', 'POST', { ...defaultInput, days: 99 }), { DB: db })).status).toBe(400);
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM trips').get()?.n).toBe(0);
    const saved = await (await handleApi(req('/trips', 'POST', { ...defaultInput, estimate: 0, ownerId: 'bob' }), { DB: db })).json();
    expect(saved.trip.estimate).toBe(13200); expect(sqlite.prepare('SELECT owner_id FROM trips').get()?.owner_id).toBe('alice');
  });
  it('rejects malformed JSON, incorrect media types and oversized bodies', async () => {
    const headers = { 'oai-authenticated-user-id': 'alice', 'content-type': 'application/json' };
    expect((await handleApi(new Request('https://trip.test/api/plan', { method: 'POST', headers, body: '{broken' }), { DB: db })).status).toBe(400);
    expect((await handleApi(req('/plan', 'POST', defaultInput, 'alice', { 'content-type': 'text/plain' }), { DB: db })).status).toBe(415);
    expect((await handleApi(req('/plan', 'POST', { ...defaultInput, extra: 'x'.repeat(9000) }), { DB: db })).status).toBe(413);
  });
  it('reports unavailable storage, invalid methods and missing endpoints', async () => {
    expect((await handleApi(req('/trips'), {})).status).toBe(503);
    expect((await handleApi(req('/plan'), { DB: db })).status).toBe(405);
    expect((await handleApi(req('/unknown'), { DB: db })).status).toBe(404);
  });
  it('returns a safe error when the database fails', async () => {
    const broken = { prepare: () => { throw new Error('sensitive database details'); } } as unknown as D1Database;
    const response = await handleApi(req('/trips'), { DB: broken }); expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('sensitive');
  });
  it('returns the demo plan without contacting AI when not configured', async () => {
    const fetcher = vi.fn(); const response = await handleApi(req('/plan', 'POST', defaultInput), { DB: db }, fetcher);
    expect((await response.json()).generation).toMatchObject({ mode: 'demo', reason: 'not_configured' }); expect(fetcher).not.toHaveBeenCalled();
  });
  it('accepts only catalog-grounded AI selections and keeps server costs', async () => {
    const ids = activities('Jaipur').map(a => a.id);
    const fetcher = vi.fn(async () => Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ days: Array.from({ length: 3 }, () => ({ morning: ids[0], afternoon: ids[1], evening: ids[2] })) }) } }] }));
    const response = await handleApi(req('/plan', 'POST', defaultInput), { DB: db, OPENAI_API_KEY: 'test-only', AI_ENABLED: 'true' }, fetcher);
    const result = await response.json(); expect(result.generation.mode).toBe('ai'); expect(result.trip.estimate).toBe(13200);
    expect(result.trip.itinerary[0].morning).toBe(activities('Jaipur')[0].name);
  });
  it.each(['outage', 'invalid_json', 'unknown_place', 'wrong_day_count', 'timeout', 'refusal'])('falls back for %s', async failure => {
    const fetcher = vi.fn(async () => {
      if (failure === 'timeout') throw new Error('Timeout');
      if (failure === 'outage') return new Response('', { status: 503 });
      const days = Array.from({ length: failure === 'wrong_day_count' ? 1 : 3 }, () => ({ morning: 'imaginary-place', afternoon: 'imaginary-place', evening: 'imaginary-place' }));
      return Response.json({ choices: [{ finish_reason: 'stop', message: { refusal: failure === 'refusal' ? 'refused' : null, content: failure === 'invalid_json' ? '{bad' : JSON.stringify({ days }) } }] });
    });
    const response = await handleApi(req('/plan', 'POST', defaultInput), { DB: db, OPENAI_API_KEY: 'test-only', AI_ENABLED: 'true' }, fetcher);
    expect((await response.json()).generation).toMatchObject({ mode: 'demo', reason: 'provider_unavailable' });
  });
});
