import { QuickPlay, guestHeaders } from './QuickPlay.tsx';
import { DnaController } from './DnaController.tsx';
import { Results } from './Results.tsx';
import { Presentation } from './Presentation.tsx';
import { useEffect, useRef, useState } from 'react';
import { PROTOCOL_VERSION, ROOM_SOCKET_PROTOCOL } from '../shared/protocol.ts';
import type { ClientAction, ServerMessage } from '../shared/protocol.ts';
import type { RoomCredentials, RoomEntryResponse } from '../shared/room-service.ts';
import type { ControllerSnapshot, PresentationMode, RoomSnapshot } from '../shared/types.ts';

const STORAGE_KEY = 'mm.room.v2';
const ACTION_KEY = 'mm.pending-intent.v5';
function storedIntent(credentials: RoomCredentials | null): ClientAction | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(ACTION_KEY) ?? 'null');
    return saved?.roomId === credentials?.roomId && saved?.sessionId === credentials?.sessionId && saved?.action?.protocolVersion === PROTOCOL_VERSION && ['inject', 'pull-switch'].includes(saved?.action?.kind) ? saved.action : null;
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
  const [queueBusy, setQueueBusy] = useState(false);
  const [findNew, setFindNew] = useState(false);
  const findingNew = useRef(false);
  const [credentials, setCredentials] = useState<RoomCredentials | null>(storedCredentials);
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [own, setOwn] = useState<ControllerSnapshot | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState(new URLSearchParams(location.search).get('room') ?? '');
  const [display, setDisplay] = useState(new URLSearchParams(location.search).get('display') === '1');
  const [presentation, setPresentation] = useState<PresentationMode>('remote');
  const [status, setStatus] = useState('Enter a private laboratory.');
  const [storageNotice, setStorageNotice] = useState('');
  const [connected, setConnected] = useState(false);
  const [pending, setPending] = useState(() => storedIntent(credentials) !== null);
  const [replace, setReplace] = useState(false);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const serverOffset = useRef(0);
  const socket = useRef<WebSocket | null>(null);
  const entryKey = useRef<{ fingerprint: string; id: string } | null>(null);
  const displayKey = useRef<string | null>(null);
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
  function receive(message: ServerMessage) {
    serverOffset.current = message.serverTimeMs - Date.now();
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
        if (leaving) { remember(null); setRoom(null); setOwn(null); setFindNew(findingNew.current); findingNew.current = false; setStatus('You left the laboratory.'); }
        else setStatus(action.kind === 'inject' ? 'Injection accepted. Your shared specimen has mutated.' : action.kind === 'pull-switch' ? 'Switch pulled. Your injections have ended.' : 'Intent accepted by the server.');
      }
    }
  }
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!credentials) return;
    let disposed = false; let pingTimer: ReturnType<typeof setInterval> | undefined;
    let lastReply = Date.now();
    const url = new URL(`/api/rooms/${credentials.roomId}/socket`, location.href);
    url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    if (replace) url.searchParams.set('replace', '1');
    const ws = new WebSocket(url, [ROOM_SOCKET_PROTOCOL, `token.${credentials.reconnectToken}`]); socket.current = ws;
    setStatus('Connecting to the authoritative room…'); setConnected(false);
    ws.onopen = () => {
      if (disposed) return;
      setConnected(true); setStatus('Connected. Room state is synchronized.');
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
      setStatus(event.code === 4001 ? 'This seat connected on another device.' : `Disconnected${event.reason ? `: ${event.reason}` : '. Reconnect to keep your seat.'}`);
    };
    return () => { disposed = true; if (pingTimer) clearInterval(pingTimer); ws.close(); socket.current = null; };
  // Credentials and explicit reconnect control the transport; event handlers only use refs or functional setters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credentials, connectionAttempt]);

  async function enter(create: boolean) {
    setPending(true);
    const details = create ? { alias: name, presentation } : { alias: display ? 'Laboratory display' : name, role: display ? 'display' : 'player' };
    const path = create ? '/api/rooms/private' : `/api/rooms/${code.trim().toUpperCase()}/join`;
    const fingerprint = JSON.stringify([path, details]);
    if (entryKey.current?.fingerprint !== fingerprint) entryKey.current = { fingerprint, id: crypto.randomUUID() };
    try {
      const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...guestHeaders() }, body: JSON.stringify({ ...details, operationId: entryKey.current.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(`${data.code}: ${data.message}`);
      const entry = data as RoomEntryResponse;
      entryKey.current = null;
      setRoom(entry.snapshot); setOwn(entry.controller); setReplace(false); remember(entry.credentials);
      const address = new URL(location.href);
      address.searchParams.delete('room'); address.searchParams.delete('display');
      history.replaceState(history.state, '', `${address.pathname}${address.search}${address.hash}`);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Entry failed. Retry to use the same entry key.'); }
    finally { setPending(false); }
  }
  async function openPublicDisplay() {
    if (!credentials) return;
    const displayWindow = window.open('about:blank', '_blank');
    if (!displayWindow) { setStatus('Allow a new browser tab to open the shared display.'); return; }
    displayKey.current ??= crypto.randomUUID();
    try {
      const response = await fetch(`/api/rooms/${credentials.roomId}/display`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${credentials.reconnectToken}` }, body: JSON.stringify({ operationId: displayKey.current }) });
      const entry = await response.json() as RoomEntryResponse & { message?: string };
      if (!response.ok) throw new Error(entry.message ?? 'Display entry failed.');
      displayKey.current = null;
      displayWindow.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entry.credentials));
      displayWindow.opener = null; displayWindow.location.replace(location.origin);
    } catch (error) { displayWindow.close(); setStatus(String(error)); }
  }
  function sendIntent(action: ClientAction) {
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN || pendingAction.current) return;
    pendingAction.current = action; pendingSent.current = action.actionId; acceptedRevision.current = null; setPending(true);
    if (credentials && (action.kind === 'inject' || action.kind === 'pull-switch')) {
      try { sessionStorage.setItem(ACTION_KEY, JSON.stringify({ roomId: credentials.roomId, sessionId: credentials.sessionId, action })); }
      catch { setStorageNotice('Pending intention could not be saved. Keep this tab open to retry its exact action after reconnection.'); }
    }
    socket.current.send(JSON.stringify(action));
  }
  function intent(kind: 'start-private-session' | 'advance-private-round' | 'play-again-private' | 'leave' | 'next-round-ready' | 'public-replay-opt-in') {
    const base={protocolVersion:PROTOCOL_VERSION,actionId:crypto.randomUUID()};
    if(kind==='advance-private-round'){if(room?.result)sendIntent({...base,kind,battleId:room.result.battleId});}
    else if(kind==='play-again-private'){if(room?.session)sendIntent({...base,kind,sessionId:room.session.sessionId});}
    else sendIntent({...base,kind});
  }
  function mechanics(kind: 'inject' | 'pull-switch', specimenId?: string) {
    if (!room?.attemptId) return;
    const envelope = { protocolVersion: PROTOCOL_VERSION, actionId: crypto.randomUUID(), attemptId: room.attemptId };
    sendIntent(kind === 'inject' ? { ...envelope, kind, specimenId: specimenId! } : { ...envelope, kind });
  }
  const invitation = room?.visibility === 'private' ? `${location.origin}/?room=${room.roomId}` : '';
  const remaining = room?.phaseDeadlineMs ? Math.max(0, Math.ceil((room.phaseDeadlineMs - clock - serverOffset.current) / 1000)) : null;
  return <Presentation now={clock + serverOffset.current} room={room} connected={connected} displayOnly={credentials?.role === 'display'}>
    <div className="service-controls" aria-busy={pending}>
    {!credentials && <nav className="entry-jump" aria-label="Laboratory entry choices"><a href="#public-entry">Quick Play</a><a href="#private-entry">Private invitation</a></nav>}
    {!credentials ? <><QuickPlay autoStart={findNew} onBusy={setQueueBusy} onEntry={entry => { setFindNew(false); setRoom(entry.snapshot); setOwn(entry.controller); setReplace(false); remember(entry.credentials); }} /><section id="private-entry" className="entry-panel" aria-label="Private room entry"><p className="eyebrow">Invitation play</p><h2 tabIndex={-1}>Private laboratory</h2><p className="note">Bring friends by code or invitation link. Remote and shared-room play use the same rules.</p>
      <label>Player Name<input value={name} maxLength={24} onChange={event => setName(event.target.value)} autoComplete="nickname" aria-describedby="player-name-hint" className={!name.trim() && !display ? 'name-required' : undefined} /></label>
      <p id="player-name-hint" className={!name.trim() && !display ? 'entry-warning' : 'note'}>{!name.trim() ? (display ? 'Display devices can join without a player name. Creating a laboratory requires a player name.' : 'Enter your player name first to create or join a laboratory.') : 'This is your name in the player roster.'}</p>
      <label>Presentation<select value={presentation} onChange={event => setPresentation(event.target.value as PresentationMode)}><option value="remote">Remote</option><option value="same-room">Same-Room</option></select></label>
      <button disabled={pending || queueBusy || !name.trim()} onClick={() => enter(true)}>Create Private Laboratory</button>
      <label>Invitation code<input className="invitation-code" autoComplete="off" spellCheck={false} value={code} maxLength={6} onChange={event => setCode(event.target.value.toUpperCase())} autoCapitalize="characters" /></label>
      <label className="checkbox"><input type="checkbox" checked={display} onChange={event => setDisplay(event.target.checked)} /> Join as a display without a player seat</label>
      <button disabled={pending || queueBusy || code.trim().length !== 6 || (!display && !name.trim())} onClick={() => enter(false)}>Join by Code</button>
    </section></> : <section className="room-panel" aria-label="Laboratory room"><p className="eyebrow">{credentials.role === 'display' ? 'Viewing role · no player seat' : 'Your laboratory'}</p><h2 tabIndex={-1}>{room?.visibility === 'public' ? 'Public laboratory' : 'Private laboratory'}</h2>
      <p>Room <strong>{credentials.roomId}</strong> · {credentials.role} · {connected ? 'online' : 'offline'}</p>
      {invitation && credentials.role === 'player' && <label>Player invitation link<input readOnly value={invitation} onFocus={event => event.target.select()} /></label>}
      {room?.visibility === 'public' && credentials.role === 'player' && <button disabled={pending || !connected} onClick={openPublicDisplay}>Open shared display</button>}
      {invitation && credentials.role === 'player' && <p><a href={`${invitation}&display=1`} target="_blank" rel="noreferrer">Open shared display</a></p>}
      {room && <>
        <div className="phase-strip"><p>Phase: <strong>{room.phase}</strong></p>{remaining !== null && <p className="deadline">{connected ? `${remaining}s remaining` : 'Timer awaiting synchronization'}</p>}</div>
        {room.recoveryDeadlineMs && <p>Experiment suspended for reconnection. Recovery deadline: {new Date(room.recoveryDeadlineMs).toLocaleTimeString()}.</p>}
        {room.phase === 'release' && <h3>Creature released. Prepare for combat!</h3>}
        {room.phase === 'battle' && !room.battle && <div className="combat-boundary"><h3>Creature released. Prepare for combat!</h3><p>This specimen was released before combat was introduced. Its frozen boundary is preserved. A private host can start a new combat session below; public players can leave and choose Quick Play again.</p></div>}
        {room.result&&<Results room={room} playerId={credentials.role==='player'?credentials.sessionId:null} />}
        {room.visibility==='private'&&credentials.sessionId===room.hostPlayerId&&room.phase==='autopsy'&&<button disabled={!connected||pending||room.players.filter(p=>p.connected).length<2} onClick={()=>intent('advance-private-round')}>Next experiment</button>}
        {room.visibility==='private'&&credentials.sessionId===room.hostPlayerId&&room.phase==='session-results'&&<button disabled={!connected||pending||room.players.filter(p=>p.connected).length<2} onClick={()=>intent('play-again-private')}>Play Again</button>}
        {room.visibility==='private'&&!room.combatAvailable&&room.phase==='battle'&&credentials.sessionId===room.hostPlayerId&&<button disabled={!connected||pending||room.players.filter(p=>p.connected).length<2} onClick={()=>intent('start-private-session')}>Start new combat session</button>}
        <h3>Accomplices <small>{room.players.length}/8</small></h3><ul className="roster">{room.players.map(player => <li key={player.playerId}><span className="player-symbol" aria-hidden="true">{player.symbol}</span><span>{player.alias}<small>{player.connected ? 'Connected' : 'Disconnected'}{player.playerId === room.hostPlayerId ? ' · host' : ''}{player.waitingForNextRound ? ' · waiting for next round' : ''}{player.finishedThisRound ? (player.completionReason === 'switch' ? ' · switch pulled' : ' · finished') : ''}{room.mechanicsAvailable && !player.waitingForNextRound ? ` · ${player.injectionsThisRound} injections${connected && (player.cooldownUntilMs ?? 0) > clock + serverOffset.current && !player.finishedThisRound ? ' · cooling down' : ''}` : ''}</small></span></li>)}</ul>
        {room.publicSession && <>
          {room.players.find(p => p.playerId === credentials.sessionId)?.inactivityPrompt && <p>You made no injections this round. Choose Next round ready to keep your seat.</p>}
          <p>Team score: {room.teamScore} · {room.publicSession.completedRounds} completed rounds. This laboratory’s score includes earlier rounds; your contribution starts when you join.</p>
          {credentials.role === 'player' && ['autopsy', 'recovery-lobby'].includes(room.phase) && <button disabled={!connected || pending || room.publicSession.readyPlayerIds.includes(credentials.sessionId)} onClick={() => intent('next-round-ready')}>Next round ready</button>}
          {credentials.role === 'player' && room.phase === 'session-results' && room.phaseDeadlineMs !== null && <button disabled={!connected || pending || room.publicSession.replayPlayerIds.includes(credentials.sessionId)} onClick={() => intent('public-replay-opt-in')}>Stay for a new session</button>}
          {credentials.role === 'player' && ['autopsy', 'session-results', 'recovery-lobby'].includes(room.phase) && <button disabled={!connected || pending} onClick={() => { findingNew.current = true; intent('leave'); }}>Find New Laboratory</button>}
          {room.phase === 'recovery-lobby' && <p>The interrupted round was abandoned. Completed results remain; two ready players can retry this round.</p>}
          {room.phase === 'session-results' && room.phaseDeadlineMs === null && <p>Regroup has ended. Leave or choose Find New Laboratory when you are ready.</p>}
        </>}
        {own && room.mechanicsAvailable && room.phase === 'experiment' && <DnaController room={room} own={own} connected={connected && own.attemptId === room.attemptId && own.revision >= room.revision} pending={pending} now={clock + serverOffset.current} inject={id => mechanics('inject', id)} unleash={() => mechanics('pull-switch')} />}
        {own && !room.mechanicsAvailable && room.phase !== 'lobby' && <p>This existing laboratory attempt predates DNA mechanics. It retains its original timeline; start a new laboratory to inject specimens.</p>}
        {credentials.sessionId === room.hostPlayerId && room.phase === 'lobby' && <button disabled={!connected || pending || room.players.filter(p => p.connected).length < 2} onClick={() => intent('start-private-session')}>Start experiment</button>}
      </>}
      {!connected && <>
        <label className="checkbox"><input type="checkbox" checked={replace} onChange={event => setReplace(event.target.checked)} /> Confirm replacement of this seat's existing connection</label>
        <button onClick={() => setConnectionAttempt(value => value + 1)}>Reconnect</button>
      </>}
      <button disabled={!connected || pending} onClick={() => intent('leave')}>Leave laboratory</button>
      <button onClick={() => { remember(null); setRoom(null); setOwn(null); clearPending(); }}>Forget this device's credential</button>
      {credentials.role === 'player' && <p className="note">Reconnect credentials are kept in this tab's session storage. Invitation links contain only the room code. Forgetting a credential disconnects this device; it does not release the reserved player seat.</p>}
    </section>}
    {pending && <p className="pending-note" role="status">Waiting for server confirmation…</p>}
    <p className="service-status" role="status" aria-live="polite">{status}</p>
    {storageNotice && <p role="alert">{storageNotice}</p>}
    </div>
  </Presentation>;
}
