import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { DNA_CATALOGUE } from '../src/server/catalogue/dna.ts';
import { BASE_STATS, diminishing } from '../src/server/catalogue/mechanics.ts';
import { applyMutation, beginRelease, effectiveCreature, inject, prepareHand, publicCreature, publicHistory, pullSwitch, draw } from '../src/server/dna-mechanics.ts';
import { newRoom, connect, startRound, settle, snapshot, controller, disconnect, completePublicRound, publicIntent } from '../src/server/room-model.ts';
import type { Seat } from '../src/server/room-model.ts';
import { migrateRoom } from '../src/server/room-storage.ts';
import { parseAction } from '../src/server/validation.ts';
import { creatureLayers } from '../src/client/creature-render.ts';
import { PROTOCOL_VERSION } from '../src/shared/protocol.ts';

const uid = () => crypto.randomUUID();
function fixture(n = 2) {
  const r = newRoom('ABCDEF', 'private', 'remote', 'hidden', uid(), '', 0);
  for (let i = 0; i < n; i++) {
    const seat: Seat = { id: uid(), guestId: null, alias: `Scientist ${i}`, symbol: '*', role: 'player', operationHash: uid(), entryFingerprint: '', tokenHash: 'secret', joinedAtMs: 0, connectedAtMs: null, connected: false, disconnectDeadlineMs: null, eligible: true, finished: false, departed: false, remainingDoses: 0, nextInjectionAtMs: 0 };
    r.seats.push(seat); connect(r, seat, 0);
  }
  startRound(r, 0); settle(r, 8000); return r;
}
function code(fn: () => unknown, expected: string) { assert.throws(fn, e => (e as { code: string }).code === expected); }
function put(r: ReturnType<typeof fixture>, id: string, n = r.playerCountAtExperimentStart!) { applyMutation(r.experiment!, id, r.seats[0]!.id, 'Scientist', uid(), 8000, n); }

for (const definition of DNA_CATALOGUE) test(`${definition.autopsyName}: visible current anatomy, signed effects, normalized first abilities and replacement history`, () => {
  const r = fixture(8); put(r, definition.id);
  const view = publicCreature(r.experiment!); const layers = creatureLayers(view);
  assert.deepEqual(layers.missing, []); assert.equal(layers.layers.filter(l => l.asset.id === `mutation.${definition.id}`).length, definition.targets.length);
  const effective = effectiveCreature(r.experiment!);
  for (const [stat, delta] of Object.entries(definition.deltas)) assert.equal(effective.stats[stat as keyof typeof BASE_STATS], BASE_STATS[stat as keyof typeof BASE_STATS] + delta / 4);
  for (const ability of definition.abilities) assert.equal(effective.abilities.find(a => a.kind === ability.kind)!.magnitude, ability.magnitude / 4);
  if (definition.family === 'cosmetic') { assert.deepEqual(effective.stats, BASE_STATS); assert.deepEqual(effective.abilities, []); }
  assert.equal(publicHistory(r.experiment!)[0]!.name, definition.autopsyName);
});

for (let n = 2; n <= 8; n++) test(`${n} players: six-dose budget, scaled liability/ability and equal normalized team investment`, () => {
  const r = fixture(n); assert.equal(r.playerCountAtExperimentStart, n);
  assert.ok(r.seats.every(s => s.tray?.length === 4 && s.drawPlan?.length === 6 && s.remainingDoses === 6));
  for (let i = 0; i < n; i++) put(r, 'venom-glands', n);
  assert.equal(effectiveCreature(r.experiment!).abilities[0]!.magnitude, 3);
  const liability = fixture(n); put(liability, 'kitten-paws', n);
  assert.equal(effectiveCreature(liability.experiment!).stats.power, Math.round((10 - 4 / n) * 1e6) / 1e6);
  assert.equal(effectiveCreature(liability.experiment!).abilities[0]!.magnitude, Math.round(.2 / n * 1e6) / 1e6);
  disconnect(r, r.seats[0]!, 9000, true); settle(r, 9000); assert.equal(r.playerCountAtExperimentStart, n);
});

