import { plan } from '../src/planner';
import { activities, catalogVersion } from './catalog';
import type { Trip, TripInput } from '../src/types';

export interface GeneratedTrip { trip: Trip; planId?: string; generation: { mode: 'ai' | 'demo'; reason: 'configured' | 'not_configured' | 'provider_unavailable'; catalogVersion: string } }
export interface AISettings { OPENAI_API_KEY?: string; AI_ENABLED?: string; AI_MODEL?: string }
type Fetcher = typeof fetch;
const slotNames = ['morning', 'afternoon', 'evening'] as const;

export async function generateTrip(input: TripInput, settings: AISettings, fetcher: Fetcher = fetch): Promise<GeneratedTrip> {
  const fallback = plan(input);
  const demo = (reason: GeneratedTrip['generation']['reason']): GeneratedTrip => ({ trip: fallback, generation: { mode: 'demo', reason, catalogVersion } });
  if (!settings.OPENAI_API_KEY || settings.AI_ENABLED !== 'true') return demo('not_configured');
  const catalog = activities(input.destination);
  const ids = catalog.map(item => item.id);
  const slot = { type: 'string', enum: ids };
  try {
    const response = await fetcher('https://api.openai.com/v1/chat/completions', {
      method: 'POST', signal: AbortSignal.timeout(12000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: settings.AI_MODEL || 'gpt-4o-mini', max_completion_tokens: 1600,
        messages: [{ role: 'system', content: 'Arrange a travel itinerary only from the provided catalog IDs. Respect the travel style and use one entry for each requested day. Do not invent places, prices, availability or bookings.' }, { role: 'user', content: JSON.stringify({ input, catalog, catalogVersion }) }],
        response_format: { type: 'json_schema', json_schema: { name: 'grounded_itinerary', strict: true, schema: {
          type: 'object', additionalProperties: false, required: ['days'], properties: { days: { type: 'array', items: {
            type: 'object', additionalProperties: false, required: ['morning', 'afternoon', 'evening'], properties: { morning: slot, afternoon: slot, evening: slot },
          } } },
        } } },
      }),
    });
    if (!response.ok) return demo('provider_unavailable');
    const body = await response.json() as { choices?: { message?: { content?: string; refusal?: string }; finish_reason?: string }[] };
    const choice = body.choices?.[0];
    if (!choice?.message?.content || choice.message.refusal || choice.finish_reason !== 'stop') return demo('provider_unavailable');
    const result: unknown = JSON.parse(choice.message.content);
    if (!result || typeof result !== 'object' || !('days' in result) || !Array.isArray(result.days) || result.days.length !== input.days) return demo('provider_unavailable');
    const selected = result.days.map((day: unknown, index: number) => {
      if (!day || typeof day !== 'object') throw new Error('Invalid day');
      const value = day as Record<string, unknown>;
      const resolved = slotNames.map(name => catalog.find(activity => activity.id === value[name])?.name);
      if (resolved.some(name => !name)) throw new Error('Unknown catalog entry');
      return { day: index + 1, title: `Explore ${input.destination} · Day ${index + 1}`, morning: resolved[0]!, afternoon: resolved[1]!, evening: resolved[2]! };
    });
    return { trip: { ...fallback, itinerary: selected }, generation: { mode: 'ai', reason: 'configured', catalogVersion } };
  } catch { return demo('provider_unavailable'); }
}
