'use client';
import { useState } from 'react';
import { defaultInput, plan } from './planner';
import { downloadTrip, restoreTrip } from './storage';
import * as api from './api';
import type { GeneratedTrip } from '../server/ai';
import { TripForm } from './components/TripForm';
import { Itinerary } from './components/Itinerary';

export default function App() {
  const [input, setInput] = useState(defaultInput);
  const [trip, setTrip] = useState(() => plan(defaultInput));
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [planId, setPlanId] = useState<string | undefined>();
  const [generation, setGeneration] = useState<GeneratedTrip['generation']>({ mode: 'demo', reason: 'not_configured', catalogVersion: '2026-10-09-v1' });
  const generate = async () => { setBusy(true); setStatus('Planning your trip…'); try { const value = await api.generate(input); setTrip(value.trip); setPlanId(value.planId); setGeneration(value.generation); setStatus(value.generation.reason === 'provider_unavailable' ? 'AI is unavailable. Your trip uses the curated demo planner.' : ''); } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not plan this trip.'); } finally { setBusy(false); } };
  const save = async () => { setBusy(true); setStatus('Saving your trip…'); try { const value = await api.save(trip, planId); setTrip(value.trip); setGeneration(value.generation); setPlanId(value.id); setStatus('Saved to your account.'); } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not save this trip.'); } finally { setBusy(false); } };
  const restore = async () => { setBusy(true); setStatus('Loading your trip…'); try { const value = await api.list(); const cloud = value.trips[0]; if (cloud) { setInput(cloud.trip); setTrip(cloud.trip); setPlanId(cloud.id); setGeneration(cloud.generation); setStatus('Saved trip restored from your account.'); return; } const saved = restoreTrip(); if (!saved) { setStatus('No saved trip yet. Plan one and select Save this trip.'); return; } setInput(saved); setTrip(saved); setPlanId(undefined); setGeneration({ mode: 'demo', reason: 'not_configured', catalogVersion: '2026-10-09-v1' }); setStatus('Previous browser trip restored. Save it to move it to your account.'); } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not restore the saved trip.'); } finally { setBusy(false); } };
  const download = () => { try { downloadTrip(trip); setStatus('Trip downloaded as JSON.'); } catch { setStatus('Could not download this trip. Please try again.'); } };
  return <>
    <header><a className="logo" href="./">✳ TripPilot<span>AI</span></a><span className="tag">THE JOURNEY STARTS HERE</span><button type="button" disabled={busy} onClick={restore}>My saved trip</button></header>
    <main>
      <section className="intro"><div className="eyebrow">LESS PLANNING. MORE WANDERING.</div><h1>Your next escape,<br /><em>beautifully planned.</em></h1><p>A little direction for your next big adventure. Pick a place, set your pace, and make every day count.</p><div className="pills"><span>↗ Your kind of adventure</span><span>₹ A budget that fits</span><span>◷ Every day, mapped out</span></div></section>
      <div className="workspace"><TripForm input={input} onChange={setInput} onSubmit={generate} busy={busy} /><Itinerary trip={trip} status={status} onSave={save} onDownload={download} busy={busy} mode={generation.mode} /></div>
      <footer>Thoughtfully planned. Freely explored.<span>TripPilot AI / Portfolio prototype / 2026</span></footer>
    </main>
  </>;
}
