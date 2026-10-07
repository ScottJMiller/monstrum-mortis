import assert from 'node:assert/strict';
import test from 'node:test';
import { advanceQueue, newPool, queueDeadline } from '../src/server/queue-model.ts';
import type { Ticket } from '../src/server/queue-model.ts';
import { newRoom, connect, disconnect, settle, publicProgress, publicIntent, completePublicRound, snapshot } from '../src/server/room-model.ts';
import type { Seat } from '../src/server/room-model.ts';
import { GAME_RULES as R } from '../src/shared/rules.ts';
const uid = () => crypto.randomUUID();
function ticket(time: number, mode: Ticket['mode'] = 'fresh-session'): Ticket { return { id: uid(), guestId: uid(), alias: 'Grim Curator', enteredAtMs: time, lastSeenAtMs: time, mode, state: 'waiting', ready: false, checkId: null, admission: null }; }
test('FIFO four-player trigger fills to six, preserves check deadline, and separates fresh/fill consent', () => {
  const p = newPool(); p.tickets = [0, 1, 2, 3].map(t => ticket(t)); advanceQueue(p, 4, uid);
  assert.equal(p.checks.length, 1); assert.equal(p.checks[0]!.deadlineMs, 10004);
  p.tickets.push(ticket(5), ticket(6), ticket(7), ticket(8, 'fill-existing-laboratory')); advanceQueue(p, 8, uid);
  assert.deepEqual(p.checks[0]!.members, p.tickets.slice(0, 6).map(t => t.id)); assert.equal(p.checks[0]!.deadlineMs, 10004);
  assert.equal(p.tickets[6]!.state, 'waiting'); assert.equal(p.tickets[7]!.state, 'waiting');
});
test('low population waits for two and the oldest thirty-second deadline', () => {
  const p = newPool(); p.tickets.push(ticket(0)); advanceQueue(p, 60000, uid); assert.equal(p.checks.length, 0);
  p.tickets.push(ticket(60000)); advanceQueue(p, 60000, uid); assert.equal(p.checks.length, 1);
  const q = newPool(); q.tickets = [ticket(0), ticket(1)]; advanceQueue(q, 29999, uid); assert.equal(q.checks.length, 0); assert.equal(queueDeadline(q, 0), 30000);
  advanceQueue(q, 30000, uid); assert.equal(q.checks.length, 1);
});
test('failed readiness retains confirmed priority and makes missing guests explicitly inactive', () => {
  const p = newPool(); p.tickets = [0,1,2,3].map(t => ticket(t)); advanceQueue(p, 4, uid); p.tickets[0]!.ready = true;
  advanceQueue(p, 10004, uid); assert.equal(p.allocations.length, 0); assert.equal(p.tickets[0]!.state, 'waiting'); assert.equal(p.tickets[0]!.enteredAtMs, 0);
  assert.ok(p.tickets.slice(1).every(t => t.state === 'inactive'));
});
test('cancelled member cannot be selected; only confirmed owners receive a journal reservation', () => {
  const p = newPool(); p.tickets = [0,1,2,3].map(t => ticket(t)); advanceQueue(p, 4, uid);
  p.tickets[0]!.ready = true; p.tickets[1]!.ready = true; p.tickets[2]!.ready = true; p.tickets[2]!.state = 'cancelled';
  advanceQueue(p, 10004, uid); assert.equal(p.allocations.length, 1); assert.deepEqual(p.allocations[0]!.members.map(m => m.ticketId), p.tickets.slice(0,2).map(t => t.id));
  assert.equal(new Set(p.allocations[0]!.members.map(m => m.reservationId)).size, 2);
});
test('replacement offers disclose context and expire within the results window', () => {
  const p = newPool(); const fill = ticket(0, 'fill-existing-laboratory'); p.tickets = [ticket(0), fill];
  p.offers.push({ roomId: `p-${uid()}`, round: 2, teamScore: 100, remainingSessionMs: 240000, reason: 'recovery', vacancies: 1, deadlineMs: 25000, revision: 1 });
  advanceQueue(p, 20000, uid); assert.equal(p.tickets[0]!.state, 'waiting'); assert.equal(fill.state, 'ready-check'); assert.equal(p.checks[0]!.offer?.teamScore, 100); assert.equal(p.checks[0]!.deadlineMs, 24500);
  fill.ready = true; advanceQueue(p, 24500, uid); assert.equal(p.allocations[0]!.expiresAtMs, 25000);
});
function publicRoom(n = 2) {
  const r = newRoom(`p-${uid()}`, 'public', 'remote', 'hidden', uid(), '', 0);
  r.publicState = { sessionId: uid(), region: 'americas', teamScore: 0, completed: [], ready: [], replay: [], resultsStartedAtMs: null };
  for (let i = 0; i < n; i++) {
    const s: Seat = { id: uid(), guestId: uid(), alias: 'Hollow Scholar', symbol: '*', role: 'player', operationHash: uid(), entryFingerprint: '', tokenHash: 'secret', joinedAtMs: 0, connected: false, connectedAtMs: null, disconnectDeadlineMs: null, eligible: true, finished: false, departed: false, remainingDoses: 0, nextInjectionAtMs: 0 };
    r.seats.push(s); connect(r, s, 0);
  }
  publicProgress(r, 0); return r;
}
function finish(r: ReturnType<typeof publicRoom>, at: number) { r.phase = 'battle'; r.phaseDeadlineMs = null; completePublicRound(r, r.publicState!.sessionId, uid(), 'victory', at); }
test('hostless public start and binding completion gate: no fabricated outcome, duplicate score, or early advance', () => {
  const r = publicRoom(); assert.equal(r.hostId, null); assert.equal(r.phase, 'briefing');
  settle(r, 88000); assert.equal(r.phase, 'battle'); assert.equal(r.publicState!.completed.length, 0);
  const completion = uid(); completePublicRound(r, r.publicState!.sessionId, completion, 'victory', 90000);
  completePublicRound(r, r.publicState!.sessionId, completion, 'victory', 90001); assert.equal(r.publicState!.teamScore, 100);
  assert.throws(() => completePublicRound(r, r.publicState!.sessionId, completion, 'draw', 90001));
  for (const s of r.seats) publicIntent(r, s, 'next-round-ready', 91000);
  settle(r, 99999); assert.equal(r.phase, 'autopsy'); settle(r, 100000); assert.equal(r.phase, 'briefing'); assert.equal(r.round, 2);
  const projection = JSON.stringify(snapshot(r, 100001)); for (const secret of ['tokenHash', 'operationHash', 'guestId', 'completionId', 'hidden']) assert.ok(!projection.includes(secret));
});
test('results deadline, three-round regroup opt-in and reset score leave nonparticipants behind', () => {
  const r = publicRoom(3);
  finish(r, 100); settle(r, 25100); assert.equal(r.round, 2);
  finish(r, 30000); settle(r, 55000); assert.equal(r.round, 3);
  finish(r, 60000); assert.equal(r.phase, 'session-results'); const session = r.publicState!.sessionId;
  publicIntent(r, r.seats[0]!, 'public-replay-opt-in', 60001); publicIntent(r, r.seats[1]!, 'public-replay-opt-in', 60002);
  settle(r, 89999); assert.equal(r.publicState!.sessionId, session);
  settle(r, 90000); assert.equal(r.phase, 'briefing'); assert.notEqual(r.publicState!.sessionId, session); assert.equal(r.publicState!.teamScore, 0); assert.equal(r.round, 1); assert.equal(r.seats[2]!.departed, true);
});
test('recovery abandons only unfinished attempt, retries same round with two confirmations, timeout never queues', () => {
  const r = publicRoom(); r.publicState!.teamScore = 100; r.round = 2; settle(r, 8000);
  disconnect(r, r.seats[1]!, 9000); settle(r, 54000); assert.equal(r.phase, 'recovery-lobby'); assert.equal(r.phaseDeadlineMs, 114000); assert.equal(r.round, 2);
  connect(r, r.seats[1]!, 55000); publicIntent(r, r.seats[0]!, 'next-round-ready', 55001); publicIntent(r, r.seats[1]!, 'next-round-ready', 55002);
  assert.equal(r.phase, 'briefing'); assert.equal(r.round, 2); assert.equal(r.publicState!.teamScore, 100); assert.equal(r.seats[1]!.finished, false);
  const timed = publicRoom(); timed.phase = 'recovery-lobby'; timed.phaseDeadlineMs = 60000; settle(timed, 60000);
  assert.equal(timed.phase, 'session-results'); assert.equal(timed.phaseDeadlineMs, null); assert.equal(timed.publicState!.replay.length, 0);
});
test('fewer than two replay opt-ins keep completed results and offer an explicit exit', () => {
  const r = publicRoom(); r.round = 3; finish(r, 1000); publicIntent(r, r.seats[0]!, 'public-replay-opt-in', 1001); settle(r, 31000);
  assert.equal(r.phase, 'session-results'); assert.equal(r.phaseDeadlineMs, null); assert.equal(r.publicState!.teamScore, 100);
  assert.throws(() => publicIntent(r, r.seats[1]!, 'public-replay-opt-in', 31001));
});

