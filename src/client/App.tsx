import { clientId } from './random-id.ts';
import { QuickPlay, guestHeaders } from './QuickPlay.tsx';
import { DnaController } from './DnaController.tsx';
import { Results } from './Results.tsx';
import { Splash } from './Splash.tsx';
import { Presentation } from './Presentation.tsx';
import { useEffect, useRef, useState } from 'react';
import { PROTOCOL_VERSION, ROOM_SOCKET_PROTOCOL } from '../shared/protocol.ts';
import type { ClientAction, ServerMessage } from '../shared/protocol.ts';
import type { RoomCredentials, RoomEntryResponse } from '../shared/room-service.ts';
import type { ControllerSnapshot, RoomSnapshot } from '../shared/types.ts';

const STORAGE_KEY = 'mm.room.v6';
const ACTION_KEY = 'mm.pending-intent.v6';
function storedIntent(credentials: RoomCredentials | null): ClientAction | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(ACTION_KEY) ?? 'null');
    return saved?.roomId === credentials?.roomId && saved?.sessionId === credentials?.sessionId && saved?.action?.protocolVersion === PROTOCOL_VERSION && ['inject', 'pull-switch', 'start-now', 'next-round-ready', 'public-replay-opt-in', 'leave'].includes(saved?.action?.kind) ? saved.action : null;
  } catch { return null; }
}
function storedCredentials(): RoomCredentials | null {
  try {
    const raw = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
    return raw && typeof raw.roomId === 'string' && typeof raw.reconnectToken === 'string' ? raw : null;
  } catch { return null; }
}
/** Existing authoritative service controls within the step 4 presentation. */
export function App() {
  const [credentials, setCredentials] = useState<RoomCredentials | null>(storedCredentials);
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [own, setOwn] = useState<ControllerSnapshot | null>(null);
  const [status, setStatus] = useState('');
  const [storageNotice, setStorageNotice] = useState('');
  const [connected, setConnected] = useState(false);
  const [pending, setPending] = useState(() => storedIntent(credentials) !== null);
  const [replace, setReplace] = useState(false);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const serverOffset = useRef(0);
  const socket = useRef<WebSocket | null>(null);
  const pendingAction = useRef<ClientAction | null>(storedIntent(credentials));
  const pendingSent = useRef<string | null>(null);
  const acceptedRevision = useRef<number | null>(null);

  function remember(value: RoomCredentials | null) {
    try { value ? sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value)) : sessionStorage.removeItem(STORAGE_KEY); }
    catch { setStorageNotice('Browser storage unavailable; reloading will lose this reconnect credential.'); }
    if (!value) clearPending();
    setCredentials(value);
  }
  function clearPending() {
    pendingAction.current = null; pendingSent.current = null; acceptedRevision.current = null; setPending(false);
    try { sessionStorage.removeItem(ACTION_KEY); } catch { setStorageNotice('Pending action storage could not be cleared. Reconnection still checks its receipt.'); }
  }
  function synchronizeClock(serverTime:number) {
    if(!Number.isFinite(serverTime))return;
    serverOffset.current=serverTime-Date.now();setClock(Date.now());
  }
  function receive(message: ServerMessage) {
    synchronizeClock(message.serverTimeMs);
    if (message.kind === 'room-snapshot') {
      setRoom(previous => !previous || message.snapshot.revision >= previous.revision ? message.snapshot : previous);
      const action = pendingAction.current;
      if (action && (action.kind === 'inject' || action.kind === 'pull-switch') && action.attemptId !== message.snapshot.attemptId) {
        clearPending(); setStatus('The experiment changed. Select a specimen from the new tray.');
      } else if (action && pendingSent.current !== action.actionId && socket.current?.readyState === WebSocket.OPEN) {
        // Initial public synchronization precedes replay; keep the exact ID and payload.
        pendingSent.current = action.actionId; socket.current.send(JSON.stringify(action));
      }
    }
    if (message.kind === 'controller-snapshot') {
      setOwn(previous => !previous || message.snapshot.revision >= previous.revision ? message.snapshot : previous);
      if (acceptedRevision.current !== null && message.snapshot.revision >= acceptedRevision.current) clearPending();
    }
    if (message.kind === 'action-rejected' || message.kind === 'action-accepted') {
      if (pendingAction.current?.actionId !== message.actionId) return;
      const action = pendingAction.current;
      const leaving = action.kind === 'leave';
      if (message.kind === 'action-rejected') { clearPending(); setStatus(`${message.code}: ${message.message}`); }
      else {
        if (action.kind === 'inject' || action.kind === 'pull-switch') acceptedRevision.current = message.revision;
        else clearPending();
        if (leaving) { remember(null); setRoom(null); setOwn(null); setStatus('You left the laboratory.'); }
        else setStatus('');
      }
    }
  }
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!credentials) return;
    let disposed = false; let reconnectTimer: ReturnType<typeof setTimeout> | undefined; let pingTimer: ReturnType<typeof setInterval> | undefined;
    let lastReply = Date.now();
    const url = new URL(`/api/rooms/${credentials.roomId}/socket`, location.href);
    url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    if (replace) url.searchParams.set('replace', '1');
    const ws = new WebSocket(url, [ROOM_SOCKET_PROTOCOL, `token.${credentials.reconnectToken}`]); socket.current = ws;
    setStatus('Connecting to the authoritative room…'); setConnected(false);
    ws.onopen = () => {
      if (disposed) return;
      setConnected(true); setStatus('');
      pendingSent.current = null;
      pingTimer = setInterval(() => {
        if (Date.now() - lastReply > 55_000) { ws.close(); return; }
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, 20_000);
    };
    ws.onmessage = event => {
      if (disposed) return; lastReply = Date.now();
      if (event.data === 'pong') return;
      try { receive(JSON.parse(event.data) as ServerMessage); } catch { setStatus('Invalid server response. Reconnect to synchronize.'); }
    };
    ws.onerror = () => { if (!disposed) setStatus('Connection failed. Reconnect, or confirm replacement if this seat is open elsewhere.'); };
    ws.onclose = event => {
      if (pingTimer) clearInterval(pingTimer);
      if (disposed) return;
      setConnected(false); pendingSent.current = null;
      if(event.code===4002&&pendingAction.current?.kind==='leave'){remember(null);setRoom(null);setOwn(null);setStatus('');return;}
      if (event.code !== 4001 && event.code !== 4002 && event.code !== 1000) {
        void fetch(`/api/rooms/${credentials.roomId}/snapshot`,{headers:{Authorization:`Bearer ${credentials.reconnectToken}`}}).then(r=>{if(disposed)return;if([401,404,409,410].includes(r.status)){remember(null);setRoom(null);setOwn(null);setStatus('Your previous session expired.');}else reconnectTimer=setTimeout(()=>setConnectionAttempt(n=>n+1),3000);}).catch(()=>{if(!disposed)reconnectTimer=setTimeout(()=>setConnectionAttempt(n=>n+1),5000);});
      }
      setStatus(event.code === 4001 ? 'This seat connected on another device.' : `Disconnected${event.reason ? `: ${event.reason}` : '. Reconnect to keep your seat.'}`);
    };
    return () => { disposed = true; if (reconnectTimer) clearTimeout(reconnectTimer); if (pingTimer) clearInterval(pingTimer); ws.close(); socket.current = null; };
  // Credentials and explicit reconnect control the transport; event handlers only use refs or functional setters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credentials, connectionAttempt]);

  function sendIntent(action: ClientAction) {
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN || pendingAction.current) return;
    pendingAction.current = action; pendingSent.current = action.actionId; acceptedRevision.current = null; setPending(true);
    if (credentials) {
      try { sessionStorage.setItem(ACTION_KEY, JSON.stringify({ roomId: credentials.roomId, sessionId: credentials.sessionId, action })); }
      catch { setStorageNotice('Pending intention could not be saved. Keep this tab open to retry its exact action after reconnection.'); }
    }
    socket.current.send(JSON.stringify(action));
  }
  function intent(kind:'start-now'|'leave'|'next-round-ready'|'public-replay-opt-in') {sendIntent({protocolVersion:PROTOCOL_VERSION,actionId:clientId(),kind});}
  async function leaveDisconnected(){if(!credentials)return;setPending(true);try{const r=await fetch(`/api/rooms/${credentials.roomId}/leave`,{method:'POST',headers:guestHeaders()});if(!r.ok&&![401,404,410].includes(r.status))throw new Error('Could not leave. Retry.');remember(null);setRoom(null);setOwn(null);setStatus('');}catch(e){setStatus(String(e));}finally{setPending(false);}}
  useEffect(()=>{try{if(sessionStorage.getItem('mm.room.v2'))setStorageNotice('Your previous laboratory session expired. Choose a new laboratory.');}catch{}for(const key of ['mm.room.v2','mm.pending-intent.v5','mm.queue.v3']){try{sessionStorage.removeItem(key);}catch{}}},[]);
  function mechanics(kind: 'inject' | 'pull-switch', specimenId?: string) {
    if (!room?.attemptId) return;
    const envelope = { protocolVersion: PROTOCOL_VERSION, actionId: clientId(), attemptId: room.attemptId };
    sendIntent(kind === 'inject' ? { ...envelope, kind, specimenId: specimenId! } : { ...envelope, kind });
  }
  const now=clock+serverOffset.current;
  const remaining=room?.phaseDeadlineMs?Math.max(0,Math.ceil((room.phaseDeadlineMs-now)/1000)):null;
  const dna=room?.phase==='experiment'&&own?<DnaController room={room} own={own} connected={connected&&own.attemptId===room.attemptId&&own.revision>=room.revision} pending={pending} now={now} inject={id=>mechanics('inject',id)} unleash={()=>mechanics('pull-switch')}/>:null;
  const full=room&&['release','battle'].includes(room.phase);
  return <><Splash recovering={Boolean(credentials)}/><Presentation now={now} room={room} connected={connected} displayOnly={false} specimens={dna}>
   {!credentials?<QuickPlay onEntry={entry=>{synchronizeClock(entry.snapshot.serverTimeMs);setRoom(entry.snapshot);setOwn(entry.controller);setReplace(false);remember(entry.credentials);setStorageNotice('');setStatus('');}}/>:<section className="room-panel">
    {!full&&<>
     <h2 tabIndex={-1}>{room?.laboratoryName??'Your laboratory'}</h2>
     {room?.phase==='lobby'&&<div className="formation-panel"><p className="formation-countdown" role="timer">{remaining===null?'Awaiting scientists':remaining<=3?remaining:`Starting in ${remaining}s`}</p><button disabled={!connected||pending||room.formation?.locked||room.formation?.votes.includes(credentials.sessionId)||room.players.filter(p=>p.connected).length<2} onClick={()=>intent('start-now')}>{room.formation?.votes.includes(credentials.sessionId)?'Voted to start':'Start now'}{room.formation?` · ${room.formation.votes.length}/${Math.floor(room.players.filter(p=>p.connected).length/2)+1}`:''}</button></div>}
     {room?.result&&<Results room={room} playerId={credentials.sessionId}/>}
     {room?.publicSession&&['autopsy','session-results'].includes(room.phase)&&<div className="results-actions">
      {room.phase==='autopsy'?<button disabled={!connected||pending||room.publicSession.readyPlayerIds.includes(credentials.sessionId)} onClick={()=>intent('next-round-ready')}>{room.publicSession.readyPlayerIds.includes(credentials.sessionId)?'Ready for next experiment':'Next experiment'}</button>:<button disabled={!connected||pending||room.phaseDeadlineMs===null||room.publicSession.replayPlayerIds.includes(credentials.sessionId)||room.players.filter(p=>p.connected).length<2} onClick={()=>intent('public-replay-opt-in')}>{room.publicSession.replayPlayerIds.includes(credentials.sessionId)?'Waiting for accomplices':'Play again together'}</button>}
     </div>}
     {room&&<><h3>Accomplices <small>{room.players.length}/8</small></h3><ul className="roster" aria-label="Accomplices">{room.players.map(p=><li key={p.playerId}><span className="player-symbol" aria-hidden="true">{p.symbol}</span><span>{p.alias}<small>{!p.connected?'Reconnecting':p.finishedThisRound?'Finished':room.phase==='experiment'?`${p.injectionsThisRound} injections`:'Ready'}</small></span></li>)}</ul></>}
     {room?.mutations?.length?<details className="mutation-details"><summary>Mutation record</summary><ol>{room.mutations.map(m=><li key={m.injectionId}>{m.alias}: {m.name} ({m.status})</li>)}</ol></details>:null}
    </>}
    {!connected&&<div className="connection-recovery"><p role="status">{status||'Reconnecting…'}</p><label className="checkbox"><input type="checkbox" checked={replace} onChange={e=>setReplace(e.target.checked)}/>Replace connection open elsewhere</label><button onClick={()=>setConnectionAttempt(n=>n+1)}>Reconnect</button><button onClick={async()=>{if(!credentials)return;try{const r=await fetch(`/api/rooms/${credentials.roomId}/snapshot`,{headers:{Authorization:`Bearer ${credentials.reconnectToken}`}});if([401,404,409,410].includes(r.status)){remember(null);setRoom(null);setOwn(null);setStatus('Your previous session expired.');}else setStatus('Your seat is still available. Reconnect to continue.');}catch{setStatus('Network unavailable. Retry when connected.');}}}>Check session</button></div>}
    <button className="leave-lab" disabled={pending} onClick={()=>connected?intent('leave'):void leaveDisconnected()}>Leave laboratory</button>
   </section>}
   {connected&&status&&<p role="alert">{status}</p>}{pending&&<span className="sr-only" role="status">Waiting for confirmation</span>}{storageNotice&&<p role="alert">{storageNotice}</p>}
  </Presentation></>;
}