test('six injections replace one card each, consume cosmetic doses and never auto-pull; exact cooldown/switch boundaries', () => {
  const r = fixture(); const s = r.seats[0]!;
  code(() => pullSwitch(r, s, r.experiment!.id, 8000), 'switch-locked');
  for (let i = 0; i < 6; i++) {
    s.tray![0]!.dnaId = 'funeral-mane'; const id = s.tray![0]!.specimenId; const now = 8000 + i * 6000;
    const other = s.tray!.slice(1).map(s => s.specimenId);
    inject(r, s, r.experiment!.id, id, uid(), now);
    assert.equal(s.remainingDoses, 5 - i); assert.equal(s.tray!.length, 4); assert.notEqual(s.tray![0]!.specimenId, id);
    assert.deepEqual(s.tray!.slice(1).map(s => s.specimenId), other);
    code(() => inject(r, s, r.experiment!.id, s.tray![0]!.specimenId, uid(), now + 5999), 'cooldown');
    code(() => pullSwitch(r, s, r.experiment!.id, now + 5999), 'cooldown');
  }
  assert.equal(s.finished, false); assert.equal(s.switchPulled, false); assert.deepEqual(effectiveCreature(r.experiment!).stats, BASE_STATS);
  code(() => inject(r, s, r.experiment!.id, s.tray![0]!.specimenId, uid(), 44000), 'no-doses');
  pullSwitch(r, s, r.experiment!.id, 44000); assert.equal(s.switchPulled, true);
  code(() => inject(r, s, r.experiment!.id, s.tray![0]!.specimenId, uid(), 44001), 'wrong-phase');
});

test('replacement removes both positive and negative saturated deltas, abilities and active attribution', () => {
  const r = fixture(); for (let i = 0; i < 6; i++) put(r, 'titan-fibers');
  assert.equal(effectiveCreature(r.experiment!).stats.power, 18); assert.deepEqual(publicHistory(r.experiment!).map(h => h.change), ['added', 'reinforced', 'reinforced', 'reinforced', 'reinforced', 'reinforced']); assert.equal(effectiveCreature(r.experiment!).stats.agility, 8);
  put(r, 'brittle-skeleton'); assert.equal(publicHistory(r.experiment!).at(-1)!.change, 'replaced'); assert.equal(effectiveCreature(r.experiment!).stats.power, 10); assert.equal(effectiveCreature(r.experiment!).stats.vitality, 84);
  put(r, 'acid-bladder'); assert.equal(effectiveCreature(r.experiment!).stats.vitality, 100);
  assert.equal(publicHistory(r.experiment!).filter(h => h.status === 'replaced').length, 7);
  assert.deepEqual(effectiveCreature(r.experiment!).abilities.map(a => a.kind), ['armor-reduction']);
  assert.deepEqual([0, 1, 2, 3, 4, 6].map(diminishing), [0, 1, 1.5, 1.75, 2, 2]);
});

test('paired hands divide effects once, right replacement retains only the surviving half, then paws remove talons', () => {
  const r = fixture(); put(r, 'razor-talons'); assert.equal(effectiveCreature(r.experiment!).stats.power, 12);
  put(r, 'wandering-limb'); assert.equal(effectiveCreature(r.experiment!).stats.power, 9);
  assert.equal(effectiveCreature(r.experiment!).abilities.find(a => a.kind === 'bleed')!.magnitude, 1);
  assert.equal(publicHistory(r.experiment!)[0]!.status, 'partial');
  put(r, 'kitten-paws'); assert.equal(effectiveCreature(r.experiment!).stats.power, 8);
  assert.deepEqual(effectiveCreature(r.experiment!).abilities.map(a => a.kind), ['landing-recovery']);
  assert.equal(creatureLayers(publicCreature(r.experiment!)).layers.filter(l => l.mirror).length, 1);
});

test('all-liability safeguard works with every selection and consumes fixed safe packets without rerandomizing', () => {
  const hand = prepareHand(() => .99); assert.ok(hand.tray.some(s => DNA_CATALOGUE.find(d => d.id === s.dnaId)!.family !== 'liability'));
  for (let selected = 0; selected < 4; selected++) {
    const r = fixture(); const s = r.seats[0]!;
    s.tray!.forEach((s, i) => { s.dnaId = i === selected ? 'titan-fibers' : 'kitten-paws'; });
    s.drawPlan![0] = { primary: 'candle-flesh', safe: 'funeral-mane' };
    inject(r, s, r.experiment!.id, s.tray![selected]!.specimenId, uid(), 8000);
    assert.equal(s.tray![selected]!.dnaId, 'funeral-mane'); assert.equal(s.drawCursor, 1);
    const copy = JSON.parse(JSON.stringify(r)); assert.deepEqual(copy.seats[0].drawPlan, s.drawPlan);
  }
});

