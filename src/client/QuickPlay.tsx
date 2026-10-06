import { useEffect, useRef, useState } from 'react';
import { GAME_RULES } from '../shared/rules.ts';
import type { MatchmakingRegion } from '../shared/rules.ts';
import type { GuestCredentials, GuestSessionClaim, PublicQueueStatus } from '../shared/matchmaking.ts';
import type { RoomEntryResponse } from '../shared/room-service.ts';

const GUEST_KEY = 'mm.guest.v3';
const TICKET_KEY = 'mm.queue.v3';
export function guestHeaders(): Record<string, string> {
  try { const g = JSON.parse(localStorage.getItem(GUEST_KEY) ?? 'null') as GuestCredentials | null; return g ? { 'X-Guest-Id': g.guestId, 'X-Guest-Token': g.accessToken } : {}; } catch { return {}; }
}
const labels: Record<MatchmakingRegion, string> = { americas: 'Americas', 'europe-africa': 'Europe / Africa', 'asia-pacific': 'Asia / Pacific' };
async function request<T>(path: string, g: GuestCredentials | null, value?: unknown): Promise<T> {
  const response = await fetch(path, { method: value ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(g ? { 'X-Guest-Id': g.guestId, Authorization: `Bearer ${g.accessToken}` } : {}) }, ...(value ? { body: JSON.stringify(value) } : {}) });
  const data = await response.json(); if (!response.ok) throw new RequestError(data.code, data.message); return data as T;
}
class RequestError extends Error {
  readonly code: string;
  constructor(code: string, message: string) { super(`${code}: ${message}`); this.code = code; }
}
function read<T>(storage: Storage, key: string): T | null { try { return JSON.parse(storage.getItem(key) ?? 'null') as T | null; } catch { return null; } }

