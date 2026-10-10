'use client';
import { useState } from 'react';
import { BookmarkSimple, Mountains } from '@phosphor-icons/react';
import { defaultInput, plan, slots } from './planner';
import { downloadTrip, restoreTrip } from './storage';
import * as api from './api';
import type { GeneratedTrip } from '../server/ai';
import { TripForm } from './components/TripForm';
import { TripPass } from './components/TripPass';
import { Itinerary } from './components/Itinerary';

export default function App() {
  const [input, setInput] = useState(defaultInput);
  const [trip, setTrip] = useState(() => plan(defaultInput));
  const [customized, setCustomized] = useState(false);
  const [passOpen, setPassOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [planId, setPlanId] = useState<string | undefined>();
  const [generation, setGeneration] = useState<GeneratedTrip['generation']>({ mode: 'demo', reason: 'not_configured', catalogVersion: '2026-10-09-v1' });
  const generate = async () => { setBusy(true); setStatus('Planning your trip…'); try { const value = await api.generate(input); setTrip(value.trip); setCustomized(false); setRevision(r => r + 1); setPlanId(value.planId); setGeneration(value.generation); setStatus(value.generation.reason === 'provider_unavailable' ? 'AI is unavailable. Your trip uses the curated demo planner.' : ''); } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not plan this trip.'); } finally { setBusy(false); } };
  const save = async () => { setBusy(true); setStatus('Saving your trip…'); try { const value = await api.save(trip, planId, customized ? trip.itinerary.map(day => slots.map(slot => day[slot])) : undefined); setTrip(value.trip); setGeneration(value.generation); setPlanId(value.id); setCustomized(false); setStatus('Saved to your account.'); } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not save this trip.'); } finally { setBusy(false); } };
  const restore = async () => { setBusy(true); setStatus('Loading your trip…'); try { const value = await api.list(); const cloud = value.trips[0]; if (cloud) { setCustomized(false); setRevision(r => r + 1); setInput(cloud.trip); setTrip(cloud.trip); setPlanId(cloud.id); setGeneration(cloud.generation); setStatus('Saved trip restored from your account.'); return; } const saved = restoreTrip(); if (!saved) { setStatus('No saved trip yet. Plan one and select Save this trip.'); return; } setCustomized(false); setRevision(r => r + 1); setInput(saved); setTrip(saved); setPlanId(undefined); setGeneration({ mode: 'demo', reason: 'not_configured', catalogVersion: '2026-10-09-v1' }); setStatus('Previous browser trip restored. Save it to move it to your account.'); } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not restore the saved trip.'); } finally { setBusy(false); } };
  const download = () => { try { downloadTrip(trip); setStatus('Trip downloaded as JSON.'); } catch { setStatus('Could not download this trip. Please try again.'); } };
  return <div className="app-shell" data-mood={input.style}>
    <a href="#trip-settings" className="skip-link">Skip to trip settings</a>
    <header><a className="logo" href="./"><Mountains weight="bold" size={34} aria-hidden="true" />TripPilot AI</a><span className="mode-label">{generation.mode === 'ai' ? 'AI curated' : 'Demo mode'}</span><button className="saved-link" type="button" disabled={busy} onClick={restore}><BookmarkSimple size={23} aria-hidden="true" /><span>My saved trip</span></button></header>
    <main>
      <section className="intro" aria-label="Plan your next escape"><p className="eyebrow">A little direction. A lot of possibility.</p><h1>Your next escape.</h1><p>Choose a place. We’ll take care of the plan.</p></section>
      <div id="trip-settings"><TripForm input={input} onChange={setInput} onSubmit={generate} busy={busy} /></div>
      <Itinerary key={revision} trip={trip} onEdit={next => { setTrip(next); setCustomized(true); setStatus('Itinerary updated. Save to keep your changes.'); }} edited={customized || generation.edited} onPass={() => setPassOpen(true)} status={status} onSave={save} onDownload={download} busy={busy} mode={generation.mode} />
      <footer>Made for the journey.</footer>
    </main>
    {passOpen && <TripPass trip={trip} onClose={() => setPassOpen(false)} />}
  </div>;
}
