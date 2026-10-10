import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
// Miniflare is supplied by the exact-version Wrangler dependency in the committed lockfile.
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

const persistence = await mkdtemp(join(tmpdir(), 'mm-room-runtime-'));
const options = {
  name: 'monstrum-mortis', modules: true, scriptPath: resolve('dist/worker/worker.js'),
  compatibilityDate: '2026-10-05',
  durableObjects: Object.fromEntries(['LaboratoryRoom', 'MatchmakingPool', 'GuestLease'].map((className, i) => [['ROOMS', 'MATCHMAKING', 'GUEST_LEASES'][i], { className, useSQLite: true }])),
  resourcePersistencePath: persistence,
  unsafeInspectDurableObjects: true, // Local test harness only; not enabled in Wrangler or production.
  serviceBindings: { ASSETS: async () => new Response('test asset binding') },
};
let mf = new Miniflare(convertV4MiniflareOptions(options));
let origin;
const clients = [];
let ip = 1;
async function api(path, value, credentials, expected = 200) {
  const response = await fetch(new URL(path, origin), {
    method: value === undefined ? 'GET' : 'POST',
    headers: { ...(value === undefined ? {} : { 'Content-Type': 'application/json' }), ...(credentials ? { Authorization: `Bearer ${credentials.reconnectToken}` } : {}), 'CF-Connecting-IP': `192.0.2.${ip++ % 250}` },
    ...(value === undefined ? {} : { body: JSON.stringify(value) }),
  });
  const data = await response.json();
  assert.equal(response.status, expected, JSON.stringify(data)); return data;
}
const uid = () => crypto.randomUUID();
const action = kind => ({ protocolVersion: 5, actionId: uid(), kind });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function client(credentials, replace = false) {
  const url = new URL(`/api/rooms/${credentials.roomId}/socket`, origin); url.protocol = 'ws:';
  if (replace) url.searchParams.set('replace', '1');
  const ws = new WebSocket(url, ['mm-v5', `token.${credentials.reconnectToken}`]);
  const messages = []; ws.addEventListener('message', event => { if (event.data !== 'pong') messages.push(JSON.parse(event.data)); });
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  const timer = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send('ping'); }, 10_000);
  const c = {
    ws, messages,
    async wait(predicate, timeout = 5000) {
      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) { const found = messages.find(predicate); if (found) return found; await sleep(20); }
      throw new Error(`Timed out waiting for client message: ${JSON.stringify(messages.slice(-3))}`);
    },
    async send(value) { ws.send(JSON.stringify(value)); return this.wait(m => m.actionId === value.actionId && (m.kind === 'action-accepted' || m.kind === 'action-rejected')); },
    close() { clearInterval(timer); ws.close(); },
  };
  clients.push(c); await c.wait(m => m.kind === 'room-snapshot'); return c;
}
async function snapshot(credentials) { return (await api(`/api/rooms/${credentials.roomId}/snapshot`, undefined, credentials)).snapshot; }
let passed = 0;
function checked(message) { passed++; console.log(`PASS ${passed}: ${message}`); }
// The Node binding bridge exposes nested RPC values through proxies; copy scalar fields for assertions.
function copyGrants(result, n) { return { ok: result.ok, value: Array.from({ length: n }, (_, i) => ({ reservationId: result.value[i].reservationId, guestId: result.value[i].guestId, admissionToken: result.value[i].admissionToken, expiresAtMs: result.value[i].expiresAtMs })) }; }
try {
  origin = await mf.ready;
  const health = await api('/api/health'); assert.equal(health.stage, 'automatic-combat'); assert.equal(health.gameplayAvailable, true);
  const create = { operationId: uid(), alias: 'Host', presentation: 'remote' };
  const first = await api('/api/rooms/private', create, undefined, 201);
  const repeated = await api('/api/rooms/private', create, undefined, 201);
  assert.deepEqual(first.credentials, repeated.credentials);
  const roomId = first.credentials.roomId;
  assert.match(roomId, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  await api('/api/rooms/private', { ...create, alias: 'Different' }, undefined, 409);
  await api(`/api/rooms/${roomId}/snapshot`, undefined, undefined, 401);
  await api(`/api/rooms/${roomId}/snapshot`, undefined, { reconnectToken: 'x'.repeat(43) }, 401);
  await api('/api/rooms/AAAAAA/join', { operationId: uid(), alias: 'Missing', role: 'player' }, undefined, 404);
  const crossOrigin = await fetch(new URL(`/api/rooms/${roomId}/join`, origin), { method: 'POST', headers: { Origin: 'https://intruder.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ operationId: uid(), alias: 'Intruder', role: 'player' }) }); assert.equal(crossOrigin.status, 403);
  await api(`/api/rooms/${roomId}/join`, { operationId: uid(), alias: 'x'.repeat(5000), role: 'player' }, undefined, 413);
  await api(`/api/rooms/${roomId}/join`, { operationId: uid(), alias: 'Valid', role: 'player', playerId: 'forged' }, undefined, 400);
  assert.equal((await fetch(new URL(`/api/rooms/${roomId}/join`, origin))).status, 405);
  checked('private create replay, collision-safe code, inaccessible snapshots, unknown rooms and origin authorization');

  const host = await client(first.credentials);
  const joins = Array.from({ length: 7 }, (_, i) => ({ operationId: uid(), alias: `Player ${i + 2}`, role: 'player' }));
  const entries = await Promise.all(joins.map(j => api(`/api/rooms/${roomId}/join`, j)));
  const players = await Promise.all(entries.map(e => client(e.credentials)));
  const joinRetry = await api(`/api/rooms/${roomId}/join`, joins[0]); assert.deepEqual(joinRetry.credentials, entries[0].credentials);
  await api(`/api/rooms/${roomId}/join`, { operationId: uid(), alias: 'Ninth', role: 'player' }, undefined, 409);
  const displayEntry = await api(`/api/rooms/${roomId}/join`, { operationId: uid(), alias: 'Display', role: 'display' });
  assert.equal(displayEntry.controller, null);
  const display = await client(displayEntry.credentials);
  assert.equal((await snapshot(first.credentials)).players.length, 8);
  await host.wait(m => m.kind === 'room-snapshot' && m.snapshot.players.filter(p => p.connected).length === 8);
  assert.ok(display.messages.every(m => m.kind !== 'controller-snapshot'));
  checked('eight independent player WebSockets synchronize; ninth rejected; display consumes no player seat');

  assert.equal((await players[0].send(action('start-private-session'))).code, 'unauthorized');
  assert.equal((await display.send(action('start-private-session'))).code, 'unauthorized');
  const start = action('start-private-session');
  const accepted = await host.send(start); assert.equal(accepted.kind, 'action-accepted');
  const revision = accepted.revision;
  host.ws.send(JSON.stringify(start));
  await sleep(150);
  assert.equal(host.messages.filter(m => m.kind === 'action-accepted' && m.actionId === start.actionId).length, 2);
  assert.equal((await snapshot(first.credentials)).revision, revision);
  host.ws.send(JSON.stringify({ ...start, kind: 'advance-private-round', battleId: uid() }));
  await host.wait(m => m.actionId === start.actionId && m.code === 'idempotency-conflict');
  const forged = { ...action('start-private-session'), playerId: first.credentials.sessionId, phase: 'autopsy' };
  host.ws.send(JSON.stringify(forged)); await host.wait(m => m.code === 'invalid-action');
  await Promise.all([...players, display].map(c => c.wait(m => m.kind === 'room-snapshot' && m.snapshot.phase === 'briefing')));
  const forbidden = ['reconnectToken', 'tokenHash', 'operationHash', 'secret', 'battleSeed', 'pendingDrawDnaIds'];
  for (const message of display.messages) for (const field of forbidden) assert.ok(!JSON.stringify(message).includes(field));
  for (const c of [host, ...players]) assert.ok(c.messages.filter(m => m.kind === 'controller-snapshot').every(m => m.snapshot.playerId === (c === host ? first.credentials.sessionId : entries[players.indexOf(c)].credentials.sessionId)));
  checked('host/display authorization, replay-safe actions, conflict detection and snapshot privacy');

  const duplicateUrl = new URL(`/api/rooms/${roomId}/socket`, origin);
  const denied = await mf.dispatchFetch(duplicateUrl, { headers: { Upgrade: 'websocket', 'Sec-WebSocket-Protocol': `mm-v5, token.${first.credentials.reconnectToken}` } });
  assert.equal(denied.status, 409);
  const replacement = await client(first.credentials, true);
  await sleep(100); assert.equal(host.ws.readyState, WebSocket.CLOSED);
  await replacement.wait(m => m.kind === 'room-snapshot' && m.snapshot.phase === 'experiment', 10_000);
  const beforeDrop = await snapshot(entries[0].credentials);
  assert.equal(beforeDrop.playerCountAtExperimentStart, 8);
  players[0].close(); await sleep(300);
  const reconnect = await client(entries[0].credentials);
  const afterReconnect = await snapshot(entries[0].credentials);
  assert.equal(afterReconnect.players.length, 8); assert.equal(afterReconnect.phaseDeadlineMs, beforeDrop.phaseDeadlineMs);
  assert.equal(afterReconnect.players.find(p => p.playerId === entries[0].credentials.sessionId).finishedThisRound, false);
  checked('explicit connection replacement and grace reconnection preserve seat and authoritative deadline');

  replacement.close(); await sleep(16_000);
  const transferred = await snapshot(entries[1].credentials);
  assert.notEqual(transferred.hostPlayerId, first.credentials.sessionId); assert.equal(transferred.playerCountAtExperimentStart, 8);
  const returnedHost = await client(first.credentials);
  const returned = await snapshot(first.credentials);
  assert.equal(returned.players.find(p => p.playerId === first.credentials.sessionId).finishedThisRound, true);
  assert.equal((await returnedHost.send(action('start-private-session'))).code, 'unauthorized');
  checked('disconnect grace expires through alarm, host transfers to a player, late return stays finished and scaling stays fixed');

  const lateEntry = await api(`/api/rooms/${roomId}/join`, { operationId: uid(), alias: 'Late', role: 'player' }, undefined, 409);
  assert.equal(lateEntry.code, 'room-full');
  assert.equal((await players[1].send(action('leave'))).kind, 'action-accepted');
  const waitingEntry = await api(`/api/rooms/${roomId}/join`, { operationId: uid(), alias: 'Waiting', role: 'player' });
  const waiting = await client(waitingEntry.credentials);
  const waitingState = await snapshot(waitingEntry.credentials);
  assert.equal(waitingState.players.find(p => p.playerId === waitingEntry.credentials.sessionId).waitingForNextRound, true);
  assert.equal(waitingState.playerCountAtExperimentStart, 8);
  assert.equal((await waiting.send({ ...action('inject'), attemptId: (await snapshot(waitingEntry.credentials)).attemptId, specimenId: 'invented' })).code, 'wrong-phase');
  checked('explicit departure frees capacity; mid-round invitation is a waiting seat with no injection permission');

  const bindings = await mf.getBindings();
  const publicRoomId = `p-${uid()}`; const allocationId = uid();
  const publicStub = bindings.ROOMS.get(bindings.ROOMS.idFromName(`room:${publicRoomId}`));
  const members = Array.from({ length: 2 }, (_, i) => ({ reservationId: uid(), guestId: uid(), alias: `Public ${i}` }));
  const allocation = { allocationId, roomId: publicRoomId, members };
  const result = copyGrants(await publicStub.allocatePublic(allocation), members.length); assert.equal(result.ok, true);
  const replay = copyGrants(await publicStub.allocatePublic(allocation), members.length); assert.deepEqual(replay, result);
  await api(`/api/rooms/${publicRoomId}/join`, { operationId: uid(), alias: 'Guessed', role: 'player' }, undefined, 403);
  await api(`/api/rooms/${publicRoomId}/admit`, { operationId: uid(), reservationId: members[0].reservationId, admissionToken: 'forged' }, undefined, 403);
  const grant = result.value[0]; const publicEntryRequest = { operationId: uid(), reservationId: grant.reservationId, admissionToken: grant.admissionToken };
  const publicEntry = await api(`/api/rooms/${publicRoomId}/admit`, publicEntryRequest);
  assert.deepEqual((await api(`/api/rooms/${publicRoomId}/admit`, publicEntryRequest)).credentials, publicEntry.credentials);
  await api(`/api/rooms/${publicRoomId}/admit`, { ...publicEntryRequest, operationId: uid() }, undefined, 409);
  const publicClient = await client(publicEntry.credentials);
  assert.equal((await publicClient.send(action('start-private-session'))).code, 'unauthorized');
  const publicDisplay = await api(`/api/rooms/${publicRoomId}/display`, { operationId: uid() }, publicEntry.credentials);
  assert.equal(publicDisplay.controller, null);
  const cancelled = await publicStub.cancelPublicReservation(allocationId, grant.reservationId); assert.equal(cancelled.ok, true);
  await api(`/api/rooms/${publicRoomId}/snapshot`, undefined, publicEntry.credentials, 401);
  await api(`/api/rooms/${publicRoomId}/admit`, publicEntryRequest, undefined, 403);
  await publicStub.cancelPublicReservation(allocationId, members[1].reservationId);
  await api(`/api/rooms/${publicRoomId}/admit`, { operationId: uid(), reservationId: members[1].reservationId, admissionToken: result.value[1].admissionToken }, undefined, 403);
  checked('binding-only public allocation: signed single-owner grants, replay, cancellation before/after consumption, restricted display grant');

  const evictBindings = await mf.getBindings();
  const doId = evictBindings.ROOMS.idFromName(`room:${roomId}`).toString();
  await mf.unsafeEvictDurableObject('monstrum-mortis', 'LaboratoryRoom', { id: doId, webSockets: 'hibernate' });
  const revisionBeforeSync = (await snapshot(waitingEntry.credentials)).revision;
  waiting.ws.send(JSON.stringify({ ...action('sync-request'), afterRevision: revisionBeforeSync }));
  await waiting.wait(m => m.kind === 'room-snapshot' && m.snapshot.revision >= revisionBeforeSync);
  assert.equal(waiting.ws.readyState, WebSocket.OPEN);
  checked('Durable Object eviction restores SQLite state and hibernating WebSocket attachments');

  const deadline = (await snapshot(waitingEntry.credentials)).phaseDeadlineMs;
  const waitMs = Math.max(0, deadline - Date.now() + 100);
  if (waitMs) { console.log(`Waiting ${Math.ceil(waitMs / 1000)}s for the real experiment alarm…`); await sleep(waitMs); }
  await waiting.wait(m => m.kind === 'room-snapshot' && m.snapshot.phase === 'release', 5000);
  await waiting.wait(m => m.kind === 'room-snapshot' && m.snapshot.phase === 'battle', 7000);
  const battle = await snapshot(waitingEntry.credentials); assert.equal(battle.phase, 'battle'); assert.equal(battle.teamScore, 0); assert.equal(battle.creature.parts.length, 3);
  for (const c of clients.filter(c => c.ws.readyState === WebSocket.OPEN)) {
    const observed = await c.wait(m => m.kind === 'room-snapshot' && m.snapshot.phase === 'battle');
    assert.equal(observed.snapshot.revision, battle.revision);
    assert.deepEqual(observed.snapshot.players, battle.players);
    const revisions = c.messages.filter(m => m.kind === 'room-snapshot').map(m => m.snapshot.revision);
    assert.deepEqual(revisions, [...revisions].sort((a, b) => a - b));
  }
  checked('real briefing, experiment and release alarms synchronize every client and enter the authoritative combat timeline');

  for (const c of clients) c.close(); await sleep(300);
  const persisted = await snapshot(waitingEntry.credentials);
  await mf.dispose(); mf = new Miniflare(convertV4MiniflareOptions(options)); origin = await mf.ready;
  const reloaded = await snapshot(waitingEntry.credentials);
  assert.equal(reloaded.phase, persisted.phase); assert.equal(reloaded.players.length, persisted.players.length); assert.ok(reloaded.revision >= persisted.revision);
  const restartedClient = await client(waitingEntry.credentials); await restartedClient.wait(m => m.kind === 'room-snapshot' && m.snapshot.phase === 'battle');
  const restartedHost = await client(first.credentials);
  const persistedReplay = await restartedHost.send(start);
  assert.equal(persistedReplay.kind, 'action-accepted'); assert.equal(persistedReplay.revision, revision);
  assert.equal((await snapshot(first.credentials)).phase, 'battle');
  const db = await mf.unsafeGetDurableObjectStorage('monstrum-mortis', 'LaboratoryRoom', { id: doId });
  const stored = await db.exec('SELECT record FROM room_state WHERE singleton = 1');
  assert.ok(JSON.stringify(stored).includes('tokenHash')); assert.ok(!JSON.stringify(stored).includes(waitingEntry.credentials.reconnectToken));
  const legacy = JSON.parse(stored[0].record); legacy.schemaVersion = 2; delete legacy.publicState;
  await db.exec('UPDATE room_state SET record = ? WHERE singleton = 1', JSON.stringify(legacy));
  const migrated = await snapshot(waitingEntry.credentials); assert.equal(migrated.phase, 'battle');
  assert.equal(migrated.players.find(p => p.playerId === waitingEntry.credentials.sessionId).alias, legacy.seats.find(s => s.id === waitingEntry.credentials.sessionId).alias);
  assert.equal(JSON.parse((await db.exec('SELECT record FROM room_state'))[0].record).schemaVersion, 5);
  checked('runtime restart retains phase, roster, hashed tokens and receipts; schema-2 private room migrates preserving credentials');

  const expiredRoomId = `p-${uid()}`; const expiredStub = (await mf.getBindings()).ROOMS.get((await mf.getBindings()).ROOMS.idFromName(`room:${expiredRoomId}`));
  const expMembers = [{ reservationId: uid(), guestId: uid(), alias: 'Expiry One' }, { reservationId: uid(), guestId: uid(), alias: 'Expiry Two' }];
  const expiredGrants = await expiredStub.allocatePublic({ allocationId: uid(), roomId: expiredRoomId, members: expMembers });
  await sleep(10_100);
  await api(`/api/rooms/${expiredRoomId}/admit`, { operationId: uid(), reservationId: expMembers[0].reservationId, admissionToken: expiredGrants.value[0].admissionToken }, undefined, 410);
  checked('unused public reservation expires under the runtime alarm');

  for (let attempt = 0; attempt < 31; attempt++) {
    const limited = await fetch(new URL(`/api/rooms/${roomId}/join`, origin), { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.251' }, body: '{}' });
    assert.equal(limited.status, attempt < 30 ? 400 : 429);
  }
  checked('oversized input, unexpected fields, unsupported methods and bounded entry attempts are rejected');

  // Seed an old last-activity timestamp in this isolated test database, then exercise real expiry handling.
  const oldRecord = JSON.parse((await db.exec('SELECT record FROM room_state WHERE singleton = 1'))[0].record);
  oldRecord.lastActivityAtMs = Date.now() - 2 * 60 * 60 * 1000 - 1;
  await db.exec('UPDATE room_state SET record = ? WHERE singleton = 1', JSON.stringify(oldRecord));
  restartedClient.ws.send(JSON.stringify({ ...action('sync-request'), afterRevision: 0 }));
  for (let i = 0; i < 100 && restartedClient.ws.readyState !== WebSocket.CLOSED; i++) await sleep(20);
  assert.equal(restartedClient.ws.readyState, WebSocket.CLOSED);
  assert.equal((await db.exec('SELECT COUNT(*) AS n FROM room_state'))[0].n, 0);
  assert.equal((await db.exec('SELECT COUNT(*) AS n FROM action_receipts'))[0].n, 0);
  await api(`/api/rooms/${roomId}/snapshot`, undefined, waitingEntry.credentials, 410);
  checked('expiry closes clients, deletes secret room data and receipts, and returns a distinct expired-room response');
  console.log(`Completed ${passed} runtime scenarios using separate network clients and persisted SQLite storage.`);
} finally {
  for (const c of clients) c.close(); await mf.dispose(); await rm(persistence, { recursive: true, force: true });
}
