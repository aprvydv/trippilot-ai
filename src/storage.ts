import { plan } from './planner';
import type { Trip } from './types';

const key = 'trippilot:trip';
export function saveTrip(trip: Trip): void { localStorage.setItem(key, JSON.stringify(trip)); }
export function restoreTrip(): Trip | null {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  try { return plan(JSON.parse(raw)); } catch { throw new Error('Could not restore the saved trip.'); }
}

export function downloadTrip(trip: Trip): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(trip, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'trippilot-itinerary.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
