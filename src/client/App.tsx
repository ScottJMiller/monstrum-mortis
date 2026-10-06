import { QuickPlay, guestHeaders } from './QuickPlay.tsx';
import { useEffect, useRef, useState } from 'react';
import { PROTOCOL_VERSION } from '../shared/protocol.ts';
import type { ClientAction, ServerMessage } from '../shared/protocol.ts';
import type { RoomCredentials, RoomEntryResponse } from '../shared/room-service.ts';
import type { ControllerSnapshot, PresentationMode, RoomSnapshot } from '../shared/types.ts';

const STORAGE_KEY = 'mm.room.v2';
function storedCredentials(): RoomCredentials | null {
  try {
    const raw = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
    return raw && typeof raw.roomId === 'string' && typeof raw.reconnectToken === 'string' ? raw : null;
  } catch { return null; }
}
/** Step 3 service console. Production scene, DNA controls and battle are later milestones. */
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
  const [pending, setPending] = useState(false);
  const [replace, setReplace] = useState(false);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const serverOffset = useRef(0);
  const socket = useRef<WebSocket | null>(null);
  const entryKey = useRef<{ fingerprint: string; id: string } | null>(null);
  const displayKey = useRef<string | null>(null);
  const pendingAction = useRef<ClientAction | null>(null);

  function remember(value: RoomCredentials | null) {
    try { value ? sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value)) : sessionStorage.removeItem(STORAGE_KEY); }
    catch { setStorageNotice('Browser storage unavailable; reloading will lose this reconnect credential.'); }
    setCredentials(value);
  }
  function receive(message: ServerMessage) {
    serverOffset.current = message.serverTimeMs - Date.now();
    if (message.kind === 'room-snapshot') setRoom(previous => !previous || message.snapshot.revision >= previous.revision ? message.snapshot : previous);
    if (message.kind === 'controller-snapshot') setOwn(message.snapshot);
    if (message.kind === 'action-rejected' || message.kind === 'action-accepted') {
      if (pendingAction.current?.actionId === message.actionId) {
        const leaving = pendingAction.current.kind === 'leave';
        pendingAction.current = null; setPending(false);
        if (message.kind === 'action-accepted' && leaving) { remember(null); setRoom(null); setOwn(null); setFindNew(findingNew.current); findingNew.current = false; setStatus('You left the laboratory.'); }
      }
      if (message.kind === 'action-rejected') setStatus(`${message.code}: ${message.message}`);
      else setStatus('Intent accepted by the server.');
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
    const ws = new WebSocket(url, ['mm-v3', `token.${credentials.reconnectToken}`]); socket.current = ws;
    setStatus('Connecting to the authoritative room…'); setConnected(false);
    ws.onopen = () => {
      if (disposed) return;
      setConnected(true); setStatus('Connected. Room state is synchronized.');
      if (pendingAction.current) ws.send(JSON.stringify(pendingAction.current));
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
      setConnected(false);
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
  function intent(kind: 'start-private-session' | 'leave' | 'next-round-ready' | 'public-replay-opt-in') {
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN) return;
    const action: ClientAction = { protocolVersion: PROTOCOL_VERSION, actionId: crypto.randomUUID(), kind };
    pendingAction.current = action; setPending(true); socket.current.send(JSON.stringify(action));
  }
  const invitation = room?.visibility === 'private' ? `${location.origin}/?room=${room.roomId}` : '';
  const remaining = room?.phaseDeadlineMs ? Math.max(0, Math.ceil((room.phaseDeadlineMs - clock - serverOffset.current) / 1000)) : null;
  return <main>
    <p className="eyebrow">Monstrum Mortis · Cooperative laboratory</p>
    <h1>Monstrum Mortis</h1>
    <p>Find a public laboratory or invite friends. Creature artwork, DNA, and automatic battles are still being built.</p>
    {!credentials ? <><QuickPlay autoStart={findNew} onBusy={setQueueBusy} onEntry={entry => { setFindNew(false); setRoom(entry.snapshot); setOwn(entry.controller); setReplace(false); remember(entry.credentials); }} /><section aria-label="Private room entry">
      <label>Player Name<input value={name} maxLength={24} onChange={event => setName(event.target.value)} autoComplete="nickname" aria-describedby="player-name-hint" className={!name.trim() && !display ? 'name-required' : undefined} /></label>
      <p id="player-name-hint" className={!name.trim() && !display ? 'entry-warning' : 'note'}>{!name.trim() ? (display ? 'Display devices can join without a player name. Creating a laboratory requires a player name.' : 'Enter your player name first to create or join a laboratory.') : 'This is your name in the player roster.'}</p>
      <label>Presentation<select value={presentation} onChange={event => setPresentation(event.target.value as PresentationMode)}><option value="remote">Remote</option><option value="same-room">Same-Room</option></select></label>
      <button disabled={pending || queueBusy || !name.trim()} onClick={() => enter(true)}>Create Private Laboratory</button>
      <label>Invitation code<input value={code} maxLength={6} onChange={event => setCode(event.target.value.toUpperCase())} autoCapitalize="characters" /></label>
      <label className="checkbox"><input type="checkbox" checked={display} onChange={event => setDisplay(event.target.checked)} /> Join as a display without a player seat</label>
      <button disabled={pending || queueBusy || code.trim().length !== 6 || (!display && !name.trim())} onClick={() => enter(false)}>Join by Code</button>
    </section></> : <section aria-label="Laboratory room">
      <p>Room <strong>{credentials.roomId}</strong> · {credentials.role} · {connected ? 'online' : 'offline'}</p>
      {invitation && <label>Player invitation link<input readOnly value={invitation} onFocus={event => event.target.select()} /></label>}
      {room?.visibility === 'public' && credentials.role === 'player' && <button disabled={pending || !connected} onClick={openPublicDisplay}>Open shared display</button>}
      {invitation && <p><a href={`${invitation}&display=1`} target="_blank" rel="noreferrer">Open shared display</a></p>}
      {room && <>
        <p>Phase: <strong>{room.phase}</strong>{remaining !== null && ` · ${remaining}s remaining`} · revision {room.revision}</p>
        {room.recoveryDeadlineMs && <p>Experiment suspended for reconnection. Recovery deadline: {new Date(room.recoveryDeadlineMs).toLocaleTimeString()}.</p>}
        {room.phase === 'battle' && <p>The synchronized service has reached the battle boundary. Combat will be added in step 6.</p>}
        <ul>{room.players.map(player => <li key={player.playerId}>{player.symbol} {player.alias} · {player.connected ? 'connected' : 'disconnected'}{player.playerId === room.hostPlayerId ? ' · host' : ''}{player.waitingForNextRound ? ' · waiting for next round' : ''}{player.finishedThisRound ? ' · finished' : ''}</li>)}</ul>
        {room.publicSession && <>
          {room.players.find(p => p.playerId === credentials.sessionId)?.inactivityPrompt && <p>You made no injections this round. Choose Next round ready to keep your seat.</p>}
          <p>Team score: {room.teamScore} · {room.publicSession.completedRounds} completed rounds. This laboratory’s score includes earlier rounds; your contribution starts when you join.</p>
          {['autopsy', 'recovery-lobby'].includes(room.phase) && <button disabled={!connected || pending || room.publicSession.readyPlayerIds.includes(credentials.sessionId)} onClick={() => intent('next-round-ready')}>Next round ready</button>}
          {room.phase === 'session-results' && room.phaseDeadlineMs !== null && <button disabled={!connected || pending || room.publicSession.replayPlayerIds.includes(credentials.sessionId)} onClick={() => intent('public-replay-opt-in')}>Stay for a new session</button>}
          {['autopsy', 'session-results', 'recovery-lobby'].includes(room.phase) && <button disabled={!connected || pending} onClick={() => { findingNew.current = true; intent('leave'); }}>Find New Laboratory</button>}
          {room.phase === 'recovery-lobby' && <p>The interrupted round was abandoned. Completed results remain; two ready players can retry this round.</p>}
          {room.phase === 'session-results' && room.phaseDeadlineMs === null && <p>Regroup has ended. Leave or choose Find New Laboratory when you are ready.</p>}
        </>}
        {own && <p>Your controller is private. Specimen dealing and doses arrive in step 5.</p>}
        {credentials.sessionId === room.hostPlayerId && room.phase === 'lobby' && <button disabled={!connected || pending || room.players.filter(p => p.connected).length < 2} onClick={() => intent('start-private-session')}>Start service timeline</button>}
      </>}
      {!connected && <>
        <label className="checkbox"><input type="checkbox" checked={replace} onChange={event => setReplace(event.target.checked)} /> Confirm replacement of this seat's existing connection</label>
        <button onClick={() => setConnectionAttempt(value => value + 1)}>Reconnect</button>
      </>}
      <button disabled={!connected || pending} onClick={() => intent('leave')}>Leave laboratory</button>
      <button onClick={() => { remember(null); setRoom(null); setOwn(null); pendingAction.current = null; setPending(false); }}>Forget this device's credential</button>
      <p className="note">Reconnect credentials are kept in this tab's session storage. Invitation links contain only the room code. Forgetting a credential disconnects this device; it does not release the reserved player seat.</p>
    </section>}
    <p role="status" aria-live="polite">{status}</p>
    {storageNotice && <p role="alert">{storageNotice}</p>}
  </main>;
}
