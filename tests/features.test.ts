import { describe, expect, it } from 'vitest';
import { defaultInput, plan } from '../src/planner';
import { swapActivities } from '../src/components/ItineraryEditor';
import { passDates } from '../src/components/TripPass';

describe('trip personalization', () => {
  it('swaps across days without mutating the original or losing an activity', () => {
    const original = plan(defaultInput); const changed = swapActivities(original, 0, 5);
    expect(changed.itinerary[0].morning).toBe(original.itinerary[1].evening);
    expect(changed.itinerary[1].evening).toBe(original.itinerary[0].morning);
    expect(original.itinerary[0].morning).toBe('Amber Fort');
    expect(swapActivities(original, -1, 0)).toBe(original);
    expect(changed.estimate).toBe(original.estimate);
  });
  it('creates distinct slow and food schedules while keeping illustrative costs consistent', () => {
    const slow = plan({ ...defaultInput, style: 'slow' });
    const food = plan({ ...defaultInput, style: 'food' });
    expect(slow.itinerary[0].morning).toMatch(/slow breakfast/);
    expect(food.itinerary[0].afternoon).toMatch(/regional lunch/);
    expect(slow.estimate).toBe(food.estimate);
  });
  it('formats inclusive trip dates across month/year boundaries without timezone drift', () => {
    expect(passDates('2026-12-31', 3)).toBe('31 Dec 2026 – 2 Jan 2027');
    expect(passDates('2026-10-10', 1)).toBe('10 Oct 2026');
    expect(passDates('', 3)).toBe('Dates to be decided');
    expect(passDates('2026-02-31', 3)).toBe('Dates to be decided');
  });
});