test('deadline −1 accepts; exact deadline rejects; release freezes once and catches up five seconds', () => {
  const r = fixture(); const s = r.seats[0]!; const deadline = r.phaseDeadlineMs!;
  inject(r, s, r.experiment!.id, s.tray![0]!.specimenId, uid(), deadline - 1);
  code(() => inject(r, r.seats[1]!, r.experiment!.id, r.seats[1]!.tray![0]!.specimenId, uid(), deadline), 'deadline-passed');
  settle(r, deadline); assert.equal(r.phase, 'release'); const frozen = structuredClone(r.experiment!.frozen);
  beginRelease(r, deadline + 1, 'unanimous'); assert.deepEqual(r.experiment!.frozen, frozen); assert.equal(r.phaseDeadlineMs, deadline + 5000);
  code(() => put(r, 'razor-talons'), 'wrong-phase');
  settle(r, deadline + 5000); assert.equal(r.phase, 'battle'); assert.deepEqual(r.experiment!.frozen, frozen);
});

test('unanimous deliberate switches forfeit doses and freeze the accepted specimen at one release time', () => {
  const r = fixture(); for (const s of r.seats) inject(r, s, r.experiment!.id, s.tray![0]!.specimenId, uid(), 8000);
  pullSwitch(r, r.seats[0]!, r.experiment!.id, 14000); assert.equal(r.phase, 'experiment'); assert.equal(r.seats[0]!.remainingDoses, 0);
  pullSwitch(r, r.seats[1]!, r.experiment!.id, 14000); assert.equal(r.phase, 'release'); assert.equal(r.phaseDeadlineMs, 19000);
  assert.equal(r.experiment!.frozen!.reason, 'unanimous'); assert.equal(r.experiment!.frozen!.history.length, 2);
});

test('ownership, recovery, waiting seats and old attempt IDs cannot mutate; private and display projections stay safe', () => {
  const r = fixture(); const s = r.seats[0]!; const before = JSON.stringify(r);
  code(() => inject(r, s, r.experiment!.id, r.seats[1]!.tray![0]!.specimenId, uid(), 8000), 'invalid-action');
  code(() => inject(r, s, uid(), s.tray![0]!.specimenId, uid(), 8000), 'stale-session'); assert.equal(JSON.stringify(r), before);
  r.recovery = { remainingMs: 10000, deadlineMs: 20000 }; r.phaseDeadlineMs = null;
  code(() => inject(r, s, r.experiment!.id, s.tray![0]!.specimenId, uid(), 8000), 'wrong-phase');
  r.recovery = null; s.eligible = false; code(() => pullSwitch(r, s, r.experiment!.id, 8000), 'wrong-phase');
  const publicText = JSON.stringify(snapshot(r, 8000)); const privateText = JSON.stringify(controller(s, r));
  for (const text of [publicText, privateText]) for (const hidden of ['dnaId', 'drawPlan', 'tokenHash', 'deltas', 'abilities', 'catalogueVersion', 'secret']) assert.ok(!text.includes(hidden), hidden);
  assert.ok(!privateText.includes(r.seats[1]!.tray![0]!.specimenId)); s.role = 'display'; assert.equal(controller(s, r), null);
});

test('legacy schema migration preserves credentials/deadlines and leaves active service-only attempts without retroactive doses', () => {
  for (const schemaVersion of [2, 3]) for (const phase of ['lobby', 'briefing', 'experiment', 'release', 'battle'] as const) {
    const r = fixture(); const deadline = r.phaseDeadlineMs; const raw = JSON.parse(JSON.stringify(r));
    raw.schemaVersion = schemaVersion; raw.phase = phase; delete raw.experiment;
    const migrated = migrateRoom(raw); assert.equal(migrated.schemaVersion, 5); assert.equal(migrated.seats[0]!.tokenHash, 'secret'); assert.equal(migrated.phaseDeadlineMs, deadline);
    assert.equal(migrated.experiment !== null, phase === 'briefing'); assert.equal(migrated.seats[0]!.tray!.length, 0);
  }
  const r = fixture(); const persisted = migrateRoom(JSON.parse(JSON.stringify(r))); assert.deepEqual(persisted, r);
  code(() => migrateRoom({ ...r, schemaVersion: 99 }), 'temporarily-unavailable');
  r.experiment!.catalogueVersion = 'future'; code(() => migrateRoom(r), 'temporarily-unavailable');
});

