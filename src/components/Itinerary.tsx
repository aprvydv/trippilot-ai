import { rupees } from '../planner';
import type { ItineraryDay, Trip } from '../types';

function DayCard({ day }: { day: ItineraryDay }) {
  return <article className="day"><div className="day-number" aria-label={`Day ${day.day}`}>{String(day.day).padStart(2, '0')}</div><div><h3>{day.title}</h3>{(['morning', 'afternoon', 'evening'] as const).map(slot => <p key={slot}><b>{slot[0].toUpperCase() + slot.slice(1)} · </b>{day[slot]}</p>)}</div></article>;
}
interface Props { trip: Trip; status: string; onSave: () => void; onDownload: () => void; busy?: boolean; mode?: 'ai' | 'demo' }
export function Itinerary({ trip, status, onSave, onDownload, busy, mode = 'demo' }: Props) {
  const metrics = [[trip.days, 'days of discovery'], [trip.travellers, 'travellers'], [rupees(trip.estimate), 'estimated group cost']];
  return <section className="result" aria-label="Your itinerary">
    <div className="result-top"><div><div className="eyebrow">02 / YOUR NEXT CHAPTER</div><h2>{trip.days} days in {trip.nickname}</h2></div><span className="badge">{mode === 'ai' ? 'AI CURATED' : 'DEMO ITINERARY'}</span></div>
    <div className="metrics">{metrics.map(([value, label]) => <div className="metric" key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
    <p id="budget-message" role="status">{trip.withinBudget ? `${rupees(trip.budget - trip.estimate)} below your budget.` : `About ${rupees(trip.estimate - trip.budget)} above your budget. Consider fewer days or a larger budget.`} Illustrative stay, meals and local transport only; excludes travel to destination, tickets and paid activities.</p>
    <div>{trip.itinerary.map(day => <DayCard day={day} key={day.day} />)}</div>
    <div className="actions"><button type="button" onClick={onSave} disabled={busy}>Save this trip</button><button type="button" onClick={onDownload} disabled={busy}>Download JSON ↓</button></div>
    <p id="status" role="status">{status}</p>
  </section>;
}
