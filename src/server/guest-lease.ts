import { DurableObject } from 'cloudflare:workers';
import type { WorkerEnv } from './env.ts';
import type { GuestCredentials } from '../shared/matchmaking.ts';
import type { MatchmakingRegion } from '../shared/rules.ts';
import { deriveToken, hash, randomSecret } from './security.ts';
import { operationId } from './validation.ts';
export const LEASE_MS = 120_000;
export interface Holder { kind: 'queue' | 'room'; id: string; nonce: string; region: MatchmakingRegion; ticketId: string; committed: boolean; expiresAtMs: number }
interface Identity { guestId: string; secret: string; tokenHash: string; alias: string; symbol: string; holder: Holder | null; revision: number; expiresAtMs: number }
const adjectives = ['Grim', 'Velvet', 'Crooked', 'Cobalt', 'Mourning', 'Ashen', 'Brittle', 'Hollow'];
const nouns = ['Curator', 'Alchemist', 'Archivist', 'Doctor', 'Warden', 'Scholar', 'Keeper', 'Observer'];
export class GuestLease extends DurableObject<WorkerEnv> {
  private tail: Promise<unknown> = Promise.resolve();
  constructor(ctx: DurableObjectState, env: WorkerEnv) {
    super(ctx, env);
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS identity(singleton INTEGER PRIMARY KEY, record TEXT NOT NULL)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS issued(operation_hash TEXT PRIMARY KEY, guest_id TEXT NOT NULL, expires_ms INTEGER NOT NULL)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS cancelled(ticket_id TEXT PRIMARY KEY, expires_ms INTEGER NOT NULL)');
  }
  private exclusive<T>(work: () => Promise<T>) { const result = this.tail.then(work); this.tail = result.catch(() => undefined); return result; }
  private load(): Identity | null {
    const row = this.ctx.storage.sql.exec<{ record: string }>('SELECT record FROM identity WHERE singleton = 1').toArray()[0];
    return row ? JSON.parse(row.record) : null;
  }
  private async save(identity: Identity, touch = true) {
    identity.revision++; if (touch) identity.expiresAtMs = Date.now() + 24 * 60 * 60_000;
    await this.ctx.storage.transaction(async () => {
      this.ctx.storage.sql.exec('INSERT OR REPLACE INTO identity VALUES(1, ?)', JSON.stringify(identity));
      await this.ctx.storage.setAlarm(identity.holder?.expiresAtMs ?? identity.expiresAtMs);
    });
  }
  private blocked(ticketId: string) { return this.ctx.storage.sql.exec('SELECT ticket_id FROM cancelled WHERE ticket_id = ? AND expires_ms > ?', ticketId, Date.now()).toArray().length > 0; }
  /** Called on the issuer control object; identity/credential issuance is replay-safe. */
  async issue(operation: string): Promise<GuestCredentials> {
    return this.exclusive(async () => {
      operationId(operation); const digest = await hash(operation); const now = Date.now();
      this.ctx.storage.sql.exec('DELETE FROM issued WHERE expires_ms <= ?', now);
      let id = this.ctx.storage.sql.exec<{ guest_id: string }>('SELECT guest_id FROM issued WHERE operation_hash = ?', digest).toArray()[0]?.guest_id;
      if (!id) {
        if (this.ctx.storage.sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM issued').one().n >= 4096) throw new Error('Guest issuance capacity reached');
        id = crypto.randomUUID(); this.ctx.storage.sql.exec('INSERT INTO issued VALUES(?, ?, ?)', digest, id, now + 24 * 60 * 60_000);
      }
      await this.ctx.storage.setAlarm(now + 24 * 60 * 60_000);
      return this.env.GUEST_LEASES.get(this.env.GUEST_LEASES.idFromName(`guest:${id}`)).initialize(id);
    });
  }
  async initialize(guestId: string): Promise<GuestCredentials> {
    return this.exclusive(async () => {
      operationId(guestId);
      if (!this.ctx.id.equals(this.env.GUEST_LEASES.idFromName(`guest:${guestId}`))) throw new Error('Guest identity mismatch');
      let identity = this.load();
      if (!identity) {
        const n = crypto.getRandomValues(new Uint8Array(3)); const secret = randomSecret();
        identity = { guestId, secret, tokenHash: await hash(await deriveToken(secret, 'guest-access')), alias: `${adjectives[n[0]! % 8]} ${nouns[n[1]! % 8]}`, symbol: ['☽', '♜', '⚗', '✦', '☿', '♠', '☼', '⚙'][n[2]! % 8]!, holder: null, revision: 0, expiresAtMs: 0 };
        await this.save(identity);
      }
      return { guestId, accessToken: await deriveToken(identity.secret, 'guest-access'), alias: identity.alias, symbol: identity.symbol };
    });
  }
  async publicProfile(): Promise<{ alias: string; symbol: string } | null> {
    const i = this.load(); return i && i.expiresAtMs > Date.now() ? { alias: i.alias, symbol: i.symbol } : null;
  }
  async authenticate(token: string): Promise<{ guestId: string; alias: string; symbol: string } | null> {
    return this.exclusive(async () => {
      const i = this.load();
      if (!i || i.expiresAtMs <= Date.now() || !/^[A-Za-z0-9_-]{43}$/.test(token) || await hash(token) !== i.tokenHash) return null;
      return { guestId: i.guestId, alias: i.alias, symbol: i.symbol };
    });
  }
  async acquireQueue(ticketId: string, region: MatchmakingRegion): Promise<boolean> {
    return this.exclusive(async () => {
      const i = this.load(); if (!i || this.blocked(ticketId)) return false;
      if (i.holder && i.holder.expiresAtMs > Date.now()) return i.holder.kind === 'queue' && i.holder.id === ticketId && i.holder.region === region;
      i.holder = { kind: 'queue', id: ticketId, nonce: ticketId, ticketId, region, committed: false, expiresAtMs: Date.now() + LEASE_MS }; await this.save(i); return true;
    });
  }
  /** Issued public identities also claim private player seats; legacy invitation guests remain supported. */
  async acquirePrivate(roomId: string, nonce: string): Promise<boolean> {
    return this.exclusive(async () => {
      const i = this.load(); if (!i) return false;
      const h = i.holder;
      if (h && h.expiresAtMs > Date.now()) return h.kind === 'room' && h.id === roomId && h.nonce === nonce;
      i.holder = { kind: 'room', id: roomId, nonce, ticketId: nonce, region: 'americas', committed: true, expiresAtMs: Date.now() + LEASE_MS }; await this.save(i); return true;
    });
  }
  async moveToRoom(ticketId: string, region: MatchmakingRegion, roomId: string, reservationId: string): Promise<boolean> {
    return this.exclusive(async () => {
      const i = this.load(); const h = i?.holder;
      if (!i || !h || h.expiresAtMs <= Date.now() || this.blocked(ticketId)) return false;
      if (h.kind === 'room') return h.id === roomId && h.nonce === reservationId && h.ticketId === ticketId;
      if (h.id !== ticketId || h.region !== region) return false;
      i.holder = { ...h, kind: 'room', id: roomId, nonce: reservationId, committed: false, expiresAtMs: Date.now() + LEASE_MS }; await this.save(i); return true;
    });
  }
  async renew(kind: Holder['kind'], id: string, nonce: string, commit = false): Promise<boolean> {
    return this.exclusive(async () => {
      const i = this.load(); const h = i?.holder;
      if (!i || !h || h.expiresAtMs <= Date.now() || h.kind !== kind || h.id !== id || h.nonce !== nonce || this.blocked(h.ticketId)) return false;
      h.expiresAtMs = Date.now() + LEASE_MS; if (commit) h.committed = true;
      await this.save(i); return true;
    });
  }
  async expirePending(roomId: string, nonce: string): Promise<boolean> {
    return this.exclusive(async () => {
      const i = this.load(); if (!i) return true;
      const h = i.holder;
      if (h?.kind === 'room' && h.id === roomId && h.nonce === nonce && h.committed) return false;
      if (h?.kind === 'room' && h.id === roomId && h.nonce === nonce) { i.holder = null; await this.save(i); }
      return true;
    });
  }
  async release(kind: Holder['kind'], id: string, nonce: string): Promise<boolean> {
    return this.exclusive(async () => {
      const i = this.load(); const h = i?.holder;
      if (!i || !h || h.kind !== kind || h.id !== id || h.nonce !== nonce) return false;
      i.holder = null; await this.save(i); return true;
    });
  }
  /** Cancellation fences allocation before the coordinator handles the request. */
  async cancelTicket(ticketId: string): Promise<{ allowed: boolean; holder: Holder | null }> {
    return this.exclusive(async () => {
      operationId(ticketId);
      const i = this.load(); if (!i) return { allowed: false, holder: null };
      this.ctx.storage.sql.exec('DELETE FROM cancelled WHERE expires_ms <= ?', Date.now());
      if (!this.blocked(ticketId) && this.ctx.storage.sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM cancelled').one().n >= 1024) throw new Error('Cancellation capacity reached');
      const h = i.holder;
      if (h?.ticketId === ticketId && h.committed) return { allowed: false, holder: h };
      this.ctx.storage.sql.exec('INSERT OR REPLACE INTO cancelled VALUES(?, ?)', ticketId, Date.now() + 24 * 60 * 60_000);
      if (h?.ticketId === ticketId) i.holder = null;
      await this.save(i); return { allowed: true, holder: h?.ticketId === ticketId ? h : null };
    });
  }
  async rollback(ticketId: string, roomId: string, reservationId: string): Promise<boolean> {
    return this.exclusive(async () => {
      const i = this.load(); const h = i?.holder;
      if (!i || !h || h.kind !== 'room' || h.id !== roomId || h.nonce !== reservationId || h.committed || this.blocked(ticketId)) return false;
      i.holder = { ...h, kind: 'queue', id: ticketId, nonce: ticketId, expiresAtMs: Date.now() + LEASE_MS }; await this.save(i); return true;
    });
  }
  async alarm() {
    return this.exclusive(async () => {
      const now = Date.now(); this.ctx.storage.sql.exec('DELETE FROM issued WHERE expires_ms <= ?', now); this.ctx.storage.sql.exec('DELETE FROM cancelled WHERE expires_ms <= ?', now);
      const i = this.load();
      if (i) {
        if (i.expiresAtMs <= now) this.ctx.storage.sql.exec('DELETE FROM identity');
        else { if (i.holder && i.holder.expiresAtMs <= now) i.holder = null; await this.save(i, false); }
      }
      const next = this.ctx.storage.sql.exec<{ n: number | null }>('SELECT MIN(expires_ms) AS n FROM issued').one().n;
      if (!i && next) await this.ctx.storage.setAlarm(next);
    });
  }
}