test('initialized DNA participation counters prompt idle players; acknowledgment retains a seat and silent inactivity expires it', () => {
  const r = publicRoom(3);
  for (const s of r.seats) { s.injectionsThisRound = 0; s.interactedThisRound = false; }
  r.seats[0]!.injectionsThisRound = 1;
  finish(r, 1000); assert.equal(snapshot(r, 1001).players[1]!.inactivityPrompt, true);
  publicIntent(r, r.seats[1]!, 'next-round-ready', 1002);
  settle(r, 26000); assert.equal(r.seats[2]!.departed, true); assert.equal(r.seats[1]!.departed, false); assert.equal(r.phase, 'briefing');
});

for (const playerCount of [3, 4, 5, 6]) {
 test(`all ${playerCount} fresh admissions join round one when sockets connect after the first two start briefing`, () => {
  const room=publicRoom(playerCount); room.phase='lobby'; room.round=null; room.phaseDeadlineMs=null; room.lockedPlayerIds=[];
  for (const seat of room.seats) {
   seat.connected=false; seat.connectedAtMs=null; seat.reservationId=uid();
   room.reservations.push({id:seat.reservationId,guestId:seat.guestId!,alias:seat.alias,tokenHash:'hidden',expiresAtMs:10000,cancelled:false,consumedByOperationHash:seat.operationHash,purpose:'fresh'});
  }
  connect(room,room.seats[0]!,1); publicProgress(room,1);
  connect(room,room.seats[1]!,2); publicProgress(room,2);
  assert.equal(room.phase,'briefing'); const deadline=room.phaseDeadlineMs;
  for (const seat of room.seats.slice(2)) connect(room,seat,3);
  assert.equal(room.phaseDeadlineMs,deadline);
  assert.ok(snapshot(room,3).players.every(p=>!p.waitingForNextRound));
  settle(room,deadline!);
  assert.equal(room.playerCountAtExperimentStart,playerCount);
  assert.equal(new Set(room.lockedPlayerIds).size,playerCount);
 });
}
test('briefing reconnect does not admit replacements, expired-grace viewers, or new participants after experiment starts', () => {
 const r=publicRoom(3);const seat=r.seats[2]!;seat.connected=false;seat.eligible=false;r.lockedPlayerIds=r.lockedPlayerIds.filter(id=>id!==seat.id);seat.reservationId=uid();
 const grant={id:seat.reservationId,guestId:seat.guestId!,alias:seat.alias,tokenHash:'hidden',expiresAtMs:10000,cancelled:false,consumedByOperationHash:seat.operationHash,purpose:'replacement' as 'fresh'|'replacement'};
 r.reservations.push(grant);connect(r,seat,1);assert.equal(seat.eligible,false);
 grant.purpose='fresh';seat.finished=true;connect(r,seat,2);assert.equal(seat.eligible,false);
 seat.finished=false;r.phase='experiment';connect(r,seat,3);assert.equal(seat.eligible,false);
});
