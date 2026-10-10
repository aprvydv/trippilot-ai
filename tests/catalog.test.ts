import { describe, expect, it } from 'vitest';
import { activities, destinationActivities } from '../server/catalog';
import { defaultInput, guides, plan } from '../src/planner';
import { destinations } from '../src/types';

describe('destination catalogs', () => {
  it.each(destinations)('%s has complete, consistently tagged activity data', destination => {
    const curated = destinationActivities[destination];
    expect(Object.keys(curated).length).toBeGreaterThanOrEqual(8);
    expect(Object.keys(curated)).toEqual(guides[destination].days.flatMap(day => day.slice(1)));
    const catalog = activities(destination);
    expect(new Set(catalog.map(activity => activity.id)).size).toBe(catalog.length);
    for (const activity of catalog) {
      expect(activity.tags.length).toBeGreaterThan(0);
      expect(activity.tags.every(tag => ['balanced', 'culture', 'nature'].includes(tag))).toBe(true);
      expect(Number.isFinite(activity.estimatedCostInr)).toBe(true);
      expect(activity.estimatedCostInr).toBeGreaterThanOrEqual(0);
    }
    expect(new Set(Object.values(curated).flatMap(([tags]) => tags))).toEqual(new Set(['balanced', 'culture', 'nature']));
  });
  it.each(['Rishikesh', 'Udaipur', 'Pondicherry'] as const)('%s keeps the existing cost formula and day cycling', destination => {
    const trip = plan({ ...defaultInput, destination, days: 7 });
    expect(trip.estimate).toBe(guides[destination].daily * 7 * defaultInput.travellers);
    expect(trip.itinerary[6].morning).toBe(trip.itinerary[0].morning);
    const allowed = new Set(activities(destination).map(activity => activity.name));
    expect(trip.itinerary.every(day => [day.morning, day.afternoon, day.evening].every(name => allowed.has(name)))).toBe(true);
  });
  it('preserves existing Jaipur IDs', () => {
    expect(activities('Jaipur')[0]).toMatchObject({ id: 'jaipur-1', name: 'Amber Fort' });
    expect(activities('Jaipur')[8]).toMatchObject({ id: 'jaipur-9', name: 'Nahargarh sunset viewpoint' });
  });
});
