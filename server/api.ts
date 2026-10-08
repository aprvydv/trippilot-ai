import { parseTripInput } from '../src/planner';
import { generateTrip, type AISettings } from './ai';
import { TripRepository } from './repository';
export interface ApiEnv extends AISettings { DB?: D1Database }
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
async function input(request: Request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new ApiError(415, 'Use application/json.');
  if (Number(request.headers.get('content-length')) > 8192) throw new ApiError(413, 'Request is too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'A JSON body is required.');
  let size = 0; const chunks: Uint8Array[] = [];
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 8192) { await reader.cancel(); throw new ApiError(413, 'Request is too large.'); } chunks.push(value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try {
    const raw = JSON.parse(new TextDecoder().decode(bytes)); const parsed = parseTripInput(raw);
    if (raw.planId !== undefined && (typeof raw.planId !== 'string' || !/^[a-f0-9-]{36}$/.test(raw.planId))) throw new Error('Invalid plan identifier.');
    return { ...parsed, planId: raw.planId as string | undefined };
  } catch (error) { throw new ApiError(400, error instanceof SyntaxError ? 'Malformed JSON.' : error instanceof Error ? error.message : 'Invalid input.'); }
}
export async function handleApi(request: Request, env: ApiEnv, fetcher: typeof fetch = fetch): Promise<Response> {
  try {
    const url = new URL(request.url); const path = url.pathname.replace(/\/$/, '');
    if (path === '/api/health' && request.method === 'GET') return json({ status: 'ok', storage: env.DB ? 'configured' : 'unavailable', ai: env.OPENAI_API_KEY && env.AI_ENABLED === 'true' ? 'configured' : 'demo' });
    const owner = request.headers.get('oai-authenticated-user-id');
    if (!owner) return json({ error: 'Sign in to use the planner and saved trips.' }, 401);
    if (['POST', 'DELETE'].includes(request.method)) {
      const origin = request.headers.get('origin');
      if (origin && origin !== url.origin) return json({ error: 'Cross-origin writes are not allowed.' }, 403);
    }
    if (path === '/api/plan') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
      const value = await input(request); const generated = await generateTrip(value, env, fetcher);
      if (!env.DB) return json(generated);
      const repo = new TripRepository(env.DB); await repo.pruneDrafts(owner);
      const draft = await repo.save(owner, generated, false);
      return json({ ...generated, planId: draft.id });
    }
    const match = path.match(/^\/api\/trips(?:\/([a-f0-9-]{36}))?$/);
    if (!match) return json({ error: 'Not found.' }, 404);
    if (!env.DB) return json({ error: 'Trip storage is unavailable.' }, 503);
    const repo = new TripRepository(env.DB); const id = match[1];
    if (request.method === 'GET') { if (!id) return json({ trips: await repo.list(owner) }); const trip = await repo.get(owner, id); return trip ? json(trip) : json({ error: 'Trip not found.' }, 404); }
    if (request.method === 'POST' && !id) {
      // Recompute server-side. Clients cannot set costs, provenance or arbitrary itinerary text.
      const value = await input(request);
      if (value.planId) { const saved = await repo.markSaved(owner, value.planId); return saved ? json(saved, 201) : json({ error: 'Plan not found. Generate a new trip and try again.' }, 404); }
      return json(await repo.save(owner, await generateTrip(value, env, fetcher)), 201);
    }
    if (request.method === 'DELETE' && id) return await repo.remove(owner, id) ? json({ deleted: true }) : json({ error: 'Trip not found.' }, 404);
    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) { return error instanceof ApiError ? json({ error: error.message }, error.status) : json({ error: 'The request could not be completed. Please try again.' }, 500); }
}
