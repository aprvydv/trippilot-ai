import { useState } from 'react';
import { BookmarkSimple, DownloadSimple } from '@phosphor-icons/react';
import { rupees } from '../planner';
import type { Trip } from '../types';
interface Props { trip: Trip; status: string; onSave: () => void; onDownload: () => void; busy?: boolean; mode?: 'ai' | 'demo' }
export function Itinerary({ trip, status, onSave, onDownload, busy, mode = 'demo' }: Props) {
  const [selectedDay, setSelectedDay] = useState(0);
  const active = Math.min(selectedDay, trip.days - 1);
  const day = trip.itinerary[active];
  const dayNames = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'];
  return <section className="result" aria-label="Your itinerary" aria-busy={busy}>
    <div className="result-heading"><h2>Your {dayNames[trip.days - 1]}-day escape</h2><span className="trip-meta">{trip.destination} · {trip.travellers} {trip.travellers === 1 ? 'traveller' : 'travellers'} · {mode === 'ai' ? 'AI curated' : 'Curated demo'}</span></div>
    <div className="result-grid"><div className="journal">
      <div className="day-tabs" role="tablist" aria-label="Itinerary days">{trip.itinerary.map((item, i) => <button key={item.day} id={`day-tab-${i}`} type="button" role="tab" aria-selected={active === i} aria-controls="day-panel" tabIndex={active === i ? 0 : -1} onClick={() => setSelectedDay(i)} onKeyDown={e => { let next = i; if (e.key === 'ArrowRight') next = (i + 1) % trip.days; else if (e.key === 'ArrowLeft') next = (i + trip.days - 1) % trip.days; else if (e.key === 'Home') next = 0; else if (e.key === 'End') next = trip.days - 1; else return; e.preventDefault(); setSelectedDay(next); document.getElementById(`day-tab-${next}`)?.focus(); }}>Day {String(item.day).padStart(2, '0')}</button>)}</div>
      <article className="paper-sheet" id="day-panel" role="tabpanel" aria-labelledby={`day-tab-${active}`} tabIndex={0}>
        {(['morning', 'afternoon', 'evening'] as const).map(slot => <div className="activity" key={`${active}-${slot}`}><span className="time-label">{slot}</span><div><h3>{day[slot].split(';')[0]}</h3><p>{day[slot].includes(';') ? day[slot].split(';').slice(1).join(';').trim() : slot === 'morning' ? 'Start the day at your own pace.' : slot === 'afternoon' ? 'Leave a little room to explore.' : 'Wind down and make it a memory.'}</p></div></div>)}
      </article>
    </div><aside className="budget-summary" aria-label="Budget summary"><p className="budget-label">Illustrative group estimate</p><strong className="estimate">{rupees(trip.estimate)}</strong><progress aria-label="Estimated cost as a share of your budget" value={Math.min(trip.estimate, trip.budget)} max={trip.budget} /><p id="budget-message" className={trip.withinBudget ? '' : 'over-budget'}>{rupees(Math.abs(trip.budget - trip.estimate))} {trip.withinBudget ? 'under budget' : 'above your budget'}</p><div className="actions"><button type="button" onClick={onSave} disabled={busy}><BookmarkSimple size={21} aria-hidden="true" />Save this trip</button><button type="button" onClick={onDownload} disabled={busy} aria-label="Download JSON"><DownloadSimple size={21} aria-hidden="true" />Export JSON</button></div><p className="note">Curated data. Illustrative stay, meals and local transport. Travel to destination, tickets and paid activities excluded.</p></aside></div>
    <p id="status" role="status" aria-live="polite">{status}</p>
  </section>;
}
