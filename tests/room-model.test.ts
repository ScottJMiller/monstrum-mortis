import assert from 'node:assert/strict';
import test from 'node:test';
import { GAME_RULES as R } from '../src/shared/rules.ts';
import { newRoom, connect, disconnect, settle, startRound, snapshot } from '../src/server/room-model.ts';
import type { Seat } from '../src/server/room-model.ts';
import { parseAction } from '../src/server/validation.ts';

function fixture(n = 2) {
  const room = newRoom('ABCDEF', 'private', 'remote', 'hidden', 'creation', 'fingerprint', 0);
  for (let i = 0; i < n; i++) {
    const seat: Seat = { id: `${i}`, guestId: null, alias: `Player ${i}`, symbol: '*', role: 'player', operationHash: 'private', entryFingerprint: '', tokenHash: 'secret', joinedAtMs: i, connectedAtMs: null, connected: false, disconnectDeadlineMs: null, eligible: true, finished: false, departed: false, remainingDoses: 0, nextInjectionAtMs: 0 };
    room.seats.push(seat); connect(room, seat, i);
  }
  return room;
}

test('deadlines catch up chronologically once; step 2 stops at battle without an outcome', () => {
  const room = fixture(); startRound(room, 10);
  settle(room, 10 + R.briefingDurationMs);
  assert.equal(room.phase, 'experiment'); assert.equal(room.playerCountAtExperimentStart, 2);
  const deadline = room.phaseDeadlineMs!;
  settle(room, deadline); assert.equal(room.phase, 'release');
  settle(room, deadline + R.releaseDurationMs + 100_000);
  assert.equal(room.phase, 'battle'); assert.equal(room.phaseDeadlineMs, null);
  const revision = room.revision;
  settle(room, deadline + R.releaseDurationMs + 100_001); assert.equal(room.revision, revision);
  assert.equal(snapshot(room, 20).teamScore, 0); assert.equal(snapshot(room, 20).creature?.parts.length, 3);
});

test('grace preserves identity, transfers host only at expiry, and locks scaling', () => {
  const room = fixture(3); startRound(room, 10); settle(room, 10 + R.briefingDurationMs);
  const player = room.seats[0]!; const deadline = room.phaseDeadlineMs;
  disconnect(room, player, 9_000);
  settle(room, 9_000 + R.reconnectGraceMs - 1); assert.equal(room.hostId, player.id); assert.equal(player.finished, false);
  connect(room, player, 20_000); assert.equal(player.finished, false); assert.equal(room.phaseDeadlineMs, deadline);
  disconnect(room, player, 21_000); settle(room, 21_000 + R.reconnectGraceMs);
  assert.equal(player.finished, true); assert.equal(room.hostId, '1'); assert.equal(room.playerCountAtExperimentStart, 3);
  connect(room, player, 40_000); assert.equal(player.finished, true);
});

test('below minimum pauses for recovery; late alarm does not extend the pause', () => {
  const room = fixture(); startRound(room, 10); settle(room, 8010);
  disconnect(room, room.seats[1]!, 9000); settle(room, 24_000);
  assert.equal(room.phaseDeadlineMs, null); assert.equal(room.recovery?.deadlineMs, 54_000);
  assert.equal(room.recovery?.remainingMs, 59_010);
  settle(room, 100_000); assert.equal(room.phase, 'lobby'); assert.equal(room.round, null); assert.equal(room.playerCountAtExperimentStart, null);
});

test('late reconnect settles grace first and cannot regain injections; recovery preserves remaining time', () => {
  const room = fixture(); startRound(room, 10); settle(room, 8010);
  disconnect(room, room.seats[1]!, 9000); settle(room, 24000);
  connect(room, room.seats[1]!, 25000);
  assert.equal(room.recovery, null); assert.equal(room.phaseDeadlineMs, 84010);
  assert.equal(room.seats[1]!.finished, true);
});

test('expiry and same-time grace/deadline never fabricate results', () => {
  const room = fixture(); startRound(room, 10); settle(room, 8010);
  disconnect(room, room.seats[1]!, room.phaseDeadlineMs! - R.reconnectGraceMs);
  settle(room, room.phaseDeadlineMs!);
  assert.equal(room.recovery?.remainingMs, 0); assert.equal(room.phase, 'experiment');
  settle(room, R.roomIdleExpiryMs + 10); assert.equal(room.phase, 'closed');
});

test('public projections and runtime validators reject authoritative client fields', () => {
  const room = fixture();
  const serialized = JSON.stringify(snapshot(room, 10));
  for (const hidden of ['secret', 'tokenHash', 'operationHash', 'creationHash', 'guestId']) assert.ok(!serialized.includes(hidden));
  const action = { protocolVersion: 4, actionId: crypto.randomUUID(), kind: 'start-private-session' };
  assert.equal(parseAction(action).kind, 'start-private-session');
  for (const invalid of [{ ...action, playerId: 'somebody' }, { ...action, protocolVersion: 1 }, { ...action, actionId: 'small' }, null, [], { ...action, kind: 'set-phase', phase: 'autopsy' }]) assert.throws(() => parseAction(invalid));
});
