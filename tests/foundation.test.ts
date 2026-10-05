import assert from 'node:assert/strict';
import test from 'node:test';
import { GAME_RULES, dosePotency } from '../src/shared/rules.ts';
import { DNA_CATALOGUE } from '../src/server/catalogue/dna.ts';
import { RIVAL_CATALOGUE } from '../src/server/catalogue/rivals.ts';
import { ASSET_MANIFEST } from '../src/assets/manifest.ts';
import { createHealth } from '../src/server/health.ts';

test('full injection budgets have equal normalized potency at every player count', () => {
  const expected = GAME_RULES.minPlayers * GAME_RULES.dosesPerPlayerPerRound;
  for (let n = 2; n <= 8; n++) {
    assert.ok(Math.abs(n * GAME_RULES.dosesPerPlayerPerRound * dosePotency(n) - expected) < 1e-10);
  }
  for (const n of [0, 1, 9, 2.5, NaN]) assert.throws(() => dosePotency(n), RangeError);
});

test('a full budget fits the timer and early advance leaves results-reading time', () => {
  assert.ok((GAME_RULES.dosesPerPlayerPerRound - 1) * GAME_RULES.injectionCooldownMs < GAME_RULES.experimentDurationMs);
  assert.ok(GAME_RULES.publicEarlyAdvanceMinimumMs < GAME_RULES.publicResultsDurationMs);
  assert.ok(GAME_RULES.matchmaking.targetMaxPlayers <= GAME_RULES.maxPlayers);
});

test('catalogue identifiers are unique and the approved content counts are preserved', () => {
  assert.equal(DNA_CATALOGUE.length, 30);
  assert.equal(new Set(DNA_CATALOGUE.map(x => x.id)).size, 30);
  assert.equal(RIVAL_CATALOGUE.length, 6);
  assert.equal(new Set(RIVAL_CATALOGUE.map(x => x.id)).size, 6);
  assert.equal(Object.values(GAME_RULES.specimenDrawWeights).reduce((a, b) => a + b, 0), 1);
});

test('planned assets never advertise a completed URL', () => {
  assert.equal(new Set(ASSET_MANIFEST.map(x => x.id)).size, ASSET_MANIFEST.length);
  const ids = new Set(ASSET_MANIFEST.map(x => x.id));
  for (const dna of DNA_CATALOGUE) assert.ok(ids.has(`mutation.${dna.id}`));
  for (const rival of RIVAL_CATALOGUE) assert.ok(ids.has(`rival.${rival.id}`));
  for (const asset of ASSET_MANIFEST) {
    if (asset.status === 'planned') assert.equal(asset.url, null);
    else assert.ok(asset.url?.startsWith('/assets/'));
  }
});

test('health distinguishes missing bindings without claiming gameplay readiness', () => {
  const absent = createHealth({});
  assert.deepEqual(Object.values(absent.configuredBindings), [false, false, false, false]);
  const configured = createHealth({ ASSETS: {}, ROOMS: {}, MATCHMAKING: {}, GUEST_LEASES: {} });
  assert.deepEqual(Object.values(configured.configuredBindings), [true, true, true, true]);
  assert.equal(configured.gameplayAvailable, false);
});
