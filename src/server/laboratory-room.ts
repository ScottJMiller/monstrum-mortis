import { DurableObject } from 'cloudflare:workers';
import type { MatchmakingRegion } from '../shared/rules.ts';
import type { ReplacementOffer } from '../shared/matchmaking.ts';
import { GAME_RULES } from '../shared/rules.ts';
import { PROTOCOL_VERSION } from '../shared/protocol.ts';
import type { ActionErrorCode, ClientAction, ServerMessage } from '../shared/protocol.ts';
import type { RoomEntryResponse } from '../shared/room-service.ts';
import type { WorkerEnv } from './env.ts';
import type { PublicAllocation, PublicGrant, ServiceResult } from './admission.ts';
import { body, exact, failure, alias, operationId, parseAction, PRIVATE_CODE, PUBLIC_ID, ServiceError } from './validation.ts';
import { hash, deriveToken, randomSecret } from './security.ts';
import { completePublicRound, publicIntent, publicProgress, connectedPlayers, connect, controller, disconnect, expiresAt, livePlayers, newRoom, nextAlarm, requireLive, settle, snapshot, startRound, touch } from './room-model.ts';
import type { Seat, StoredRoom } from './room-model.ts';

interface Attachment {
  sessionId: string;
  connectionId: string;
  openedAtMs: number;
  lastMessageAtMs: number;
  closed: boolean;
}
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SOCKET_LIVENESS_MS = 60_000;
const RECEIPT_LIMIT = 1024;