/** Matchmaking UI uses only owner projections and sends explicit queue intentions. */
export function QuickPlay({ onEntry, onBusy, autoStart = false }: { onEntry: (entry: RoomEntryResponse) => void; onBusy: (busy: boolean) => void; autoStart?: boolean }) {
  const [guest, setGuest] = useState<GuestCredentials | null>(() => { try { return read(localStorage, GUEST_KEY); } catch { return null; } });
  const [ticket, setTicket] = useState<{ region: MatchmakingRegion; id: string; mode: 'fresh-session' | 'fill-existing-laboratory'; admissionOperationId: string } | null>(() => { try { return read(sessionStorage, TICKET_KEY); } catch { return null; } });
  const [region, setRegion] = useState<MatchmakingRegion>(ticket?.region ?? 'americas');
  const [mode, setMode] = useState<'fresh-session' | 'fill-existing-laboratory'>(ticket?.mode ?? 'fresh-session');
  const [status, setStatus] = useState<PublicQueueStatus | null>(null);
  const [notice, setNotice] = useState('');
  const [claim, setClaim] = useState<GuestSessionClaim | null>(null);
  const [measured, setMeasured] = useState(false);
  const [pending, setPending] = useState(false);
  const [tutorial, setTutorial] = useState(() => { try { return localStorage.getItem('mm.tutorial.v1') === 'done' ? 4 : 0; } catch { return 0; } });
  const [dose, setDose] = useState(0);
  const [selected, setSelected] = useState(false);
  const [now, setNow] = useState(Date.now());
  const serverOffset = useRef(0);
  const issueKey = useRef(crypto.randomUUID());
  const entryKey = useRef(ticket?.admissionOperationId ?? crypto.randomUUID());
  const queueKey = useRef(crypto.randomUUID());
  const entering = useRef(false);
  const queueRequestInFlight = useRef(false);
  const autoStarted = useRef(false);
  function updateStatus(s: PublicQueueStatus | null) { if (s) serverOffset.current = s.serverTimeMs - Date.now(); setStatus(s); }
  function remember(value: typeof ticket) {
    try { value ? sessionStorage.setItem(TICKET_KEY, JSON.stringify(value)) : sessionStorage.removeItem(TICKET_KEY); } catch { setNotice('Storage unavailable: keep this page open to retain your queue ticket.'); }
    setTicket(value); onBusy(!!value);
  }
  function finishTutorial() { setTutorial(4); try { localStorage.setItem('mm.tutorial.v1', 'done'); } catch { /* optional preference */ } }
  function clearTicket() {
    remember(null); updateStatus(null);
    queueKey.current = crypto.randomUUID(); entryKey.current = crypto.randomUUID();
  }
  async function checkSession() {
    if (!guest) return;
    try {
      const result = await request<{ holder: GuestSessionClaim | null }>('/api/guests/session', guest);
      setClaim(result.holder);
      setNotice(result.holder ? `Your guest still belongs to a ${result.holder.kind === 'room' ? 'laboratory' : 'queue'}. Use the button below to leave it before joining another.` : 'No previous session is holding your guest. You can enter Quick Play or a private laboratory.');
    } catch (error) { setNotice(String(error)); }
  }
  async function leaveSession() {
    if (!guest || !claim) return; setPending(true);
    try {
      const result = await request<{ holder: GuestSessionClaim | null }>('/api/guests/leave-session', guest, { kind: claim.kind, id: claim.id, nonce: claim.nonce });
      setClaim(result.holder);
      if (result.holder) setNotice('Your session changed. Check the current session before leaving again.');
      else { clearTicket(); setNotice('Previous session released. Choose Quick Play or a private laboratory.'); }
    } catch (error) { setNotice(String(error)); } finally { setPending(false); }
  }
  async function enterQueue() {
    if (pending || ticket) return; queueRequestInFlight.current = true; setPending(true); onBusy(true);
    try {
      let identity = guest;
      if (!identity) {
        identity = await request<GuestCredentials>('/api/guests', null, { operationId: issueKey.current });
        setGuest(identity); try { localStorage.setItem(GUEST_KEY, JSON.stringify(identity)); } catch { setNotice('Guest credentials cannot be saved; keep this page open.'); }
      }
      const id = queueKey.current;
      // Persist before sending: a lost response must retry this ticket, not make another claim.
      remember({ region, id, mode, admissionOperationId: entryKey.current });
      const result = await request<PublicQueueStatus>(`/api/queue/${region}/enter`, identity, { operationId: id, mode });
      updateStatus(result); setNotice('');
    } catch (error) {
      if (error instanceof RequestError && error.code === 'guest-busy') { clearTicket(); void checkSession(); }
      setNotice(String(error));
    } finally { queueRequestInFlight.current = false; setPending(false); }
  }
  useEffect(() => { onBusy(!!ticket); }, [ticket, onBusy]);
  useEffect(() => {
    if (autoStart && measured && tutorial === 4 && !autoStarted.current) { autoStarted.current = true; void enterQueue(); }
  // An explicit Find New Laboratory choice is the only automatic queue entry.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, tutorial, measured]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!ticket || !guest) return;
    let stopped = false;
    const refresh = async () => {
      try { const s = await request<PublicQueueStatus>(`/api/queue/${ticket.region}/status?ticketId=${ticket.id}`, guest); if (!stopped) updateStatus(s); }
      catch (error) {
        if (stopped) return;
        if (error instanceof RequestError && error.code === 'ticket-not-found') {
          if (!queueRequestInFlight.current) { clearTicket(); void checkSession(); }
        }
        else setNotice(String(error));
      }
    };
    void refresh(); const poll = setInterval(refresh, 10_000);
    const url = new URL(`/api/queue/${ticket.region}/socket?ticketId=${ticket.id}`, location.href); url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(url, ['mm-queue-v3', `guest.${guest.guestId}`, `token.${guest.accessToken}`]);
    const ping = setInterval(() => { if (socket.readyState === WebSocket.OPEN) socket.send('ping'); }, 20_000);
    socket.onmessage = event => { if (stopped || event.data === 'pong') return; try { updateStatus(JSON.parse(event.data).status as PublicQueueStatus); } catch { setNotice('Queue synchronization failed.'); } };
    socket.onerror = () => { if (!stopped) setNotice('Queue socket unavailable; checking the ticket periodically. Close other tabs using this ticket before reloading.'); };
    return () => { stopped = true; clearInterval(poll); clearInterval(ping); socket.close(); };
  }, [ticket, guest]);
  async function admit(s: PublicQueueStatus) {
    if (!s.admission || entering.current) return; entering.current = true; setPending(true);
    try {
      const a = s.admission;
      const entry = await request<RoomEntryResponse>(`/api/rooms/${a.roomId}/admit`, null, { operationId: entryKey.current, reservationId: a.reservationId, admissionToken: a.admissionToken });
      remember(null); onEntry(entry);
    } catch (error) { setNotice(`${String(error)}. Retry admission or cancel to release this claim.`); } finally { entering.current = false; setPending(false); }
  }
  useEffect(() => { if (status?.state === 'matched') void admit(status); }, [status?.state]); // One automatic attempt; retry stays explicit.
  async function action(op: 'ready' | 'resume' | 'cancel') {
    if (!ticket || !guest) return; setPending(true);
    try {
      const s = await request<PublicQueueStatus>(`/api/queue/${ticket.region}/${op}`, guest, { ticketId: ticket.id, ...(op === 'ready' ? { readyCheckId: status?.readyCheckId } : {}) });
      updateStatus(s);
      if (op === 'cancel') clearTicket();
      setNotice('');
    } catch (error) { setNotice(String(error)); } finally { setPending(false); }
  }
  useEffect(() => { if (ticket) setMeasured(true); else void measure(); }, []);
  async function measure() {
    setPending(true);
    try {
      const samples = await Promise.all(GAME_RULES.matchmaking.regions.map(async r => { const start = performance.now(); await request(`/api/pools/${r}/ping`, null); return { region: r, ms: Math.round(performance.now() - start) }; }));
      samples.sort((a, b) => a.ms - b.ms); setRegion(samples[0]!.region); setNotice(`Response times: ${samples.map(s => `${labels[s.region]} ${s.ms} ms`).join('; ')}. You can override this choice.`);
    } catch (error) { setNotice(String(error)); } finally { setPending(false); setMeasured(true); }
  }
  return <section aria-label="Public Quick Play">
    <h2>Quick Play</h2>
    {tutorial < 4 && <div aria-label="Laboratory rehearsal">
      <p>A short rehearsal before your first queue. Specimen effects stay mysterious.</p>
      {tutorial === 0 && <><p>Select a mysterious specimen from your tray.</p><button onClick={() => { setSelected(true); setTutorial(1); }}>Select specimen</button></>}
      {tutorial === 1 && <><p>{selected && 'Specimen selected.'} Inject up to six times. In a round, injections have a six-second cooldown.</p><button onClick={() => { setDose(n => n + 1); setTutorial(2); }}>Rehearse injection</button></>}
      {tutorial === 2 && <><p>{dose} of 6 rehearsal doses used. Injecting leaves your switch locked during its cooldown; after at least one injection, the switch ends your personal turn. The round also has a shared deadline.</p><button onClick={() => setTutorial(3)}>Unleash the Creature!</button></>}
      {tutorial === 3 && <><p>Your turn is finished. The creature waits for teammates before release; then everyone watches the automatic battle.</p><button onClick={finishTutorial}>Finish rehearsal</button></>}
      <button onClick={finishTutorial}>Skip rehearsal</button>
    </div>}
    <p>At least two players must be present in the same pool.</p>
    <p>Public guests use server-assigned aliases and symbols. Fresh sessions start with a group of 2–6; laboratories hold up to 8 players.</p>
    {guest && <p>{guest.symbol} {guest.alias}</p>}
    {guest && <button disabled={pending} onClick={checkSession}>Check previous session</button>}
    {claim && <button disabled={pending} onClick={leaveSession}>{claim.kind === 'room' ? 'Leave previous laboratory' : 'Cancel previous queue'}</button>}
    <label>Regional pool<select value={region} disabled={!!ticket || pending} onChange={e => setRegion(e.target.value as MatchmakingRegion)}>{GAME_RULES.matchmaking.regions.map(r => <option key={r} value={r}>{labels[r]}</option>)}</select></label>
    <button disabled={!!ticket || pending} onClick={measure}>Choose fastest responding pool</button>
    <label>Queue mode<select value={mode} disabled={!!ticket || pending} onChange={e => setMode(e.target.value as typeof mode)}><option value="fresh-session">Fresh session</option><option value="fill-existing-laboratory">Fill Existing Laboratory (join between rounds)</option></select></label>
    {!ticket ? <button disabled={pending || tutorial < 4} onClick={enterQueue}>Enter Quick Play</button> : <>
      <p>{status?.state ?? 'Checking ticket'} · {Math.max(0, Math.floor((now + serverOffset.current - (status?.enteredAtMs ?? now + serverOffset.current)) / 1000))}s elapsed · {status?.waitingPlayers ?? 0} waiting</p>
      {status?.readyDeadlineMs && <p>Ready check: {Math.max(0, Math.ceil((status.readyDeadlineMs - now - serverOffset.current) / 1000))}s remaining</p>}
      {status?.offer && <p>Join round {status.offer.reason === 'vacancy' ? Math.min(3, status.offer.round + 1) : status.offer.round} · team score {status.offer.teamScore} · about {Math.ceil(status.offer.remainingSessionMs / 60_000)} minutes remaining · {status.offer.reason === 'recovery' ? 'Recovering an interrupted round' : 'Between-round vacancy'}.</p>}
      {status?.state === 'ready-check' && <button disabled={pending || status.readyConfirmed} onClick={() => action('ready')}>{status.readyConfirmed ? 'Ready confirmed' : 'Ready'}</button>}
      {status?.state === 'inactive' && <button disabled={pending} onClick={() => action('resume')}>Resume waiting</button>}
      {status?.state === 'matched' && <button disabled={pending} onClick={() => admit(status)}>Retry admission</button>}
      {status?.suggestAlternatives && <p>No match yet. You can cancel and choose another regional pool, or invite friends to a private laboratory below.</p>}
      {!status && <button disabled={pending} onClick={async () => { try { updateStatus(await request<PublicQueueStatus>(`/api/queue/${ticket.region}/enter`, guest, { operationId: ticket.id, mode: ticket.mode })); } catch (error) { setNotice(String(error)); } }}>Retry queue entry</button>}
      <button disabled={pending} onClick={() => action('cancel')}>Cancel queue</button>
    </>}
    {notice && <p role="status">{notice}</p>}
    {notice.includes('unauthorized') && <button onClick={() => { remember(null); updateStatus(null); setGuest(null); setClaim(null); try { localStorage.removeItem(GUEST_KEY); } catch { /* unavailable */ } issueKey.current = crypto.randomUUID(); queueKey.current = crypto.randomUUID(); entryKey.current = crypto.randomUUID(); setNotice('Expired guest credential cleared. Enter Quick Play when ready.'); }}>Reset expired guest credential</button>}
  </section>;
}
