import { IntegratedScene, IntegratedRivalPortrait, SoundControls, useLivePresentation } from './battle-v2/Live.tsx';
import { bindAudioGestures } from './battle-v2/audio.ts';
import { preloadSample } from './battle-v2/loading.ts';
import type { RivalBody } from './battle-v2/art.ts';
import './production.css';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { RoomSnapshot } from '../shared/types.ts';
import { BattleStage, RivalPortrait } from './BattleStage.tsx';
import { Chamber } from './Chamber.tsx';


type MotionPreference = 'system' | 'reduced' | 'full';
function readMotion(): MotionPreference {
  try { const value = localStorage.getItem('mm.motion.v1'); return value === 'reduced' || value === 'full' ? value : 'system'; } catch { return 'system'; }
}
export function Presentation({ room, connected, displayOnly, children, specimens, now = Date.now() }: { room: RoomSnapshot | null; connected: boolean; displayOnly: boolean; children: ReactNode; specimens?: ReactNode; now?: number }) {
  const [preference, setPreference] = useState<MotionPreference>(readMotion);
  const [systemReduced, setSystemReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [paused, setPaused] = useState(false);
  const [notice, setNotice] = useState('');
  const panel = useRef<HTMLDivElement>(null);
  const previousRoom = useRef(room?.roomId);
  const live=useLivePresentation(room,now,connected);
  const fullscreen=Boolean(room&&['release','battle'].includes(room.phase));
  const integrated=Boolean(room?.battlePresentation&&room.rival&&['release','battle','autopsy','session-results'].includes(room.phase));
  const motion = !live.hidden && !paused && (preference === 'full' || (preference === 'system' && !systemReduced));
  useEffect(()=>{if(room?.rival&&room.battlePresentationVersion&&room.phase==='briefing')void preloadSample(false,null,room.rival.id as RivalBody,null);},[room?.rival?.id,room?.phase,room?.battlePresentationVersion]);
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
  useEffect(()=>{if(room&&['experiment','release','battle','autopsy','session-results'].includes(room.phase))window.scrollTo({top:0,behavior:'instant'});},[room?.phase]);
  function changeMotion(value: MotionPreference) {
    setPreference(value);
    try { localStorage.setItem('mm.motion.v1', value); setNotice(''); }
    catch { setNotice('Motion preference applies now, but could not be saved on this device.'); }
  }
  useEffect(()=>bindAudioGestures(live.audio,live.setSound),[live.audio,live.setSound]);
  return <main data-motion={motion} className={`${fullscreen?'arena-fullscreen ':''}${room&&['autopsy','session-results'].includes(room.phase)?'results-layout ':''}laboratory-shell${displayOnly ? ' display-layout' : ''}${room?.phase==='experiment'?' experiment-layout':''}`}>
    <a className="skip-link" href="#laboratory-controls">Skip to laboratory controls</a>
    <header className="masthead">
      <div><p className="eyebrow">Institute of questionable outcomes</p><h1>Monstrum <em>Mortis</em></h1><p className="tagline">One creature. Many accomplices.</p></div>
      <span className="milestone-seal">{displayOnly ? 'Shared display' : 'Cooperative laboratory'}<small>2–8 scientists</small></span>
    </header>
    <div className="laboratory-layout">
      <section className="scene-panel" aria-label={room?.battle?'Automatic battle stage':'Containment chamber'}>
        <div className="scene-heading"><span className="eyebrow">{room?.battle?'Trial arena / specimen exchange':room?.creatureName??'Containment vessel / 01'}</span><span className={`connection-badge ${connected ? 'online' : ''}`}>{room ? (connected ? '● Connected' : '○ Awaiting synchronization') : 'Awaiting scientists'}</span></div>
        <div className="accepted-injection" data-pulse={live.accent&&motion} hidden={Boolean(room?.battle)||integrated}><Chamber creature={room?.creature ?? null} motion={motion && !room?.battle && !integrated} /></div>
        {(room?.phase==='briefing'||room?.phase==='lobby')&&room?.rival&&<aside className="rival-briefing" aria-label="Rival briefing">{room.battlePresentationVersion?<IntegratedRivalPortrait id={room.rival.id} name={room.rival.name}/>:<RivalPortrait assetId={room.rival.assetId} name={room.rival.name} silhouette />}<div><h2>{room.rival.name}</h2><p><strong>Strength:</strong> {room.rival.strength}</p><p><strong>Weakness:</strong> {room.rival.weakness}</p></div></aside>}
        {integrated&&room&&<IntegratedScene room={room} now={live.now} motion={motion} connected={connected}/>}
        {room?.battle&&!integrated&&<BattleStage room={room} now={live.now} motion={motion} connected={connected} />}
        {room?.readings && !room.battle && !integrated && <dl className="creature-readings" aria-label="Approximate creature readings">{Object.entries(room.readings).map(([name, band]) => <div key={name}><dt>{name}</dt><dd>{band}</dd></div>)}</dl>}
        {room?.phase==='experiment'&&room.mutations&&room.mutations.length>0&&<p className="mutation-caption" role="status">{room.mutations.filter(m=>now-m.atMs<3000).slice(-2).map(m=>`${m.alias}: ${m.name}`).join(' · ')}</p>}
        {!room&&<p className="institutional-note">A promising departure from established anatomy.</p>}
      </section>
      {specimens&&<aside className="specimen-column">{specimens}</aside>}
      <div className="control-panel" id="laboratory-controls" role="region" aria-label="Laboratory controls" tabIndex={displayOnly ? 0 : -1} ref={panel}>{children}</div>
    </div>
    <footer className="laboratory-footer">
      <button className="sound-toggle" aria-pressed={live.muted} onClick={()=>{const value=!live.muted;live.setMuted(value);live.audio.set(value,live.volume);}}>{live.muted?'Sound muted':'Sound on'}</button>
      <details className="settings"><summary><span className="settings-full">Sound & motion settings</span><span className="settings-short">Settings</span></summary><SoundControls state={live}/><label>Creature and laboratory motion<select value={preference} onChange={e => changeMotion(e.target.value as MotionPreference)}><option value="system">Follow device preference</option><option value="reduced">Reduced motion</option><option value="full">Full motion</option></select></label><button aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? 'Resume decorative animation' : 'Pause decorative animation'}</button><p className="note">Motion is decorative. Every room action and status remains available when it is paused.</p>{notice && <p role="status">{notice}</p>}</details>

    </footer>
    <p className="sr-only" role="status">{room ? `Laboratory phase: ${room.phase}. ${connected ? 'Connected.' : 'Awaiting synchronization.'}` : 'Find a laboratory.'}</p>
  </main>;
}
