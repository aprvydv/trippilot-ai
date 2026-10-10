import { useState } from 'react';
import { DotsSixVertical, ArrowUUpLeft } from '@phosphor-icons/react';
import { activityOptions, slots } from '../planner';
import type { Trip } from '../types';

export function swapActivities(trip: Trip, from: number, to: number): Trip {
  const count = trip.days * 3;
  if (![from, to].every(n => Number.isInteger(n) && n >= 0 && n < count)) return trip;
  const itinerary = trip.itinerary.map(day => ({ ...day }));
  const a = itinerary[Math.floor(from / 3)], b = itinerary[Math.floor(to / 3)];
  const first = slots[from % 3], second = slots[to % 3];
  [a[first], b[second]] = [b[second], a[first]];
  return { ...trip, itinerary };
}
interface Props { trip: Trip; onChange: (trip: Trip) => void; busy?: boolean }
export function ItineraryEditor({ trip, onChange, busy }: Props) {
  const [dragged, setDragged] = useState<number | null>(null);
  const [history, setHistory] = useState<Trip[]>([]);
  const [message, setMessage] = useState('');
  const options = activityOptions(trip.destination);
  const positions = trip.itinerary.flatMap((day, index) => slots.map((slot, s) => ({ index: index * 3 + s, label: `Day ${day.day} · ${slot}` })));
  const commit = (next: Trip, notice: string) => { setHistory(h => [...h.slice(-19), trip]); onChange(next); setMessage(notice); };
  const swap = (from: number, to: number) => { if (from !== to) commit(swapActivities(trip, from, to), `Swapped ${positions[from].label} with ${positions[to].label}.`); };
  return <div className="itinerary-editor">
    <div className="editor-help"><p>Drag to swap slots, or use the menus. Choices come from the destination’s curated list.</p><button type="button" disabled={!history.length || busy} onClick={() => { const previous = history[history.length - 1]; if (previous) { onChange(previous); setHistory(history.slice(0, -1)); setMessage('Last edit undone.'); } }}><ArrowUUpLeft size={15} aria-hidden="true" />Undo</button></div>
    {trip.itinerary.map((day, index) => <fieldset className="editor-day" key={day.day} disabled={busy}><legend>Day {day.day}</legend>{slots.map((slot, s) => {
      const position = index * 3 + s;
      return <div className={`editor-slot${dragged === position ? ' is-dragging' : ''}`} key={slot} onDragOver={e => { if (dragged !== null && !busy) e.preventDefault(); }} onDrop={e => { e.preventDefault(); if (dragged !== null && !busy) swap(dragged, position); setDragged(null); }}>
        <button className="drag-handle" type="button" draggable={!busy} aria-label={`Drag day ${day.day} ${slot}; use Swap with for keyboard movement`} onDragStart={e => { setDragged(position); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(position)); }} onDragEnd={() => setDragged(null)}><DotsSixVertical size={20} aria-hidden="true" /></button>
        <label className="replace-field"><span>{slot}</span><select aria-label={`Activity for day ${day.day} ${slot}`} value={day[slot]} onChange={e => commit({ ...trip, itinerary: trip.itinerary.map((d, i) => i === index ? { ...d, [slot]: e.target.value } : d) }, `Replaced day ${day.day} ${slot}.`)}>{options.map(activity => <option key={activity}>{activity}</option>)}</select></label>
        <select className="swap-select" aria-label={`Swap day ${day.day} ${slot} with`} value="" onChange={e => { if (e.target.value !== '') swap(position, Number(e.target.value)); }}><option value="">Swap with…</option>{positions.filter(p => p.index !== position).map(p => <option key={p.index} value={p.index}>{p.label}</option>)}</select>
      </div>;
    })}</fieldset>)}
    <p role="status" className="editor-status">{message}</p><p className="editor-footnote">Select Save this trip to keep your edits. Moving activities does not verify opening hours or travel time.</p>
  </div>;
}
