import { describe, expect, it } from 'vitest';
import { defaultInput, plan } from '../src/planner';

describe('trip planning', () => {
  it('scales estimates by days and group size', () => {
    expect(plan(defaultInput)).toMatchObject({ estimate: 13200, withinBudget: true });
    expect(plan({ ...defaultInput, travellers: 1 }).estimate).toBe(6600);
    expect(plan(defaultInput).itinerary).toHaveLength(3);
  });
  it('flags an insufficient budget', () => expect(plan({ ...defaultInput, budget: 1000 }).withinBudget).toBe(false));
  it.each([null, undefined, 'trip', { days: 0 }, { days: 1.5 }, { days: 8 }, { travellers: 0 }, { budget: NaN }, { budget: Infinity }, { destination: 'constructor' }, { destination: 'Unknown' }, { style: 'unknown' }, { budget: '18000' }])('rejects invalid input %j', value => {
    expect(() => plan(typeof value === 'object' && value !== null ? { ...defaultInput, ...value } : value)).toThrow();
  });
  it('supports every destination and style for seven days', () => {
    for (const destination of ['Jaipur', 'Goa', 'Manali']) for (const style of ['balanced', 'nature', 'culture']) {
      const trip = plan({ ...defaultInput, destination, style, days: 7 });
      expect(trip.itinerary).toHaveLength(7);
      expect(trip.itinerary[6].day).toBe(7);
      expect(trip.itinerary.every(d => d.morning && d.afternoon && d.evening)).toBe(true);
    }
  });
});