test('protocol rejects absent attempt IDs, old protocol and submitted authoritative fields', () => {
  const action = { protocolVersion: PROTOCOL_VERSION, actionId: uid(), kind: 'inject', attemptId: uid(), specimenId: uid() };
  assert.equal(parseAction(action).kind, 'inject');
  for (const invalid of [{ ...action, attemptId: undefined }, { ...action, protocolVersion: 3 }, { ...action, dnaId: 'titan-fibers' }, { ...action, remainingDoses: 6 }]) assert.throws(() => parseAction(invalid));
});

test('original clue sources match provenance and reveal descriptions without mutation names', () => {
  const ledger = JSON.parse(readFileSync(new URL('../assets/specimen-provenance.json', import.meta.url), 'utf8'));
  assert.equal(ledger.length, 35); assert.equal(new Set(ledger.filter((a: { id: string }) => a.id.startsWith('clue.c')).map((a: { sha256: string }) => a.sha256)).size, 30);
  for (const record of ledger) {
    assert.ok(existsSync(record.source)); const contents = readFileSync(record.source);
    assert.equal(createHash('sha256').update(contents).digest('hex'), record.sha256);
    for (const d of DNA_CATALOGUE) assert.ok(!contents.toString().includes(d.id));
  }
});


test('draw thresholds use shared family weights, including a safe fallback boundary', () => {
  for (const [roll, family] of [[0, 'tactical'], [.499999, 'tactical'], [.5, 'cosmetic'], [.749999, 'cosmetic'], [.75, 'liability'], [.999999, 'liability']] as const) {
    let calls = 0; const id = draw(() => calls++ ? 0 : roll); assert.equal(DNA_CATALOGUE.find(d => d.id === id)!.family, family);
  }
  let calls = 0; const id = draw(() => calls++ ? 0 : 2 / 3, true); assert.equal(DNA_CATALOGUE.find(d => d.id === id)!.family, 'cosmetic');
});

test('cosmetic replacement removes tactical and liability mechanics without adding hidden effects', () => {
  const r = fixture(); put(r, 'barbed-hide'); put(r, 'ink-bloom');
  assert.deepEqual(effectiveCreature(r.experiment!), { stats: BASE_STATS, abilities: [] });
  put(r, 'candle-flesh'); assert.equal(effectiveCreature(r.experiment!).stats.protection, 6);
  put(r, 'too-many-smiles'); assert.deepEqual(effectiveCreature(r.experiment!), { stats: BASE_STATS, abilities: [] });
  assert.equal(publicHistory(r.experiment!)[2]!.status, 'replaced');
});

test('surviving ability attribution excludes replaced sources and normalizes multiple contributors', () => {
  const r = fixture(4); const e = r.experiment!;
  for (const seat of r.seats.slice(0, 2)) applyMutation(e, 'razor-talons', seat.id, seat.alias, uid(), 8000, 4);
  const bleed = effectiveCreature(e).abilities.find(a => a.kind === 'bleed')!;
  assert.deepEqual(bleed.contributors.map(c => c.weight), [.5, .5]); assert.equal(bleed.magnitude, 2);
  applyMutation(e, 'wandering-limb', r.seats[2]!.id, 'Third', uid(), 8001, 4);
  assert.equal(effectiveCreature(e).abilities.find(a => a.kind === 'bleed')!.magnitude, 1);
  applyMutation(e, 'kitten-paws', r.seats[3]!.id, 'Fourth', uid(), 8002, 4);
  assert.deepEqual(effectiveCreature(e).abilities.flatMap(a => a.contributors.map(c => c.playerId)), [r.seats[3]!.id]);
});

