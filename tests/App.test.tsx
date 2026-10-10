import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import * as api from '../src/api';
import type { SavedTrip } from '../server/repository';
vi.mock('../src/api', () => ({ generate: vi.fn(), save: vi.fn(), list: vi.fn() }));
let cloudTrip: SavedTrip | undefined;
beforeEach(() => {
  cloudTrip = undefined;
  const generation = { mode: 'demo' as const, reason: 'not_configured' as const, catalogVersion: '2026-10-09-v1' };
  vi.mocked(api.generate).mockImplementation(async input => ({ trip: plan(input), generation }));
  vi.mocked(api.save).mockImplementation(async input => { cloudTrip = { id: 'test-trip', createdAt: new Date().toISOString(), trip: plan(input), generation }; return cloudTrip; });
  vi.mocked(api.list).mockImplementation(async () => ({ trips: cloudTrip ? [cloudTrip] : [] }));
});
import { plan, defaultInput } from '../src/planner';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('planner interactions', () => {
  it('submits form choices and reports an over-budget trip', async () => {
    const user = userEvent.setup(); render(<App />);
    await user.selectOptions(screen.getByLabelText('Destination'), 'Goa');
    await user.clear(screen.getByLabelText('Days')); await user.type(screen.getByLabelText('Days'), '2');
    await user.click(screen.getByText('Budget & preferences'));
    await user.clear(screen.getByLabelText(/Total budget/)); await user.type(screen.getByLabelText(/Total budget/), '3000');
    await user.click(screen.getByRole('button', { name: /Plan my escape/ }));
    const result = screen.getByRole('region', { name: 'Your itinerary' });
    expect(within(result).getByRole('heading', { name: 'Your two-day escape' })).toBeInTheDocument();
    expect(within(result).getAllByRole('tab')).toHaveLength(2);
    await user.click(within(result).getByRole('tab', { name: 'Day 02' }));
    expect(within(result).getByRole('tabpanel')).toHaveAccessibleName('Day 02');
    await user.keyboard('{ArrowLeft}');
    expect(within(result).getByRole('tab', { name: 'Day 01' })).toHaveFocus();
    expect(within(result).getByText(/above your budget/)).toHaveTextContent('₹8,200');
  });
  it('saves the generated trip and restores it after form changes', async () => {
    const user = userEvent.setup(); render(<App />);
    await user.click(screen.getByRole('button', { name: 'Save this trip' }));
    await user.selectOptions(screen.getByLabelText('Destination'), 'Manali');
    await user.click(screen.getByRole('button', { name: /Plan my escape/ }));
    expect(screen.getByRole('heading', { name: 'Your three-day escape' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'My saved trip' }));
    expect(screen.getByLabelText('Destination')).toHaveValue('Jaipur');
    expect(screen.getByRole('heading', { name: 'Your three-day escape' })).toBeInTheDocument();
    expect(screen.getByText('Saved trip restored from your account.')).toBeInTheDocument();
  });
  it('restores the previous version’s saved JSON and recalculates derived values', async () => {
    localStorage.setItem('trippilot:trip', JSON.stringify({ ...plan(defaultInput), estimate: 0, nickname: '<script>tampered</script>' }));
    render(<App />); await userEvent.click(screen.getByRole('button', { name: 'My saved trip' }));
    expect(screen.getByRole('heading', { name: 'Your three-day escape' })).toBeInTheDocument();
    expect(screen.getByText('₹13,200')).toBeInTheDocument();
  });
  it('handles missing and corrupt saved trips without losing the current itinerary', async () => {
    const user = userEvent.setup(); render(<App />);
    await user.click(screen.getByRole('button', { name: 'My saved trip' }));
    expect(screen.getByText(/No saved trip yet/)).toBeInTheDocument();
    localStorage.setItem('trippilot:trip', '{broken');
    await user.click(screen.getByRole('button', { name: 'My saved trip' }));
    expect(screen.getByText('Could not restore the saved trip.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your three-day escape' })).toBeInTheDocument();
  });
  it('reports unavailable storage', async () => {
    vi.mocked(api.save).mockRejectedValue(new Error('Trip storage is unavailable.'));
    render(<App />); await userEvent.click(screen.getByRole('button', { name: 'Save this trip' }));
    expect(screen.getByText(/Trip storage is unavailable/)).toBeInTheDocument();
  });
  it('exports the currently generated trip and releases the blob URL', async () => {
    const createObjectURL = vi.fn(() => 'blob:trip'); const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<App />); await userEvent.click(screen.getByRole('button', { name: /Download JSON/ }));
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledOnce();
    const link = click.mock.contexts[0] as unknown as HTMLAnchorElement;
    expect(link.download).toBe('trippilot-itinerary.json');
    expect(link.href).toBe('blob:trip');
    expect(screen.getByText('Trip downloaded as JSON.')).toBeInTheDocument();
    await vi.waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:trip'), { timeout: 1500 });
  });
});
