import { useEffect, useRef, useState } from 'react';
import { X, DownloadSimple } from '@phosphor-icons/react';
import { moods, rupees } from '../planner';
import type { Trip } from '../types';

export function passDates(start: string, days: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return 'Dates to be decided';
  const first = new Date(`${start}T12:00:00Z`);
  if (Number.isNaN(first.getTime()) || first.toISOString().slice(0, 10) !== start) return 'Dates to be decided';
  const last = new Date(first); last.setUTCDate(first.getUTCDate() + days - 1);
  const format = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return days === 1 ? format(first) : `${format(first)} – ${format(last)}`;
}
export function drawTripPass(canvas: HTMLCanvasElement, trip: Trip, start: string) {
  canvas.width = 1080; canvas.height = 1350;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Image export is not supported in this browser.');
  const bg = ctx.createLinearGradient(0, 0, 1080, 1350); bg.addColorStop(0, '#25374a'); bg.addColorStop(1, '#101419'); ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1350);
  const text = (value: string, x: number, y: number, size: number, color = '#edf3fb', weight = 400) => { ctx.fillStyle = color; ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`; ctx.fillText(value, x, y); };
  const line = (y: number) => { ctx.strokeStyle = '#ffffff28'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(80, y); ctx.lineTo(1000, y); ctx.stroke(); };
  text('TRIPPILOT', 80, 105, 27, '#d1e3f6', 600); text('YOUR NEXT ESCAPE', 80, 228, 20, '#a9bacd', 500);
  text(trip.destination, 75, 352, 112, '#f3f6fb', 600); text(passDates(start, trip.days), 80, 415, 29, '#c5d4e4');
  line(477);
  const mood = moods.find(m => m.value === trip.style)?.label || 'Balanced';
  text('DURATION', 80, 545, 18, '#9dafc1'); text(`${trip.days} ${trip.days === 1 ? 'day' : 'days'}`, 80, 592, 36, '#eef4fc', 500);
  text('TRAVELLERS', 415, 545, 18, '#9dafc1'); text(String(trip.travellers).padStart(2, '0'), 415, 592, 36, '#eef4fc', 500);
  text('MOOD', 710, 545, 18, '#9dafc1'); text(mood, 710, 592, 30, '#eef4fc', 500);
  line(639); text('A FEW MOMENTS TO LOOK FORWARD TO', 80, 702, 18, '#9dafc1');
  const wrap = (value: string, y: number) => { ctx.font = '400 28px sans-serif'; let row = ''; let lines = 0; for (const word of value.split(' ')) { if (ctx.measureText(`${row} ${word}`).width > 795 && row) { text(row, 150, y + lines * 36, 28); lines++; row = word; if (lines === 2) break; } else row = row ? `${row} ${word}` : word; } if (lines < 2) text(row, 150, y + lines * 36, 28); };
  trip.itinerary.slice(0, 3).forEach((day, i) => { const y = 766 + i * 100; text(String(day.day).padStart(2, '0'), 80, y, 22, '#9dafc1'); wrap(day.morning.split(';')[0], y); });
  line(1040); text('ILLUSTRATIVE GROUP ESTIMATE', 80, 1102, 18, '#9dafc1'); text(rupees(trip.estimate), 80, 1161, 42, '#e6f1ff', 500);
  text(`Budget ${rupees(trip.budget)}`, 675, 1158, 25, '#b3c3d5');
  text('Stay, meals & local transport only. Other travel, tickets & paid activities excluded.', 80, 1232, 18, '#a6b6c8');
  text('TRIP PLAN · NOT A TICKET OR BOOKING', 80, 1291, 19, '#d0def0', 500);
}
export function TripPass({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null); const canvas = useRef<HTMLCanvasElement>(null);
  const [start, setStart] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  useEffect(() => { const node = dialog.current!; node.showModal(); return () => node.close(); }, []);
  useEffect(() => { try { if (canvas.current) drawTripPass(canvas.current, trip, start); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Could not create the pass.'); } }, [trip, start]);
  const close = () => { dialog.current?.close(); onClose(); };
  const download = () => { if (!canvas.current) return; setSaving(true); canvas.current.toBlob(blob => { setSaving(false); if (!blob) { setError('Could not export the image. Please try again.'); return; } const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `trippilot-${trip.destination.toLowerCase()}-pass.png`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }, 'image/png'); };
  return <dialog ref={dialog} className="pass-dialog" aria-labelledby="pass-title" onCancel={e => { e.preventDefault(); close(); }} onClose={onClose}>
    <div className="pass-heading"><div><h2 id="pass-title">Your trip pass</h2><p>A little keepsake for the journey.</p></div><button type="button" onClick={close} aria-label="Close trip pass"><X size={22} /></button></div>
    <label className="pass-date">Start date <span>Optional · for this pass only</span><input type="date" value={start} onInput={e => setStart(e.currentTarget.value)} onChange={e => setStart(e.target.value)} onBlur={e => setStart(e.currentTarget.value)} /></label>
    <canvas ref={canvas} role="img" aria-label={`${trip.destination} trip pass: ${trip.days} days, ${trip.travellers} travellers, ${passDates(start, trip.days)}, estimated ${rupees(trip.estimate)}`} />
    {error && <p role="alert">{error}</p>}<button type="button" className="primary" onClick={download} disabled={saving || !!error}><DownloadSimple size={18} aria-hidden="true" />{saving ? 'Creating image…' : 'Download PNG'}</button>
  </dialog>;
}
