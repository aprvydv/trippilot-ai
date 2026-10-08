import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import { plan, defaultInput } from '../src/planner';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('planner interactions', () => {
  it('submits form choices and reports an over-budget trip', async () => {
    const user = userEvent.setup(); render(<App />);
    await user.selectOptions(screen.getByLabelText('Destination'), 'Goa');
    await user.clear(screen.getByLabelText('Days')); await user.type(screen.getByLabelText('Days'), '2');
    await user.clear(screen.getByLabelText(/Total budget/)); await user.type(screen.getByLabelText(/Total budget/), '3000');
    await user.click(screen.getByRole('button', { name: /Plan my escape/ }));
    const result = screen.getByRole('region', { name: 'Your itinerary' });
    expect(within(result).getByRole('heading', { name: '2 days in the coast' })).toBeInTheDocument();
    expect(within(result).getAllByRole('article')).toHaveLength(2);
    expect(within(result).getByText(/above your budget/)).toHaveTextContent('₹8,200');
  });
  it('saves the generated trip and restores it after form changes', async () => {
    const user = userEvent.setup(); render(<App />);
    await user.click(screen.getByRole('button', { name: 'Save this trip' }));
    await user.selectOptions(screen.getByLabelText('Destination'), 'Manali');
    await user.click(screen.getByRole('button', { name: /Plan my escape/ }));
    expect(screen.getByRole('heading', { name: '3 days in the mountains' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'My saved trip' }));
    expect(screen.getByLabelText('Destination')).toHaveValue('Jaipur');
    expect(screen.getByRole('heading', { name: '3 days in the Pink City' })).toBeInTheDocument();
    expect(screen.getByText('Saved trip restored.')).toBeInTheDocument();
  });
  it('restores the previous version’s saved JSON and recalculates derived values', async () => {
    localStorage.setItem('trippilot:trip', JSON.stringify({ ...plan(defaultInput), estimate: 0, nickname: '<script>tampered</script>' }));
    render(<App />); await userEvent.click(screen.getByRole('button', { name: 'My saved trip' }));
    expect(screen.getByRole('heading', { name: '3 days in the Pink City' })).toBeInTheDocument();
    expect(screen.getByText('₹13,200')).toBeInTheDocument();
  });
  it('handles missing and corrupt saved trips without losing the current itinerary', async () => {
    const user = userEvent.setup(); render(<App />);
    await user.click(screen.getByRole('button', { name: 'My saved trip' }));
    expect(screen.getByText(/No saved trip yet/)).toBeInTheDocument();
    localStorage.setItem('trippilot:trip', '{broken');
    await user.click(screen.getByRole('button', { name: 'My saved trip' }));
    expect(screen.getByText('Could not restore the saved trip.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '3 days in the Pink City' })).toBeInTheDocument();
  });
  it('reports unavailable storage', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage denied'); });
    render(<App />); await userEvent.click(screen.getByRole('button', { name: 'Save this trip' }));
    expect(screen.getByText(/Browser storage is unavailable/)).toBeInTheDocument();
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
