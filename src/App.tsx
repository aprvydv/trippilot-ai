import { useState } from 'react';
import { defaultInput, plan } from './planner';
import { downloadTrip, restoreTrip, saveTrip } from './storage';
import { TripForm } from './components/TripForm';
import { Itinerary } from './components/Itinerary';

export default function App() {
  const [input, setInput] = useState(defaultInput);
  const [trip, setTrip] = useState(() => plan(defaultInput));
  const [status, setStatus] = useState('');
  const generate = () => { try { setTrip(plan(input)); setStatus(''); } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not plan this trip.'); } };
  const save = () => { try { saveTrip(trip); setStatus('Saved on this browser.'); } catch { setStatus('Browser storage is unavailable. You can download the trip instead.'); } };
  const restore = () => { try { const saved = restoreTrip(); if (!saved) { setStatus('No saved trip yet. Plan one and select Save this trip.'); return; } setInput(saved); setTrip(saved); setStatus('Saved trip restored.'); } catch { setStatus('Could not restore the saved trip.'); } };
  const download = () => { try { downloadTrip(trip); setStatus('Trip downloaded as JSON.'); } catch { setStatus('Could not download this trip. Please try again.'); } };
  return <>
    <header><a className="logo" href="./">✳ TripPilot<span>AI</span></a><span className="tag">THE JOURNEY STARTS HERE</span><button type="button" onClick={restore}>My saved trip</button></header>
    <main>
      <section className="intro"><div className="eyebrow">LESS PLANNING. MORE WANDERING.</div><h1>Your next escape,<br /><em>beautifully planned.</em></h1><p>A little direction for your next big adventure. Pick a place, set your pace, and make every day count.</p><div className="pills"><span>↗ Your kind of adventure</span><span>₹ A budget that fits</span><span>◷ Every day, mapped out</span></div></section>
      <div className="workspace"><TripForm input={input} onChange={setInput} onSubmit={generate} /><Itinerary trip={trip} status={status} onSave={save} onDownload={download} /></div>
      <footer>Thoughtfully planned. Freely explored.<span>TripPilot AI / Portfolio prototype / 2026</span></footer>
    </main>
  </>;
}