/** Stable deployed infrastructure identity. State is loaded from SQLite on every event. */
export class LaboratoryRoom extends DurableObject<WorkerEnv> {
  private tail: Promise<unknown> = Promise.resolve();
  constructor(ctx: DurableObjectState, env: WorkerEnv) {
    super(ctx, env);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS room_state (singleton INTEGER PRIMARY KEY CHECK(singleton = 1), record TEXT NOT NULL)`);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS action_receipts (principal TEXT NOT NULL, action_id TEXT NOT NULL, fingerprint TEXT NOT NULL, result TEXT NOT NULL, PRIMARY KEY(principal, action_id))`);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, until_ms INTEGER NOT NULL, count INTEGER NOT NULL)`);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS private_codes (operation_hash TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, code TEXT NOT NULL UNIQUE, expires_ms INTEGER NOT NULL)`);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }
  private exclusive<T>(work: () => Promise<T>): Promise<T> {
    const result = this.tail.then(work);
    this.tail = result.catch(() => undefined);
    return result;
  }
  private load(): StoredRoom | null {
    const row = this.ctx.storage.sql.exec<{ record: string }>('SELECT record FROM room_state WHERE singleton = 1').toArray()[0];
    if (!row) return null;
    const room = JSON.parse(row.record) as StoredRoom;
    if ((room as { schemaVersion: number }).schemaVersion === 2) { room.schemaVersion = 3; room.publicState = null; }
    if (room.schemaVersion !== 3) throw new ServiceError('temporarily-unavailable', 'Unsupported stored room schema.', 503);
    return room;
  }
  private save(room: StoredRoom) {
    this.ctx.storage.sql.exec('INSERT OR REPLACE INTO room_state(singleton, record) VALUES(1, ?)', JSON.stringify(room));
  }
  private limited(key: string, count: number, period: number, now: number): boolean {
    const sql = this.ctx.storage.sql;
    sql.exec('DELETE FROM limits WHERE until_ms <= ?', now);
    const row = sql.exec<{ count: number }>('SELECT count FROM limits WHERE key = ?', key).toArray()[0];
    if (row && row.count >= count) return true;
    if (!row && sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM limits').one().n >= 2048) return true;
    sql.exec('INSERT INTO limits(key, until_ms, count) VALUES(?, ?, 1) ON CONFLICT(key) DO UPDATE SET count = count + 1', key, now + period);
    return false;
  }
  /** One bounded control instance limits unauthenticated HTTP admission/creation attempts. */
  async checkEntryRate(ipHash: string, creation: boolean): Promise<boolean> {
    return this.exclusive(async () => {
      const now = Date.now();
      const denied = this.limited(`entry:${ipHash}`, 30, 60_000, now)
        || (creation && this.limited(`create:${ipHash}`, 5, 60_000, now));
      await this.ctx.storage.setAlarm(now + GAME_RULES.roomIdleExpiryMs);
      return !denied;
    });
  }
  async privateCode(operationHash: string, fingerprint: string, collidedCode: string | null): Promise<ServiceResult<string>> {
    return this.exclusive(async () => {
      const now = Date.now(); const sql = this.ctx.storage.sql;
      sql.exec('DELETE FROM private_codes WHERE expires_ms <= ?', now);
      const previous = sql.exec<{ fingerprint: string; code: string }>('SELECT fingerprint, code FROM private_codes WHERE operation_hash = ?', operationHash).toArray()[0];
      if (previous && previous.fingerprint !== fingerprint) return { ok: false, code: 'idempotency-conflict', message: 'Creation key already used with different details.', status: 409 };
      if (previous && previous.code !== collidedCode) return { ok: true, value: previous.code };
      if (sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM private_codes').one().n >= 4096) return { ok: false, code: 'temporarily-unavailable', message: 'Creation capacity reached. Retry later.', status: 503 };
      // The 32-symbol alphabet evenly divides the byte range.
      let code = '';
      for (const n of crypto.getRandomValues(new Uint8Array(6))) code += CODE_ALPHABET[n % CODE_ALPHABET.length];
      if (sql.exec('SELECT code FROM private_codes WHERE code = ?', code).toArray().length) return { ok: false, code: 'temporarily-unavailable', message: 'Retry room creation.', status: 503 };
      sql.exec('INSERT OR REPLACE INTO private_codes VALUES(?, ?, ?, ?)', operationHash, fingerprint, code, now + GAME_RULES.roomMaxLifetimeMs);
      await this.ctx.storage.setAlarm(now + GAME_RULES.roomIdleExpiryMs);
      return { ok: true, value: code };
    });
  }
  private attachment(ws: WebSocket): Attachment { return ws.deserializeAttachment() as Attachment; }
  private sockets(sessionId?: string): WebSocket[] {
    return this.ctx.getWebSockets().filter(ws => {
      const a = this.attachment(ws);
      return a && !a.closed && (!sessionId || a.sessionId === sessionId);
    });
  }
  private closeSocket(ws: WebSocket, code: number, reason: string) {
    const a = this.attachment(ws); a.closed = true; ws.serializeAttachment(a);
    try { ws.close(code, reason); } catch { /* A transport can already be closed. */ }
  }
  private reconcile(room: StoredRoom, now: number) {
    for (const ws of this.sockets()) {
      const a = this.attachment(ws);
      const lastPing = this.ctx.getWebSocketAutoResponseTimestamp(ws)?.getTime() ?? 0;
      if (now >= Math.max(a.openedAtMs, a.lastMessageAtMs, lastPing) + SOCKET_LIVENESS_MS) {
        this.closeSocket(ws, 4000, 'Heartbeat expired');
        const seat = room.seats.find(s => s.id === a.sessionId);
        if (seat && !this.sockets(seat.id).length) disconnect(room, seat, now);
      }
    }
    for (const seat of room.seats) {
      if (seat.connected && !this.sockets(seat.id).length) disconnect(room, seat, now);
    }
  }
  private advance(room: StoredRoom, now: number) {
    this.reconcile(room, now);
    settle(room, now);
    if (room.publicState && ['autopsy', 'recovery-lobby', 'session-results'].includes(room.phase)) for (const seat of livePlayers(room)) if (!seat.connected && seat.disconnectDeadlineMs === null) disconnect(room, seat, now, true);
    for (const grant of room.reservations) {
      if (!grant.cancelled && !grant.consumedByOperationHash && grant.expiresAtMs <= now) grant.cancelled = true;
    }
  }
  private async schedule(room: StoredRoom) {
    if (room.phase === 'closed') { await this.ctx.storage.deleteAlarm(); return; }
    const socketCheck = this.sockets().length || room.publicState || room.seats.some(s => s.guestId && !s.departed) ? Date.now() + SOCKET_LIVENESS_MS : Infinity;
    await this.ctx.storage.setAlarm(Math.max(Date.now() + 1, Math.min(nextAlarm(room), socketCheck, room.publicState?.notice?.pending ? Date.now() + 1000 : Infinity, ...room.seats.filter(s => s.guestId && s.reservationId && !s.departed).map(s => s.leaseRenewAtMs ?? Infinity))));
  }
  private envelope(): { protocolVersion: 3; serverTimeMs: number } { return { protocolVersion: PROTOCOL_VERSION, serverTimeMs: Date.now() }; }
  private send(ws: WebSocket, message: ServerMessage) { try { ws.send(JSON.stringify(message)); } catch { /* Close/error callback handles transport loss. */ } }
  private sendSnapshots(ws: WebSocket, room: StoredRoom) {
    const a = this.attachment(ws);
    const seat = room.seats.find(s => s.id === a.sessionId);
    if (!seat || seat.departed || a.closed) return;
    this.send(ws, { ...this.envelope(), kind: 'room-snapshot', snapshot: snapshot(room, Date.now()) });
    const own = controller(seat);
    if (own) this.send(ws, { ...this.envelope(), kind: 'controller-snapshot', snapshot: own });
  }
  private broadcast(room: StoredRoom) {
    for (const ws of this.sockets()) this.sendSnapshots(ws, room);
  }
  private prepareNotice(room: StoredRoom) {
    const p = room.publicState; if (!p) return;
    const signature = JSON.stringify(this.offer(room));
    if (p.notice?.signature !== signature) p.notice = { revision: (p.notice?.revision ?? 0) + 1, signature, pending: true };
  }
  private async persisted(room: StoredRoom, broadcast = true) {
    this.prepareNotice(room);
    await this.ctx.storage.transaction(async () => { this.save(room); await this.schedule(room); });
    if (room.publicState || room.seats.some(s => s.guestId && s.reservationId)) await this.maintainLeases(room);
    if (room.publicState) {
      // Lease maintenance can retire a seat and change the available capacity.
      this.prepareNotice(room);
      await this.ctx.storage.transaction(async () => { this.save(room); await this.schedule(room); });
      // Send after the room event releases its serialization queue: pool allocation calls rooms.
      this.ctx.waitUntil(this.tail.then(() => this.flushNotice()).catch(() => undefined));
    }
    if (broadcast) this.broadcast(room);
  }
  private async entryResponse(room: StoredRoom, seat: Seat): Promise<RoomEntryResponse> {
    return {
      credentials: { roomId: room.id, sessionId: seat.id, role: seat.role, reconnectToken: await deriveToken(room.secret, `seat:${seat.operationHash}`) },
      snapshot: snapshot(room, Date.now()), controller: controller(seat),
    };
  }
  private async addSeat(room: StoredRoom, operationHash: string, entryFingerprint: string, name: string, role: Seat['role'], guestId: string | null, now: number): Promise<Seat> {
    const existing = room.seats.find(s => s.operationHash === operationHash);
    if (existing) {
      if (existing.entryFingerprint !== entryFingerprint) throw new ServiceError('idempotency-conflict', 'Entry key already used with different details.', 409);
      if (existing.departed) throw new ServiceError('stale-session', 'This seat has left. Use a new entry key.', 409);
      return existing;
    }
    if (room.seats.length >= 128) throw new ServiceError('room-full', 'This laboratory has reached its lifetime admission limit.', 409);
    if (role === 'player' && livePlayers(room).length >= GAME_RULES.maxPlayers) throw new ServiceError('room-full', 'All eight player seats are occupied.', 409);
    if (role === 'display' && room.seats.filter(s => s.role === 'display' && !s.departed).length >= 4) throw new ServiceError('room-full', 'All four display connections are allocated.', 409);
    const token = await deriveToken(room.secret, `seat:${operationHash}`);
    const seat: Seat = {
      id: crypto.randomUUID(), guestId, operationHash, entryFingerprint, tokenHash: await hash(token), alias: name,
      symbol: ['☽', '♜', '⚗', '✦', '☿', '♠', '☼', '⚙'][livePlayers(room).length % 8]!, role,
      joinedAtMs: now, connectedAtMs: null, connected: false, disconnectDeadlineMs: now + GAME_RULES.reconnectGraceMs,
      eligible: room.phase === 'lobby', finished: false, departed: false, remainingDoses: 0, nextInjectionAtMs: 0,
    };
    room.seats.push(seat);
    if (role === 'player' && room.visibility === 'private' && !room.hostId) room.hostId = seat.id;
    room.revision++; touch(room, now);
    return seat;
  }
  private async privateGuest(request: Request): Promise<string | null> {
    const id = request.headers.get('X-Guest-Id'); if (!id) return null;
    operationId(id); const identity = await this.lease(id).authenticate(request.headers.get('X-Guest-Token') ?? '');
    if (!identity) throw new ServiceError('unauthorized', 'Guest credential invalid.', 401);
    return id;
  }
  private async claimPrivate(room: StoredRoom, seat: Seat, guestId: string | null) {
    if (guestId !== seat.guestId) throw new ServiceError('idempotency-conflict', 'Guest entry identity differs.', 409);
    if (guestId) {
      if (!await this.lease(guestId).acquirePrivate(room.id, seat.operationHash)) throw new ServiceError('guest-busy', 'Cancel or leave your current queue/room first.', 409);
      seat.reservationId = seat.operationHash;
    }
  }
  private async auth(room: StoredRoom, request: Request): Promise<Seat> {
    const header = request.headers.get('Authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    return this.tokenSeat(room, token);
  }
  private async tokenSeat(room: StoredRoom, token: string): Promise<Seat> {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new ServiceError('unauthorized', 'A seat reconnect credential is required.', 401);
    const digest = await hash(token);
    const seat = room.seats.find(s => s.tokenHash === digest && !s.departed);
    if (!seat) throw new ServiceError('unauthorized', 'Invalid or revoked reconnect credential.', 401);
    if (seat.guestId && seat.reservationId && !await this.lease(seat.guestId).renew('room', room.id, seat.reservationId)) throw new ServiceError('stale-session', 'This guest no longer owns this seat.', 409);
    return seat;
  }
  async fetch(request: Request): Promise<Response> {
    return this.exclusive(async () => {
      try { return await this.handle(request); } catch (error) { return failure(error); }
    });
  }
  private async handle(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname; const now = Date.now();
    let room = this.load();
    if (!room && this.ctx.storage.sql.exec('SELECT key FROM limits WHERE key = ? AND until_ms > ?', 'expired', now).toArray().length) throw new ServiceError(path === '/internal/create' ? 'code-collision' : 'room-expired', 'This laboratory has expired.', path === '/internal/create' ? 409 : 410);
    if (room) {
      if (path === '/internal/create') {
        const copy = await body(request.clone());
        if (typeof copy.operationId === 'string' && await hash(copy.operationId) !== room.creationHash) throw new ServiceError('code-collision', 'Room code already allocated.', 409);
      }
      this.advance(room, now);
      if (room.phase === 'closed') { await this.expire(room); throw new ServiceError('room-expired', 'This laboratory has expired.', 410); }
      await this.persisted(room);
      requireLive(room, now);
    }
    if (path === '/internal/create' && request.method === 'POST') {
      const v = await body(request); exact(v, ['roomId', 'operationId', 'alias', 'presentation']);
      const op = operationId(v.operationId); const name = alias(v.alias);
      if (typeof v.roomId !== 'string' || !PRIVATE_CODE.test(v.roomId)) throw new ServiceError('invalid-action', 'Invalid room code.');
      if (v.presentation !== 'remote' && v.presentation !== 'same-room') throw new ServiceError('invalid-action', 'Invalid presentation.');
      const opHash = await hash(op); const fingerprint = JSON.stringify([name, v.presentation]);
      if (room && room.creationHash !== opHash) throw new ServiceError('code-collision', 'Room code is already allocated.', 409);
      if (room && room.creationFingerprint !== fingerprint) throw new ServiceError('idempotency-conflict', 'Creation key reused.', 409);
      room ??= newRoom(v.roomId, 'private', v.presentation, randomSecret(), opHash, fingerprint, now);
      const guestId = await this.privateGuest(request);
      const seat = await this.addSeat(room, opHash, JSON.stringify([name, 'player']), name, 'player', guestId, now);
      await this.claimPrivate(room, seat, guestId);
      await this.persisted(room);
      return Response.json(await this.entryResponse(room, seat), { status: 201, headers: { 'Cache-Control': 'no-store' } });
    }
    if (!room) throw new ServiceError('room-not-found', 'No laboratory has this invitation.', 404);
    if (path === '/internal/join' && request.method === 'POST') {
      if (room.visibility !== 'private') throw new ServiceError('unauthorized', 'Public laboratories require a server-issued admission reservation.', 403);
      const v = await body(request); exact(v, ['operationId', 'alias', 'role']);
      const op = operationId(v.operationId); const name = alias(v.alias);
      if (v.role !== 'player' && v.role !== 'display') throw new ServiceError('invalid-action', 'Invalid role.');
      const guestId = v.role === 'player' ? await this.privateGuest(request) : null;
      const seat = await this.addSeat(room, await hash(op), JSON.stringify([name, v.role]), name, v.role, guestId, Date.now());
      await this.claimPrivate(room, seat, guestId);
      await this.persisted(room);
      return Response.json(await this.entryResponse(room, seat), { headers: { 'Cache-Control': 'no-store' } });
    }
    if (path === '/internal/admit' && request.method === 'POST') {
      if (room.visibility !== 'public') throw new ServiceError('unauthorized', 'Private laboratories use invitations.', 403);
      const v = await body(request); exact(v, ['operationId', 'reservationId', 'admissionToken']);
      const opHash = await hash(operationId(v.operationId));
      if (typeof v.reservationId !== 'string' || typeof v.admissionToken !== 'string') throw new ServiceError('unauthorized', 'Admission reservation required.', 401);
      const grant = room.reservations.find(g => g.id === v.reservationId);
      if (!grant || grant.tokenHash !== await hash(v.admissionToken)) throw new ServiceError('unauthorized', 'Invalid reservation.', 403);
      if (!grant.consumedByOperationHash && grant.expiresAtMs <= Date.now()) throw new ServiceError('admission-expired', 'Reservation expired.', 410);
      if (grant.cancelled) throw new ServiceError('unauthorized', 'Cancelled reservation.', 403);
      if (grant.consumedByOperationHash && grant.consumedByOperationHash !== opHash) throw new ServiceError('admission-used', 'Reservation already consumed.', 409);
      if (!grant.consumedByOperationHash && grant.expiresAtMs <= Date.now()) throw new ServiceError('admission-expired', 'Reservation expired.', 410);
      if (!grant.consumedByOperationHash && !(grant.purpose === 'replacement' ? ['autopsy', 'recovery-lobby'].includes(room.phase) : ['lobby', 'briefing'].includes(room.phase))) throw new ServiceError('wrong-phase', 'Fresh admissions only enter a lobby.', 409);
      if (room.publicState && !await this.lease(grant.guestId).renew('room', room.id, grant.id)) throw new ServiceError('stale-session', 'Admission claim was cancelled or expired.', 409);
      const seat = await this.addSeat(room, opHash, JSON.stringify([grant.guestId, grant.id]), grant.alias, 'player', grant.guestId, Date.now());
      if (room.publicState) { const profile = await this.lease(grant.guestId).publicProfile(); if (profile) { seat.alias = profile.alias; seat.symbol = profile.symbol; } }
      grant.consumedByOperationHash = opHash; if (room.publicState) seat.reservationId = grant.id;
      if (room.phase === 'briefing' && grant.purpose !== 'replacement' && !room.lockedPlayerIds.includes(seat.id)) { room.lockedPlayerIds.push(seat.id); seat.eligible = true; }
      if (grant.purpose === 'replacement' && room.publicState && !room.publicState.ready.includes(seat.id)) room.publicState.ready.push(seat.id);
      await this.persisted(room);
      return Response.json(await this.entryResponse(room, seat), { headers: { 'Cache-Control': 'no-store' } });
    }
    if (path === '/internal/snapshot' && request.method === 'GET') {
      const seat = await this.auth(room, request); touch(room, Date.now()); await this.persisted(room, false);
      return Response.json({ snapshot: snapshot(room, Date.now()), controller: controller(seat) }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (path === '/internal/display' && request.method === 'POST') {
      const owner = await this.auth(room, request);
      if (owner.role !== 'player') throw new ServiceError('unauthorized', 'Only a participant can grant display access.', 403);
      if (this.limited(`display:${owner.id}`, 4, 60_000, Date.now())) throw new ServiceError('rate-limited', 'Display requests limited.', 429);
      const v = await body(request); exact(v, ['operationId']);
      const seat = await this.addSeat(room, await hash(operationId(v.operationId)), JSON.stringify(['display', owner.id]), 'Laboratory display', 'display', null, Date.now());
      await this.persisted(room);
      return Response.json(await this.entryResponse(room, seat), { headers: { 'Cache-Control': 'no-store' } });
    }
    if (path === '/internal/socket' && request.method === 'GET') {
      if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') throw new ServiceError('invalid-action', 'WebSocket upgrade required.', 426);
      const protocols = (request.headers.get('Sec-WebSocket-Protocol') ?? '').split(',').map(s => s.trim());
      if (!protocols.includes('mm-v3')) throw new ServiceError('stale-session', 'Current WebSocket protocol required.', 426);
      const seat = await this.tokenSeat(room, protocols.find(s => s.startsWith('token.'))?.slice(6) ?? '');
      if (this.limited(`connect:${seat.id}`, 10, 60_000, Date.now())) throw new ServiceError('rate-limited', 'Reconnect attempts limited.', 429);
      const existing = this.sockets(seat.id);
      if (existing.length && new URL(request.url).searchParams.get('replace') !== '1') throw new ServiceError('connection-active', 'Confirm replacement of the existing connection.', 409);
      for (const ws of existing) this.closeSocket(ws, 4001, 'Connection replaced');
      const pair = new WebSocketPair(); const client = pair[0]; const server = pair[1];
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({ sessionId: seat.id, connectionId: crypto.randomUUID(), openedAtMs: Date.now(), lastMessageAtMs: Date.now(), closed: false } satisfies Attachment);
      if (seat.guestId && seat.reservationId && !await this.lease(seat.guestId).renew('room', room.id, seat.reservationId, true)) { this.closeSocket(server, 4003, 'Admission cancelled'); throw new ServiceError('stale-session', 'Admission cancelled.', 409); }
      connect(room, seat, Date.now()); publicProgress(room, Date.now());
      await this.persisted(room);
      return new Response(null, { status: 101, webSocket: client, headers: { 'Sec-WebSocket-Protocol': 'mm-v3' } });
    }
    throw new ServiceError('not-found', 'Unknown room operation.', 404);
  }
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    return this.exclusive(async () => {
      const a = this.attachment(ws); const room = this.load(); if (!room || a.closed) return;
      const now = Date.now(); this.advance(room, now);
      if (room.phase === 'closed') { await this.expire(room); return; }
      const seat = room.seats.find(s => s.id === a.sessionId && !s.departed);
      if (seat && seat.guestId && seat.reservationId && !await this.lease(seat.guestId).renew('room', room.id, seat.reservationId)) disconnect(room, seat, now, true);
      if (!seat || seat.departed) { this.closeSocket(ws, 4003, 'Seat revoked'); await this.persisted(room); return; }
      if (a.closed) { await this.persisted(room); return; } // Reconciliation may have expired this socket.
      a.lastMessageAtMs = now; ws.serializeAttachment(a);
      let action: ClientAction;
      try {
        if (typeof message !== 'string' || new TextEncoder().encode(message).byteLength > 2048) { this.closeSocket(ws, 1009, 'Messages must be JSON under 2 KiB'); await this.persisted(room); return; }
        if (this.limited(`action:${seat.id}`, 30, 10_000, now)) throw new ServiceError('rate-limited', 'Too many actions.', 429);
        action = parseAction(JSON.parse(message));
      } catch (error) {
        this.send(ws, { ...this.envelope(), kind: 'action-rejected', actionId: '', code: error instanceof ServiceError ? error.code as ActionErrorCode : 'invalid-action', message: error instanceof ServiceError ? error.message : 'Invalid JSON.' });
        await this.persisted(room); return;
      }
      if (action.kind === 'sync-request') {
        touch(room, now); await this.persisted(room, false); this.sendSnapshots(ws, room); return;
      }
      const fingerprint = JSON.stringify(Object.entries(action).sort(([a], [b]) => a.localeCompare(b)));
      const previous = this.ctx.storage.sql.exec<{ fingerprint: string; result: string }>('SELECT fingerprint, result FROM action_receipts WHERE principal = ? AND action_id = ?', seat.id, action.actionId).toArray()[0];
      if (previous) {
        this.send(ws, previous.fingerprint === fingerprint ? { ...JSON.parse(previous.result), ...this.envelope() } : { ...this.envelope(), kind: 'action-rejected', actionId: action.actionId, code: 'idempotency-conflict', message: 'Action key already used for a different intent.' });
        await this.persisted(room); return;
      }
      if (this.ctx.storage.sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM action_receipts WHERE principal = ?', seat.id).one().n >= RECEIPT_LIMIT) {
        this.send(ws, { ...this.envelope(), kind: 'action-rejected', actionId: action.actionId, code: 'rate-limited', message: 'This seat reached its lifetime action limit.' });
        await this.persisted(room); return;
      }
      let result: ServerMessage;
      try {
        if (seat.role !== 'player' && action.kind !== 'leave') throw new ServiceError('unauthorized', 'Displays can only synchronize or leave.', 403);
        if (action.kind === 'leave') {
          disconnect(room, seat, now, true); touch(room, now); settle(room, now);
        } else if (action.kind === 'start-private-session' || action.kind === 'advance-private-round') {
          if (room.visibility !== 'private' || room.hostId !== seat.id) throw new ServiceError('unauthorized', 'Only the private laboratory host can start or advance.', 403);
          if (action.kind === 'start-private-session' && room.phase !== 'lobby') throw new ServiceError('wrong-phase', 'Start requires a lobby.', 409);
          if (action.kind === 'advance-private-round' && room.phase !== 'autopsy') throw new ServiceError('wrong-phase', 'Advance requires completed battle results.', 409);
          if (room.round === 3 && action.kind === 'advance-private-round') throw new ServiceError('wrong-phase', 'Session already completed.', 409);
          startRound(room, now); touch(room, now);
        } else if (action.kind === 'next-round-ready' || action.kind === 'public-replay-opt-in') {
          publicIntent(room, seat, action.kind, now);
        } else {
          if (action.kind === 'inject' && (room.phase !== 'experiment' || room.recovery || !seat.eligible || seat.finished)) throw new ServiceError('wrong-phase', 'Injections are locked in this phase.', 409);
          throw new ServiceError('not-implemented', 'DNA and switches belong to later milestones.', 501);
        }
        result = { ...this.envelope(), kind: 'action-accepted', actionId: action.actionId, revision: room.revision };
      } catch (error) {
        result = { ...this.envelope(), kind: 'action-rejected', actionId: action.actionId, code: error instanceof ServiceError ? error.code as ActionErrorCode : 'invalid-action', message: error instanceof ServiceError ? error.message : 'Intent rejected.' };
      }
      await this.ctx.storage.transaction(async () => {
        this.save(room);
        this.ctx.storage.sql.exec('INSERT INTO action_receipts VALUES(?, ?, ?, ?)', seat.id, action.actionId, fingerprint, JSON.stringify(result));
        await this.schedule(room);
      });
      await this.persisted(room, false);
      this.send(ws, result); this.broadcast(room);
      if (seat.departed) for (const socket of this.sockets(seat.id)) this.closeSocket(socket, 4002, 'You left the laboratory');
    });
  }
  private async socketClosed(ws: WebSocket) {
    const a = this.attachment(ws); if (!a || a.closed) return;
    a.closed = true; ws.serializeAttachment(a);
    const room = this.load(); if (!room) return;
    const now = Date.now(); this.advance(room, now);
    const seat = room.seats.find(s => s.id === a.sessionId);
    if (seat && !this.sockets(seat.id).length && seat.connected) disconnect(room, seat, now);
    await this.persisted(room);
  }
  async webSocketClose(ws: WebSocket): Promise<void> { return this.exclusive(() => this.socketClosed(ws)); }
  async webSocketError(ws: WebSocket): Promise<void> { return this.exclusive(() => this.socketClosed(ws)); }
  private async expire(room: StoredRoom) {
    for (const ws of this.sockets()) this.closeSocket(ws, 4004, 'Laboratory expired');
    {
      for (const seat of room.seats) if (seat.guestId && seat.reservationId) await this.lease(seat.guestId).release('room', room.id, seat.reservationId);
      for (const g of room.reservations) await this.lease(g.guestId).release('room', room.id, g.id);
      // Expired offers have their own bounded deadlines; no synchronous pool call here.
    }
    // Delete all room secrets, receipts and snapshots. A minimal tombstone distinguishes expiry from an unknown code.
    await this.ctx.storage.transaction(async () => {
      this.ctx.storage.sql.exec('DELETE FROM room_state');
      this.ctx.storage.sql.exec('DELETE FROM action_receipts');
      this.ctx.storage.sql.exec('DELETE FROM limits');
      this.ctx.storage.sql.exec('INSERT OR REPLACE INTO limits VALUES(?, ?, 1)', 'expired', room.createdAtMs + GAME_RULES.roomMaxLifetimeMs + GAME_RULES.roomIdleExpiryMs);
      await this.ctx.storage.setAlarm(room.createdAtMs + GAME_RULES.roomMaxLifetimeMs + GAME_RULES.roomIdleExpiryMs);
    });
  }
  async alarm(): Promise<void> {
    return this.exclusive(async () => {
      const room = this.load(); const now = Date.now();
      if (!room) {
        this.ctx.storage.sql.exec('DELETE FROM limits WHERE until_ms <= ?', now);
        this.ctx.storage.sql.exec('DELETE FROM private_codes WHERE expires_ms <= ?', now);
        const next = this.ctx.storage.sql.exec<{ until_ms: number }>('SELECT MIN(until_ms) AS until_ms FROM limits').toArray()[0]?.until_ms;
        const codeNext = this.ctx.storage.sql.exec<{ expires_ms: number }>('SELECT MIN(expires_ms) AS expires_ms FROM private_codes').toArray()[0]?.expires_ms;
        if (next || codeNext) await this.ctx.storage.setAlarm(Math.max(now + 1, Math.min(next || Infinity, codeNext || Infinity)));
        return;
      }
      this.advance(room, now);
      if (room.phase === 'closed') await this.expire(room); else await this.persisted(room);
    });
  }
  /** Coordinator-only: idempotent public allocation, with expiring single-owner grants. */
  async allocatePublic(input: PublicAllocation): Promise<ServiceResult<PublicGrant[]>> {
    return this.exclusive(async () => {
      try {
        const v = objectAllocation(input);
        const now = Date.now(); let room = this.load();
        if (!this.ctx.id.equals(this.env.ROOMS.idFromName(`room:${v.roomId}`))) throw new ServiceError('invalid-action', 'Allocation targets a different room identity.');
        if (!room && this.ctx.storage.sql.exec('SELECT key FROM limits WHERE key = ? AND until_ms > ?', 'expired', now).toArray().length) throw new ServiceError('room-expired', 'This allocation has expired.', 410);
        if (room) { this.advance(room, now); requireLive(room, now); }
        const fingerprint = JSON.stringify(v);
        if (room && (room.visibility !== 'public' || room.creationHash !== v.allocationId || room.creationFingerprint !== fingerprint)) throw new ServiceError('idempotency-conflict', 'Allocation already differs.', 409);
        room ??= newRoom(v.roomId, 'public', 'remote', randomSecret(), v.allocationId, fingerprint, now);
        if (v.region && !room.publicState) {
          room.publicState = { region: v.region, sessionId: crypto.randomUUID(), teamScore: 0, completed: [], ready: [], replay: [], resultsStartedAtMs: null };
          room.phaseDeadlineMs = now + GAME_RULES.matchmaking.readyCheckMs;
        }
        if (!room.reservations.length) {
          for (const member of v.members) {
            const token = await deriveToken(room.secret, `admission:${member.reservationId}`);
            room.reservations.push({ allocationId: v.allocationId, purpose: 'fresh', id: member.reservationId, guestId: member.guestId, alias: member.alias, tokenHash: await hash(token), expiresAtMs: now + GAME_RULES.matchmaking.readyCheckMs, cancelled: false, consumedByOperationHash: null });
          }
        }
        await this.persisted(room);
        const value = await Promise.all(room.reservations.map(async r => ({ reservationId: r.id, guestId: r.guestId, admissionToken: await deriveToken(room!.secret, `admission:${r.id}`), expiresAtMs: r.expiresAtMs })));
        return { ok: true, value };
      } catch (error) { return rpcError(error); }
    });
  }
  private lease(guestId: string) { return this.env.GUEST_LEASES.get(this.env.GUEST_LEASES.idFromName(`guest:${guestId}`)); }
  private offer(r: StoredRoom): ReplacementOffer | null {
    if (!r.publicState || !['autopsy', 'recovery-lobby'].includes(r.phase) || !r.phaseDeadlineMs) return null;
    const occupied = livePlayers(r).length;
    const reserved = r.reservations.filter(g => !g.cancelled && !g.consumedByOperationHash && g.expiresAtMs > Date.now()).length;
    const vacancies = GAME_RULES.maxPlayers - occupied - reserved;
    if (vacancies <= 0) return null;
    return { roomId: r.id, round: r.round ?? 1, teamScore: r.publicState.teamScore, reason: r.phase === 'autopsy' ? 'vacancy' : 'recovery', vacancies, deadlineMs: r.phaseDeadlineMs,
      remainingSessionMs: Math.max(0, (r.phase === 'autopsy' ? 3 : 4) - (r.round ?? 1)) * (GAME_RULES.briefingDurationMs + GAME_RULES.experimentDurationMs + GAME_RULES.releaseDurationMs + GAME_RULES.maxBattleDurationMs + GAME_RULES.publicResultsDurationMs) };
  }
  private async flushNotice() {
    const r = this.load(); const p = r?.publicState; const notice = p?.notice;
    if (!r || !p || !notice?.pending) return;
    await this.env.MATCHMAKING.get(this.env.MATCHMAKING.idFromName(`pool:${p.region}`)).announce(p.region, r.id, notice.revision, JSON.parse(notice.signature));
    await this.exclusive(async () => {
      const latest = this.load(); if (latest?.publicState?.notice?.signature === notice.signature && latest.publicState.notice.revision === notice.revision) { latest.publicState.notice.pending = false; this.save(latest); await this.schedule(latest); }
    });
  }
  private async maintainLeases(r: StoredRoom) {
    const now = Date.now(); let changed = false;
    for (const seat of r.seats) {
      if (!seat.guestId || !seat.reservationId) continue;
      if (seat.departed || r.phase === 'closed') { await this.lease(seat.guestId).release('room', r.id, seat.reservationId); continue; }
      if ((seat.leaseRenewAtMs ?? 0) > now) continue;
      if (!seat.connected && seat.disconnectDeadlineMs === null && ['autopsy', 'recovery-lobby', 'session-results', 'lobby'].includes(r.phase)) disconnect(r, seat, now, true);
      if (seat.departed) { await this.lease(seat.guestId).release('room', r.id, seat.reservationId); changed = true; continue; }
      if (!await this.lease(seat.guestId).renew('room', r.id, seat.reservationId)) {
        disconnect(r, seat, now, true); for (const ws of this.sockets(seat.id)) this.closeSocket(ws, 4003, 'Guest claim expired');
      }
      seat.leaseRenewAtMs = now + 45_000; changed = true;
    }
    for (const grant of r.reservations) if (grant.cancelled && !grant.consumedByOperationHash) await this.lease(grant.guestId).release('room', r.id, grant.id);
    if (changed) { this.save(r); await this.schedule(r); }
  }
  /** Binding-only boundary for the future authoritative battle producer; never a browser route. */
  async finishPublicBattle(sessionId: string, completionId: string, outcome: 'victory' | 'draw' | 'defeat'): Promise<ServiceResult<null>> {
    return this.exclusive(async () => {
      try {
        operationId(sessionId); operationId(completionId);
        if (!['victory', 'draw', 'defeat'].includes(outcome)) throw new ServiceError('invalid-action', 'Invalid outcome.');
        const r = this.load(); if (!r) throw new ServiceError('room-not-found', 'No room.', 404);
        this.advance(r, Date.now()); requireLive(r, Date.now()); completePublicRound(r, sessionId, completionId, outcome, Date.now());
        await this.persisted(r); return { ok: true, value: null };
      } catch (error) { return rpcError(error); }
    });
  }
  async reserveReplacements(allocationId: string, region: MatchmakingRegion, members: PublicAllocation['members'], expires: number): Promise<ServiceResult<PublicGrant[]>> {
    return this.exclusive(async () => {
      try {
        operationId(allocationId); const r = this.load(); const now = Date.now();
        if (!r?.publicState || r.publicState.region !== region) throw new ServiceError('room-not-found', 'Public laboratory unavailable.', 404);
        this.advance(r, now); requireLive(r, now);
        const prior = r.reservations.filter(g => g.allocationId === allocationId);
        if (!prior.length) {
          if (!['autopsy', 'recovery-lobby'].includes(r.phase) || !r.phaseDeadlineMs || expires <= now) throw new ServiceError('wrong-phase', 'Replacement window ended.', 409);
          if (!Array.isArray(members) || !members.length || members.length > 8) throw new ServiceError('invalid-action', 'Invalid replacements.');
          if (members.length > (this.offer(r)?.vacancies ?? 0) || r.reservations.length + members.length > 128) throw new ServiceError('room-full', 'Replacement capacity reached.', 409);
          const ids = new Set<string>(); const guests = new Set<string>();
          for (const m of members) {
            operationId(m.guestId); operationId(m.reservationId); alias(m.alias);
            if (ids.has(m.reservationId) || guests.has(m.guestId) || r.reservations.some(g => g.id === m.reservationId) || livePlayers(r).some(s => s.guestId === m.guestId)) throw new ServiceError('invalid-action', 'Duplicate replacement.');
            ids.add(m.reservationId); guests.add(m.guestId);
            r.reservations.push({ id: m.reservationId, allocationId, purpose: 'replacement', guestId: m.guestId, alias: m.alias, tokenHash: await hash(await deriveToken(r.secret, `admission:${m.reservationId}`)), expiresAtMs: Math.min(expires, r.phaseDeadlineMs), cancelled: false, consumedByOperationHash: null });
          }
          r.revision++; await this.persisted(r);
        } else if (JSON.stringify(prior.map(g => [g.id, g.guestId, g.alias])) !== JSON.stringify(members.map(m => [m.reservationId, m.guestId, m.alias]))) throw new ServiceError('idempotency-conflict', 'Replacement allocation differs.', 409);
        return { ok: true, value: await Promise.all(r.reservations.filter(g => g.allocationId === allocationId).map(async g => ({ reservationId: g.id, guestId: g.guestId, admissionToken: await deriveToken(r.secret, `admission:${g.id}`), expiresAtMs: g.expiresAtMs }))) };
      } catch (error) { return rpcError(error); }
    });
  }
  async revokeAdmission(guestId: string, reservationId: string): Promise<ServiceResult<null>> {
    return this.exclusive(async () => {
      try {
        const r = this.load(); const grant = r?.reservations.find(g => g.guestId === guestId && g.id === reservationId);
        if (!r || !grant) throw new ServiceError('room-not-found', 'Reservation not found.', 404);
        grant.cancelled = true; r.revision++;
        const seat = r.seats.find(s => s.operationHash === grant.consumedByOperationHash);
        if (seat) { disconnect(r, seat, Date.now(), true); for (const ws of this.sockets(seat.id)) this.closeSocket(ws, 4003, 'Admission revoked'); }
        await this.persisted(r); return { ok: true, value: null };
      } catch (error) { return rpcError(error); }
    });
  }
  /** Cancellation and consumption serialize in the room; cancelling revokes even a raced admission. */
  async cancelPublicReservation(allocationId: string, reservationId: string): Promise<ServiceResult<null>> {
    return this.exclusive(async () => {
      try {
        const room = this.load(); if (!room || room.visibility !== 'public' || room.creationHash !== allocationId) throw new ServiceError('unauthorized', 'Allocation mismatch.', 403);
        this.advance(room, Date.now()); requireLive(room, Date.now());
        const reservation = room.reservations.find(r => r.id === reservationId);
        if (!reservation) throw new ServiceError('invalid-action', 'Unknown reservation.');
        reservation.cancelled = true;
        if (reservation.consumedByOperationHash) {
          const seat = room.seats.find(s => s.operationHash === reservation.consumedByOperationHash);
          if (seat) { disconnect(room, seat, Date.now(), true); for (const ws of this.sockets(seat.id)) this.closeSocket(ws, 4003, 'Admission cancelled'); }
        }
        await this.persisted(room); return { ok: true, value: null };
      } catch (error) { return rpcError(error); }
    });
  }
}
function rpcError(error: unknown): { ok: false; code: string; message: string; status: number } {
  return error instanceof ServiceError ? { ok: false, code: error.code, message: error.message, status: error.status } : { ok: false, code: 'temporarily-unavailable', message: 'Room operation failed.', status: 503 };
}
function objectAllocation(input: PublicAllocation): PublicAllocation {
  if (!input || !PUBLIC_ID.test(input.roomId) || !Array.isArray(input.members) || input.members.length < 2 || input.members.length > 8) throw new ServiceError('invalid-action', 'Public allocation requires an opaque room ID and 2–8 unique members.');
  operationId(input.allocationId);
  if (input.region && !GAME_RULES.matchmaking.regions.includes(input.region)) throw new ServiceError('invalid-action', 'Invalid pool region.');
  const guests = new Set<string>(); const reservations = new Set<string>();
  for (const member of input.members) {
    operationId(member.guestId); operationId(member.reservationId); alias(member.alias);
    if (guests.has(member.guestId) || reservations.has(member.reservationId)) throw new ServiceError('invalid-action', 'Duplicate allocation member.');
    guests.add(member.guestId); reservations.add(member.reservationId);
  }
  return input;
}
