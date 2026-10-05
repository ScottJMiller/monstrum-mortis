import { useState } from 'react';
import type { HealthResponse } from '../shared/types.ts';

/** Step 1 diagnostic only. No pretend playable rooms or matchmaking. */
export function App() {
  const [status, setStatus] = useState('Not checked');
  const [checking, setChecking] = useState(false);

  async function checkConnection() {
    setChecking(true);
    try {
      const response = await fetch('/api/health', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const health: HealthResponse = await response.json();
      const complete = Object.values(health.configuredBindings).every(Boolean);
      setStatus(complete ? `Worker connected · rules ${health.rulesVersion}` : 'Worker connected; bindings missing');
    } catch {
      setStatus('Worker unavailable. Start npm run dev:worker in another terminal.');
    } finally {
      setChecking(false);
    }
  }

  return <main>
    <p className="eyebrow">Development foundation</p>
    <h1>Monstrum Mortis</h1>
    <p>Step 1 establishes the project and hosting configuration. The laboratory opens in the next implementation stages.</p>
    <button onClick={checkConnection} disabled={checking}>{checking ? 'Checking…' : 'Check Worker connection'}</button>
    <p role="status">{status}</p>
    <p className="note">This check confirms binding availability, not a working room or matchmaking service.</p>
  </main>;
}