test('disconnect/recovery retains private hand and spent dose; grace completion survives return', () => {
  const r = fixture(); const seat = r.seats[0]!;
  inject(r, seat, r.experiment!.id, seat.tray![0]!.specimenId, uid(), 8000);
  const privateState = structuredClone(controller(seat, r)); disconnect(r, seat, 9000); settle(r, 24000);
  assert.ok(r.recovery); connect(r, seat, 25000); assert.equal(r.recovery, null);
  assert.equal(seat.finishReason, 'grace'); assert.equal(seat.remainingDoses, 5);
  assert.deepEqual(controller(seat, r)!.tray, privateState!.tray);
  code(() => inject(r, seat, r.experiment!.id, seat.tray![0]!.specimenId, uid(), 25000), 'wrong-phase');
});

test('malformed stored private plans and frozen version/stats fail closed', () => {
  const r = fixture();
  for (const edit of [(r: ReturnType<typeof fixture>) => { r.seats[0]!.drawCursor = 7; }, (r: ReturnType<typeof fixture>) => { r.seats[0]!.drawPlan![0]!.safe = 'kitten-paws'; }, (r: ReturnType<typeof fixture>) => { r.seats[0]!.tray![0]!.specimenId = 'corrupt'; }]) {
    const copy = structuredClone(r); edit(copy); code(() => migrateRoom(copy), 'temporarily-unavailable');
  }
  beginRelease(r, 8001, 'deadline'); const bad = structuredClone(r); bad.experiment!.frozen!.catalogueVersion = 'future';
  code(() => migrateRoom(bad), 'temporarily-unavailable'); r.experiment!.frozen!.stats.power = Infinity;
  code(() => migrateRoom(r), 'temporarily-unavailable');
});


test('real participation counters feed public inactivity/ready hooks and the next attempt gets a fresh blob and hand', () => {
  const r = fixture(); r.visibility = 'public'; r.hostId = null;
  r.publicState = { region: 'americas', sessionId: uid(), teamScore: 0, completed: [], ready: [], replay: [], resultsStartedAtMs: null };
  const priorAttempt = r.experiment!.id; const priorSpecimens = r.seats.flatMap(s => s.tray!.map(c => c.specimenId));
  inject(r, r.seats[0]!, priorAttempt, r.seats[0]!.tray![0]!.specimenId, uid(), 8000);
  assert.equal(r.seats[0]!.interactedThisRound, true); assert.equal(r.seats[0]!.injectionsThisRound, 1);
  settle(r, 88000); assert.equal(r.phase, 'battle');
  const finishAt = r.phaseDeadlineMs!; settle(r, finishAt);
  assert.deepEqual(snapshot(r, 88000).players.map(s => s.inactivityPrompt), [false, true]);
  publicIntent(r, r.seats[1]!, 'next-round-ready', finishAt + 1);
  settle(r, finishAt + 25000); assert.equal(r.phase, 'briefing'); assert.notEqual(r.experiment!.id, priorAttempt);
  assert.deepEqual(r.experiment!.history, []); assert.deepEqual(effectiveCreature(r.experiment!).stats, BASE_STATS);
  settle(r, finishAt + 33000); assert.equal(r.phase, 'experiment');
  assert.ok(r.seats.every(s => !s.departed && s.remainingDoses === 6 && s.injectionsThisRound === 0 && !s.switchPulled));
  assert.ok(r.seats.flatMap(s => s.tray!).every(c => !priorSpecimens.includes(c.specimenId)));
  code(() => inject(r, r.seats[0]!, priorAttempt, r.seats[0]!.tray![0]!.specimenId, uid(), finishAt + 33000), 'stale-session');
});

test('switch at the exact experiment deadline rejects and cannot replace a deadline freeze', () => {
  const r = fixture(); const seat = r.seats[0]!; inject(r, seat, r.experiment!.id, seat.tray![0]!.specimenId, uid(), 8000);
  code(() => pullSwitch(r, seat, r.experiment!.id, r.phaseDeadlineMs!), 'deadline-passed');
  settle(r, r.phaseDeadlineMs!); const frozen = structuredClone(r.experiment!.frozen);
  assert.equal(seat.switchPulled, false); assert.equal(seat.finishReason, 'deadline');
  code(() => pullSwitch(r, seat, r.experiment!.id, 83001), 'wrong-phase'); assert.deepEqual(r.experiment!.frozen, frozen);
});
