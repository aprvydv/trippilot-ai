import type { Metadata } from 'next';
import '../src/style.css';
export const metadata: Metadata = { title: 'TripPilot AI · Make room for the journey', description: 'A grounded travel planner with private saved trips.' };
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
