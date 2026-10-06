import { GAME_RULES as R } from '../shared/rules.ts';
import type { ReplacementOffer } from '../shared/matchmaking.ts';
export interface Ticket {
  id: string; guestId: string; alias: string; enteredAtMs: number; lastSeenAtMs: number; leaseRenewAtMs?: number;
  mode: 'fresh-session' | 'fill-existing-laboratory';
  state: 'waiting' | 'ready-check' | 'allocating' | 'matched' | 'inactive' | 'cancelled';
  ready: boolean; confirmedCheckId?: string; checkId: string | null; admission: { roomId: string; reservationId: string; admissionToken: string; expiresAtMs: number } | null;
}
export interface ReadyCheck { id: string; members: string[]; deadlineMs: number; offer: ReplacementOffer | null }
export interface Allocation { id: string; roomId: string; members: { ticketId: string; guestId: string; alias: string; reservationId: string }[]; offer: ReplacementOffer | null; expiresAtMs: number; done: boolean }
export interface PoolModel { schemaVersion: 1; tickets: Ticket[]; checks: ReadyCheck[]; allocations: Allocation[]; offers: (ReplacementOffer & { revision: number })[] }
export const newPool = (): PoolModel => ({ schemaVersion: 1, tickets: [], checks: [], allocations: [], offers: [] });
export function advanceQueue(p: PoolModel, now: number, uuid: () => string): void {
  p.offers = p.offers.filter(o => o.deadlineMs > now);
  for (const check of [...p.checks]) {
    if (check.deadlineMs > now) continue;
    const selected = check.members.map(id => p.tickets.find(t => t.id === id)).filter((t): t is Ticket => !!t && t.state === 'ready-check');
    const ready = selected.filter(t => t.ready);
    const succeeds = ready.length >= (check.offer ? 1 : R.minPlayers);
    for (const t of selected) { t.checkId = null; t.state = t.ready ? (succeeds ? 'allocating' : 'waiting') : 'inactive'; }
    if (succeeds) {
      p.allocations.push({ id: uuid(), roomId: check.offer?.roomId ?? `p-${uuid()}`, members: ready.map(t => ({ ticketId: t.id, guestId: t.guestId, alias: t.alias, reservationId: uuid() })), offer: check.offer, expiresAtMs: Math.min(now + R.matchmaking.readyCheckMs, check.offer?.deadlineMs ?? Infinity), done: false });
    }
    p.checks = p.checks.filter(c => c.id !== check.id);
  }
  const ordered = (mode: Ticket['mode']) => p.tickets.filter(t => t.state === 'waiting' && t.mode === mode).sort((a, b) => a.enteredAtMs - b.enteredAtMs || a.id.localeCompare(b.id));
  // Fill open fresh checks to six without extending the original deadline.
  for (const c of p.checks) c.members = c.members.filter(id => p.tickets.some(t => t.id === id && t.state === 'ready-check'));
  for (const c of p.checks.filter(c => !c.offer)) {
    for (const t of ordered('fresh-session').slice(0, R.matchmaking.targetMaxPlayers - c.members.length)) { t.state = 'ready-check'; t.ready = false; t.checkId = c.id; c.members.push(t.id); }
  }
  for (;;) {
    const waiting = ordered('fresh-session');
    if (waiting.length < R.matchmaking.targetMinPlayers && !(waiting.length >= 2 && now - waiting[0]!.enteredAtMs >= R.matchmaking.smallGroupWaitMs)) break;
    const members = waiting.slice(0, R.matchmaking.targetMaxPlayers); const check: ReadyCheck = { id: uuid(), members: members.map(t => t.id), deadlineMs: now + R.matchmaking.readyCheckMs, offer: null };
    for (const t of members) { t.state = 'ready-check'; t.ready = false; t.checkId = check.id; }
    p.checks.push(check);
  }
  for (const offer of p.offers.sort((a, b) => a.deadlineMs - b.deadlineMs)) {
    if (p.checks.some(c => c.offer?.roomId === offer.roomId) || p.allocations.some(a => !a.done && a.roomId === offer.roomId)) continue;
    const members = ordered('fill-existing-laboratory').slice(0, offer.vacancies);
    if (!members.length || offer.deadlineMs - now < 1000) continue;
    const check: ReadyCheck = { id: uuid(), members: members.map(t => t.id), deadlineMs: Math.min(now + R.matchmaking.readyCheckMs, offer.deadlineMs - 500), offer };
    for (const t of members) { t.state = 'ready-check'; t.ready = false; t.checkId = check.id; } p.checks.push(check);
  }
}
export function queueDeadline(p: PoolModel, now: number): number {
  const waiting = p.tickets.filter(t => t.state === 'waiting' && t.mode === 'fresh-session');
  const fallback = waiting.length >= 2 ? Math.min(...waiting.map(t => t.enteredAtMs)) + R.matchmaking.smallGroupWaitMs : Infinity;
  return Math.max(now + 1, Math.min(now + 30_000, fallback, ...p.checks.map(c => c.deadlineMs), ...p.allocations.filter(a => !a.done).map(a => Math.min(now + 1000, a.expiresAtMs))));
}
