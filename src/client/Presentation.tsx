import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { RoomSnapshot } from '../shared/types.ts';
import { Chamber } from './Chamber.tsx';

type MotionPreference = 'system' | 'reduced' | 'full';
function readMotion(): MotionPreference {
  try { const value = localStorage.getItem('mm.motion.v1'); return value === 'reduced' || value === 'full' ? value : 'system'; } catch { return 'system'; }
}
export function Presentation({ room, connected, displayOnly, children }: { room: RoomSnapshot | null; connected: boolean; displayOnly: boolean; children: ReactNode }) {
  const [preference, setPreference] = useState<MotionPreference>(readMotion);
  const [systemReduced, setSystemReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [paused, setPaused] = useState(false);
  const [notice, setNotice] = useState('');
  const panel = useRef<HTMLDivElement>(null);
  const previousRoom = useRef(room?.roomId);
  const motion = !paused && (preference === 'full' || (preference === 'system' && !systemReduced));
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setSystemReduced(query.matches);
    query.addEventListener('change', update); return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (previousRoom.current !== room?.roomId) {
      previousRoom.current = room?.roomId;
      panel.current?.querySelector<HTMLElement>('h2')?.focus();
    }
  }, [room?.roomId]);
  function changeMotion(value: MotionPreference) {
    setPreference(value);
    try { localStorage.setItem('mm.motion.v1', value); setNotice(''); }
    catch { setNotice('Motion preference applies now, but could not be saved on this device.'); }
  }
  return <main className={`laboratory-shell${displayOnly ? ' display-layout' : ''}`}>
    <a className="skip-link" href="#laboratory-controls">Skip to laboratory controls</a>
    <header className="masthead">
      <div><p className="eyebrow">Institute of questionable outcomes</p><h1>Monstrum <em>Mortis</em></h1><p className="tagline">One creature. Many accomplices.</p></div>
      <span className="milestone-seal">{displayOnly ? 'Shared display' : 'Cooperative laboratory'}<small>2–8 players · invitations & Quick Play</small></span>
    </header>
    <div className="laboratory-layout">
      <section className="scene-panel" aria-label="Containment chamber">
        <div className="scene-heading"><span className="eyebrow">Containment vessel / 01</span><span className={`connection-badge ${connected ? 'online' : ''}`}>{room ? (connected ? '● Connected' : '○ Awaiting synchronization') : '○ Awaiting laboratory'}</span></div>
        <Chamber creature={room?.creature ?? null} motion={motion} />
        {room?.readings && <dl className="creature-readings" aria-label="Approximate creature readings">{Object.entries(room.readings).map(([name, band]) => <div key={name}><dt>{name}</dt><dd>{band}</dd></div>)}</dl>}
        {room?.mutations && room.mutations.length > 0 && <section className="mutation-log" tabIndex={0} aria-label="Accepted mutations"><h2>Mutation record</h2><ol>{room.mutations.map(m => <li key={m.injectionId}><strong>{m.alias}</strong>: {m.name} <span>({m.change}; {m.status})</span></li>)}</ol><p className="sr-only" role="status">{room.mutations.slice(-3).map(m => `${m.alias}: ${m.name}, ${m.change}.`).join(' ')}</p></section>}
        <p className="institutional-note">The committee considers this a promising number of limbs.</p>
      </section>
      <div className="control-panel" id="laboratory-controls" role="region" aria-label="Laboratory controls" tabIndex={displayOnly ? 0 : -1} ref={panel}>{children}</div>
    </div>
    <footer className="laboratory-footer">
      <details className="settings"><summary>Display & motion settings</summary><label>Creature and laboratory motion<select value={preference} onChange={e => changeMotion(e.target.value as MotionPreference)}><option value="system">Follow device preference</option><option value="reduced">Reduced motion</option><option value="full">Full motion</option></select></label><button aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? 'Resume decorative animation' : 'Pause decorative animation'}</button><p className="note">Motion is decorative. Every room action and status remains available when it is paused.</p>{notice && <p role="status">{notice}</p>}</details>
      <p className="availability-note">Laboratory presentation and DNA mechanics are available. Automatic combat is coming in a later milestone.</p>
    </footer>
    <p className="sr-only" role="status">{room ? `Laboratory phase: ${room.phase}. ${connected ? 'Connected.' : 'Awaiting synchronization.'}` : 'Choose Quick Play or a private invitation.'}</p>
  </main>;
}
