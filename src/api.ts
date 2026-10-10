import type { TripInput } from './types';
import type { GeneratedTrip } from '../server/ai';
import type { SavedTrip } from '../server/repository';
async function request<T>(path: string, method = 'GET', body?: TripInput & { planId?: string; schedule?: string[][] }): Promise<T> {
  const response = await fetch(path, { method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const value = await response.json();
  if (!response.ok) {
    const error = value && typeof value === 'object' && 'error' in value && typeof value.error === 'string' ? value.error : 'The request failed. Please try again.';
    throw new Error(error);
  }
  return value as T;
}
export const generate = (input: TripInput) => request<GeneratedTrip>('/api/plan', 'POST', input);
export const save = (input: TripInput, planId?: string, schedule?: string[][]) => request<SavedTrip>('/api/trips', 'POST', { ...input, planId, schedule });
export const list = () => request<{ trips: SavedTrip[] }>('/api/trips');
