import type { FormEvent } from 'react';
import { ArrowRight, Minus, Plus } from '@phosphor-icons/react';
import { destinations, type TripInput } from '../types';

interface Props { input: TripInput; onChange: (input: TripInput) => void; onSubmit: () => void; busy?: boolean }
export function TripForm({ input, onChange, onSubmit, busy }: Props) {
  const update = <K extends keyof TripInput>(key: K, value: TripInput[K]) => onChange({ ...input, [key]: value });
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSubmit(); };
  const stepper = (key: 'days' | 'travellers', label: string, max: number) => <div className="field"><label htmlFor={key}>{label}</label><div className="stepper"><button type="button" aria-label={`Decrease ${label.toLowerCase()}`} disabled={busy || input[key] <= 1} onClick={() => update(key, Math.max(1, (input[key] || 1) - 1))}><Minus size={18} /></button><input id={key} type="number" min="1" max={max} value={Number.isNaN(input[key]) ? '' : input[key]} required onChange={e => update(key, e.target.valueAsNumber)} /><button type="button" aria-label={`Increase ${label.toLowerCase()}`} disabled={busy || input[key] >= max} onClick={() => update(key, Math.min(max, (input[key] || 0) + 1))}><Plus size={18} /></button></div></div>;
  return <form className="glass-controls" onSubmit={submit} aria-label="Trip settings">
    <div className="field"><label htmlFor="destination">Destination</label><select id="destination" value={input.destination} onChange={e => update('destination', e.target.value as TripInput['destination'])}>{destinations.map(place => <option key={place}>{place}</option>)}</select></div>
    {stepper('days', 'Days', 7)}{stepper('travellers', 'Travellers', 10)}
    <div className="field"><label htmlFor="budget">Group budget (₹)</label><input id="budget" aria-label="Total budget for the group (₹)" type="number" min="1000" max="1000000" step="100" required value={Number.isNaN(input.budget) ? '' : input.budget} onChange={e => update('budget', e.target.valueAsNumber)} /></div>
    <div className="field"><label htmlFor="style">Travel style</label><select id="style" value={input.style} onChange={e => update('style', e.target.value as TripInput['style'])}><option value="balanced">Balanced</option><option value="culture">Culture</option><option value="nature">Nature</option></select></div>
    <button className="primary" type="submit" disabled={busy}>{busy ? 'Planning…' : 'Plan my escape'}<ArrowRight size={22} aria-hidden="true" /></button>
  </form>;
}
