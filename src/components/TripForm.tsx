import type { FormEvent } from 'react';
import { destinations, type TripInput } from '../types';

interface Props { input: TripInput; onChange: (input: TripInput) => void; onSubmit: () => void }
export function TripForm({ input, onChange, onSubmit }: Props) {
  const update = <K extends keyof TripInput>(key: K, value: TripInput[K]) => onChange({ ...input, [key]: value });
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSubmit(); };
  return <form onSubmit={submit}>
    <div className="eyebrow">01 / THE POSSIBILITIES</div><h2>Where are we going?</h2>
    <label>Destination<select value={input.destination} onChange={e => update('destination', e.target.value as TripInput['destination'])}>{destinations.map(place => <option key={place}>{place}</option>)}</select></label>
    <div className="row">
      <label>Days<input type="number" min="1" max="7" value={Number.isNaN(input.days) ? '' : input.days} required onChange={e => update('days', e.target.valueAsNumber)} /></label>
      <label>Travellers<input type="number" min="1" max="10" value={Number.isNaN(input.travellers) ? '' : input.travellers} required onChange={e => update('travellers', e.target.valueAsNumber)} /></label>
    </div>
    <label>Total budget for the group (₹)<input type="number" min="1000" max="1000000" step="100" required value={Number.isNaN(input.budget) ? '' : input.budget} onChange={e => update('budget', e.target.valueAsNumber)} /></label>
    <label>Your travel style<select value={input.style} onChange={e => update('style', e.target.value as TripInput['style'])}><option value="balanced">A bit of everything</option><option value="culture">Culture & history</option><option value="nature">Nature & slow days</option></select></label>
    <button className="primary" type="submit">Plan my escape <span aria-hidden="true">↗</span></button>
    <p className="note">Demo planner · curated suggestions and illustrative costs. Live prices, bookings and AI generation are planned features.</p>
  </form>;
}
