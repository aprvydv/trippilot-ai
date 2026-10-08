import { guides } from '../src/planner';
import type { Destination } from '../src/types';

export interface Activity { id: string; name: string }
// This versioned, curated catalog grounds generated schedules. It is not live availability data.
export const catalogVersion = '2026-10-09-v1';
export function activities(destination: Destination): Activity[] {
  return Array.from(new Set(guides[destination].days.flatMap(day => day.slice(1))))
    .map((name, index) => ({ id: `${destination.toLowerCase()}-${index + 1}`, name }));
}
