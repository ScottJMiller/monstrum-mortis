import { DurableObject } from 'cloudflare:workers';
import { GAME_RULES as R } from '../shared/rules.ts';
import type { MatchmakingRegion } from '../shared/rules.ts';
import { PROTOCOL_VERSION } from '../shared/protocol.ts';
import type { PublicQueueStatus, ReplacementOffer } from '../shared/matchmaking.ts';
import type { WorkerEnv } from './env.ts';
import { advanceQueue, newPool, queueDeadline } from './queue-model.ts';
import type { Allocation, PoolModel, Ticket } from './queue-model.ts';
import { body, exact, failure, operationId, ServiceError } from './validation.ts';
interface Attachment { guestId: string; ticketId: string; openedAtMs: number; closed: boolean }
export class MatchmakingPool extends DurableObject<WorkerEnv> {
  private tail: Promise<unknown> = Promise.resolve();
  constructor(ctx: DurableObjectState, env: WorkerEnv) {
    super(ctx, env);
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS pool_state(singleton INTEGER PRIMARY KEY, region TEXT NOT NULL, record TEXT NOT NULL)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS notices(room_id TEXT PRIMARY KEY, revision INTEGER NOT NULL, expires_ms INTEGER NOT NULL)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS rate_limits(guest_id TEXT PRIMARY KEY, until_ms INTEGER NOT NULL, count INTEGER NOT NULL)');
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }
  private exclusive<T>(work: () => Promise<T>) { const result = this.tail.then(work); this.tail = result.catch(() => undefined); return result; }
  private load(): { region: MatchmakingRegion; model: PoolModel } | null {
    const row = this.ctx.storage.sql.exec<{ region: MatchmakingRegion; record: string }>('SELECT region, record FROM pool_state WHERE singleton = 1').toArray()[0];
    return row ? { region: row.region, model: JSON.parse(row.record) } : null;
  }
  private identify(region: string): MatchmakingRegion {
    if (!R.matchmaking.regions.includes(region as MatchmakingRegion) || !this.ctx.id.equals(this.env.MATCHMAKING.idFromName(`pool:${region}`))) throw new ServiceError('invalid-action', 'Invalid regional pool.');
    return region as MatchmakingRegion;
  }
  private lease(guestId: string) { return this.env.GUEST_LEASES.get(this.env.GUEST_LEASES.idFromName(`guest:${guestId}`)); }
  private attachment(ws: WebSocket) { return ws.deserializeAttachment() as Attachment; }
  private sockets() { return this.ctx.getWebSockets().filter(ws => !this.attachment(ws).closed); }
  private close(ws: WebSocket, reason: string) { const a = this.attachment(ws); a.closed = true; ws.serializeAttachment(a); try { ws.close(4001, reason); } catch { /* already closed */ } }
  private status(p: PoolModel, region: MatchmakingRegion, t: Ticket): PublicQueueStatus {
    const c = p.checks.find(c => c.id === t.checkId);
    return { protocolVersion: PROTOCOL_VERSION, serverTimeMs: Date.now(), ticketId: t.id, region, mode: t.mode, enteredAtMs: t.enteredAtMs, state: t.state,
      waitingPlayers: p.tickets.filter(x => x.state === 'waiting' && x.mode === t.mode).length, readyCheckId: c?.id ?? null, readyDeadlineMs: c?.deadlineMs ?? null,
      readyConfirmed: t.ready, offer: c?.offer ?? null, admission: t.admission, suggestAlternatives: t.state === 'waiting' && Date.now() - t.enteredAtMs >= R.matchmaking.alternatePoolSuggestionMs };
  }
  private broadcast(p: PoolModel, region: MatchmakingRegion) {
    for (const ws of this.sockets()) {
      const a = this.attachment(ws); const t = p.tickets.find(t => t.id === a.ticketId && t.guestId === a.guestId);
      if (!t) { this.close(ws, 'Queue ticket expired'); continue; }
      try { ws.send(JSON.stringify({ kind: 'queue-status', status: this.status(p, region, t) })); } catch { /* liveness cleanup handles loss */ }
    }
  }
  private async save(p: PoolModel, region: MatchmakingRegion) {
    await this.ctx.storage.transaction(async () => {
      this.ctx.storage.sql.exec('INSERT OR REPLACE INTO pool_state VALUES(1, ?, ?)', region, JSON.stringify(p));
      const active = p.tickets.some(t => ['waiting', 'ready-check', 'allocating'].includes(t.state) || (t.state === 'inactive' && Date.now() - t.lastSeenAtMs < 120_000));
      if (active) await this.ctx.storage.setAlarm(queueDeadline(p, Date.now()));
      else if (p.tickets.length || p.offers.length) await this.ctx.storage.setAlarm(Math.max(Date.now() + 1, Math.min(...p.tickets.map(t => t.lastSeenAtMs + R.roomIdleExpiryMs), ...p.offers.map(o => o.deadlineMs))));
      else await this.ctx.storage.deleteAlarm();
    });
    this.broadcast(p, region);
  }
  private async tick(p: PoolModel, region: MatchmakingRegion) {
    const now = Date.now();
    for (const t of p.tickets) {
      if (t.state === 'matched' && t.admission?.expiresAtMs && now >= t.admission.expiresAtMs && await this.lease(t.guestId).expirePending(t.admission.roomId, t.admission.reservationId)) { t.state = 'inactive'; t.admission = null; t.ready = false; }
      if (!['waiting', 'ready-check', 'inactive'].includes(t.state)) continue;
      for (const ws of this.sockets()) {
        const a = this.attachment(ws); if (a.ticketId !== t.id) continue;
        const ping = this.ctx.getWebSocketAutoResponseTimestamp(ws)?.getTime() ?? a.openedAtMs;
        if (now - ping < 60_000) t.lastSeenAtMs = Math.max(t.lastSeenAtMs, ping); else this.close(ws, 'Queue connection expired');
      }
      if (now - t.lastSeenAtMs >= 60_000) { t.state = 'inactive'; t.ready = false; }
      if (now - t.lastSeenAtMs < 60_000 && now >= (t.leaseRenewAtMs ?? 0)) {
        if (!await this.lease(t.guestId).renew('queue', t.id, t.id)) { t.state = 'inactive'; t.ready = false; }
        t.leaseRenewAtMs = now + 45_000;
      }
    }
    p.tickets = p.tickets.filter(t => now - t.lastSeenAtMs < R.roomIdleExpiryMs);
    p.allocations = p.allocations.filter(a => !a.done || a.expiresAtMs + R.roomIdleExpiryMs > now);
    advanceQueue(p, now, () => crypto.randomUUID());
    // Persist the allocation journal before making any cross-object calls.
    await this.save(p, region);
    for (const allocation of p.allocations.filter(a => !a.done)) await this.fulfill(p, region, allocation);
    await this.save(p, region);
  }
  private async fulfill(p: PoolModel, region: MatchmakingRegion, a: Allocation) {
    const room = this.env.ROOMS.get(this.env.ROOMS.idFromName(`room:${a.roomId}`));
    try {
      if (Date.now() >= a.expiresAtMs) { await this.rollback(p, a); return; }
      const members = a.members.map(m => ({ reservationId: m.reservationId, guestId: m.guestId, alias: m.alias, ticketId: m.ticketId }));
      const result = a.offer ? await room.reserveReplacements(a.id, region, members, a.expiresAtMs) : await room.allocatePublic({ allocationId: a.id, roomId: a.roomId, members, region });
      if (!result.ok) { await this.rollback(p, a); return; }
      const moved: typeof a.members = [];
      for (const member of a.members) if (await this.lease(member.guestId).moveToRoom(member.ticketId, region, a.roomId, member.reservationId)) moved.push(member);
      if (moved.length < (a.offer ? 1 : 2)) { await this.rollback(p, a); return; }
      for (const m of a.members) {
        const t = p.tickets.find(t => t.id === m.ticketId); if (!t) continue;
        if (!moved.includes(m)) { t.state = 'cancelled'; await room.revokeAdmission(m.guestId, m.reservationId); continue; }
        const grant = result.value.find(g => g.reservationId === m.reservationId)!;
        t.state = 'matched'; t.admission = { roomId: a.roomId, reservationId: m.reservationId, admissionToken: grant.admissionToken, expiresAtMs: grant.expiresAtMs };
      }
      a.done = true;
    } catch { /* Journal remains pending; an alarm retries the same allocation IDs and fences. */ }
  }
  private async rollback(p: PoolModel, a: Allocation) {
    const room = this.env.ROOMS.get(this.env.ROOMS.idFromName(`room:${a.roomId}`));
    for (const m of a.members) {
      const revoked = await room.revokeAdmission(m.guestId, m.reservationId);
      if (!revoked.ok && revoked.status !== 404) throw new Error('Admission rollback pending');
      const lease = this.lease(m.guestId);
      await lease.rollback(m.ticketId, a.roomId, m.reservationId);
      const t = p.tickets.find(t => t.id === m.ticketId);
      if (t) { t.state = await lease.acquireQueue(m.ticketId, this.load()!.region) ? 'waiting' : 'cancelled'; t.checkId = null; t.admission = null; }
    }
    a.done = true;
  }
  private async auth(request: Request) {
    const id = operationId(request.headers.get('X-Guest-Id'));
    const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer /, '');
    const identity = await this.lease(id).authenticate(token);
    if (!identity) throw new ServiceError('unauthorized', 'Guest access credential required.', 401);
    return identity;
  }
  async fetch(request: Request): Promise<Response> {
    try {
      // Fence cancellation outside the coordinator queue so it can interrupt allocation I/O.
      if (new URL(request.url).pathname.endsWith('/cancel')) {
        const guest = await this.auth(request); const v = await body(request.clone()); exact(v, ['ticketId']); const ticketId = operationId(v.ticketId);
        const cancelled = await this.lease(guest.guestId).cancelTicket(ticketId);
        if (!cancelled.allowed) throw new ServiceError('already-launched', 'This match has launched. Leave from the room instead.', 409);
        if (cancelled.holder?.kind === 'room') await this.env.ROOMS.get(this.env.ROOMS.idFromName(`room:${cancelled.holder.id}`)).revokeAdmission(guest.guestId, cancelled.holder.nonce);
      }
      return await this.exclusive(() => this.handle(request));
    } catch (error) { return failure(error); }
  }
  private async handle(request: Request): Promise<Response> {
    const url = new URL(request.url); const parts = url.pathname.split('/'); const region = this.identify(parts[2]!); const op = parts[3];
    const p = this.load()?.model ?? newPool();
    if (op === 'ping') return Response.json({ region, serverTimeMs: Date.now() }, { headers: { 'Cache-Control': 'no-store' } });
    const guest = await this.auth(request); const now = Date.now();
    if (op !== 'ping') {
      this.ctx.storage.sql.exec('DELETE FROM rate_limits WHERE until_ms <= ?', now);
      const count = this.ctx.storage.sql.exec<{ count: number }>('SELECT count FROM rate_limits WHERE guest_id = ?', guest.guestId).toArray()[0]?.count ?? 0;
      if (count >= 30) throw new ServiceError('rate-limited', 'Queue actions limited.', 429);
      this.ctx.storage.sql.exec('INSERT INTO rate_limits VALUES(?, ?, 1) ON CONFLICT(guest_id) DO UPDATE SET count = count + 1', guest.guestId, now + 10_000);
    }
    let t: Ticket | undefined;
    if (op === 'enter') {
      const v = await body(request); exact(v, ['operationId', 'mode']); const id = operationId(v.operationId);
      if (v.mode !== 'fresh-session' && v.mode !== 'fill-existing-laboratory') throw new ServiceError('invalid-action', 'Choose a queue mode explicitly.');
      t = p.tickets.find(t => t.id === id);
      if (t && (t.guestId !== guest.guestId || t.mode !== v.mode)) throw new ServiceError('idempotency-conflict', 'Ticket key reused.', 409);
      if (!t) {
        if (p.tickets.length >= 1000) throw new ServiceError('queue-full', 'This pool is at capacity. Choose another pool.', 503);
        if (!await this.lease(guest.guestId).acquireQueue(id, region)) throw new ServiceError('guest-busy', 'Leave or cancel the current queue/room before entering another pool.', 409);
        t = { id, guestId: guest.guestId, alias: guest.alias, mode: v.mode, enteredAtMs: now, lastSeenAtMs: now, leaseRenewAtMs: now + 45_000, state: 'waiting', checkId: null, ready: false, admission: null }; p.tickets.push(t);
      }
    } else {
      const v = request.method === 'GET' ? { ticketId: url.searchParams.get('ticketId') } : await body(request);
      exact(v, op === 'ready' ? ['ticketId', 'readyCheckId'] : ['ticketId']); const id = operationId(v.ticketId);
      t = p.tickets.find(t => t.id === id && t.guestId === guest.guestId);
      if (!t && op === 'cancel') return Response.json(this.status(p, region, { id, guestId: guest.guestId, alias: guest.alias, mode: 'fresh-session', enteredAtMs: now, lastSeenAtMs: now, state: 'cancelled', ready: false, checkId: null, admission: null }), { headers: { 'Cache-Control': 'no-store' } });
      if (!t) throw new ServiceError('ticket-not-found', 'Queue ticket not found.', 404);
      if (op === 'cancel') { t.state = 'cancelled'; t.ready = false; t.admission = null; }
      else if (op === 'ready') {
        const check = p.checks.find(c => c.id === t!.checkId);
        if (!check || check.id !== v.readyCheckId || check.deadlineMs <= now || t.state !== 'ready-check') {
          if (t.confirmedCheckId !== v.readyCheckId || t.state === 'cancelled') throw new ServiceError('ready-expired', 'This ready check has ended.', 409);
        } else { t.ready = true; t.confirmedCheckId = check.id; }
      } else if (op === 'resume') {
        if (!['inactive', 'waiting', 'ready-check'].includes(t.state)) throw new ServiceError('wrong-phase', 'Only an inactive ticket can resume.', 409);
        if (!await this.lease(guest.guestId).acquireQueue(t.id, region)) throw new ServiceError('guest-busy', 'Another queue or room owns this guest.', 409);
        if (t.state === 'inactive') { t.leaseRenewAtMs = 0; t.state = 'waiting'; t.ready = false; t.checkId = null; }
      } else if (op !== 'status' && op !== 'socket') throw new ServiceError('not-found', 'Unknown queue action.', 404);
    }
    t.lastSeenAtMs = now;
    if (op === 'socket') {
      if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') throw new ServiceError('invalid-action', 'WebSocket upgrade required.', 426);
      const old = this.sockets().filter(ws => this.attachment(ws).ticketId === t!.id);
      if (old.length && url.searchParams.get('replace') !== '1') throw new ServiceError('connection-active', 'Confirm replacement of the queue connection.', 409);
      for (const ws of old) this.close(ws, 'Queue connection replaced');
      const pair = new WebSocketPair(); this.ctx.acceptWebSocket(pair[1]); pair[1].serializeAttachment({ guestId: guest.guestId, ticketId: t.id, openedAtMs: now, closed: false } satisfies Attachment);
      await this.tick(p, region);
      return new Response(null, { status: 101, webSocket: pair[0], headers: { 'Sec-WebSocket-Protocol': 'mm-queue-v3' } });
    }
    await this.tick(p, region);
    return Response.json(this.status(p, region, t), { headers: { 'Cache-Control': 'no-store' } });
  }
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    return this.exclusive(async () => {
      const a = this.attachment(ws); const saved = this.load(); if (a.closed || !saved) return;
      // Queue intentions use authenticated HTTP; the socket is synchronization only.
      if (message !== 'sync') { this.close(ws, 'Use queue HTTP intentions'); return; }
      const last = this.ctx.storage.sql.exec<{ count: number }>('SELECT count FROM rate_limits WHERE guest_id = ? AND until_ms > ?', a.guestId, Date.now()).toArray()[0]?.count ?? 0;
      if (last >= 30) { this.close(ws, 'Queue synchronization limited'); return; }
      this.ctx.storage.sql.exec('DELETE FROM rate_limits WHERE until_ms <= ?', Date.now());
      this.ctx.storage.sql.exec('INSERT INTO rate_limits VALUES(?, ?, 1) ON CONFLICT(guest_id) DO UPDATE SET count = count + 1', a.guestId, Date.now() + 10_000);
      const t = saved.model.tickets.find(t => t.id === a.ticketId); if (t) t.lastSeenAtMs = Date.now();
      await this.tick(saved.model, saved.region);
    });
  }
  async webSocketClose(ws: WebSocket) { const a = this.attachment(ws); a.closed = true; ws.serializeAttachment(a); }
  async webSocketError(ws: WebSocket) { return this.webSocketClose(ws); }
  async alarm() { return this.exclusive(async () => { const saved = this.load(); if (saved) await this.tick(saved.model, saved.region); }); }
  /** Rooms publish only public vacancy context; stale notifications cannot resurrect offers. */
  async announce(regionInput: MatchmakingRegion, roomId: string, revision: number, offer: ReplacementOffer | null): Promise<void> {
    return this.exclusive(async () => {
      const region = this.identify(regionInput); const p = this.load()?.model ?? newPool();
      this.ctx.storage.sql.exec('DELETE FROM notices WHERE expires_ms <= ?', Date.now());
      if (this.ctx.storage.sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM notices').one().n >= 2000 && !this.ctx.storage.sql.exec('SELECT room_id FROM notices WHERE room_id = ?', roomId).toArray().length) throw new Error('Vacancy registry capacity reached');
      const previous = this.ctx.storage.sql.exec<{ revision: number }>('SELECT revision FROM notices WHERE room_id = ?', roomId).toArray()[0];
      if (previous && previous.revision > revision) return;
      this.ctx.storage.sql.exec('INSERT OR REPLACE INTO notices VALUES(?, ?, ?)', roomId, revision, Date.now() + R.roomMaxLifetimeMs);
      p.offers = p.offers.filter(o => o.roomId !== roomId); if (offer) p.offers.push({ ...offer, revision });
      await this.tick(p, region);
    });
  }
}
