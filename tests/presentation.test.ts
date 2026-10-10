import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { ASSET_MANIFEST } from '../src/assets/manifest.ts';
import { ART, DRAW_BOUNDS, creatureLayers, layerBounds } from '../src/client/creature-render.ts';

test('all thirty planned mutation appearances have real modules and every body slot is supported', () => {
  const mutations = ART.filter(a => a.id.startsWith('mutation.'));
  assert.equal(mutations.length, 30);
  assert.equal(new Set(mutations.map(a => a.id)).size, 30);
  const slots = new Set(ART.map(a => a.slot));
  for (const slot of ['body', 'eyes', 'mouth', 'forelimb-left', 'lower-limbs', 'skin', 'head-growth', 'appendages']) assert.ok(slots.has(slot), slot);
  assert.ok(mutations.some(a => a.mirroredSlots.includes('forelimb-right')));
});

test('ready artwork exists with source, provenance, calibrated metadata and matching manifest entries', () => {
  const ledger = JSON.parse(readFileSync(new URL('../assets/provenance.json', import.meta.url), 'utf8'));
  for (const asset of ART) {
    assert.ok(existsSync(new URL(`../public${asset.url}`, import.meta.url)), asset.id);
    const record = ledger.find(r => r.id === asset.id);
    assert.ok(record?.prompt && record?.terms && record?.sourceSha256, asset.id);
    assert.ok(existsSync(new URL(`../${record.source}`, import.meta.url)), asset.id);
    assert.equal(ASSET_MANIFEST.find(a => a.id === asset.id)?.status, 'ready');
    if (asset.id !== 'lab.chamber') {
      assert.ok(asset.attachment && asset.slot && asset.width);
      assert.ok(asset.dimensions.every(value => value > 0 && value <= 640));
    }
  }
  assert.ok(ASSET_MANIFEST.filter(a => a.id.startsWith('audio.') || a.id.startsWith('rival.')).every(a => a.status === 'planned'));
});
test('starter preview is local, stable, layered and does not mutate received public composition', () => {
  assert.equal(creatureLayers(null).layers.length, 3);
  const creature = { compositionSeed: 'public-only', revealedMutationIds: [], parts: [
    { instanceId: 'right', assetId: 'mutation.razor-talons', slot: 'forelimb-right', scale: 1, variant: 0, contributorIds: [] },
    { instanceId: 'body', assetId: 'creature.blob', slot: 'body', scale: 1, variant: 0, contributorIds: [] },
  ] };
  const original = structuredClone(creature);
  const view = creatureLayers(creature);
  assert.equal(view.missing.length, 0);
  assert.equal(view.layers[0].key, 'body');
  assert.equal(view.layers[1].mirror, false); // Source arm bends outward to the right; left uses the mirrored drawing.
  assert.deepEqual(creature, original);
  assert.deepEqual(creatureLayers(creature), view);
});
test('missing, mismatched or invalid artwork is reported without fabricating anatomy', () => {
  const part = { instanceId: 'bad', assetId: 'unknown', slot: 'eyes', scale: 1, variant: 0, contributorIds: [] };
  for (const entry of [part, { ...part, assetId: 'creature.blob' }, { ...part, assetId: 'creature.eyes', scale: NaN }]) {
    const projected = creatureLayers({ compositionSeed: '', revealedMutationIds: [], parts: [entry] });
    assert.equal(projected.layers.length, 0); assert.equal(projected.missing.length, 1);
  }
});
test('extreme finite scales stay inside the chamber drawing area', () => {
  for (const asset of ART.filter(a => a.slot)) {
    const { layers } = creatureLayers({ compositionSeed: '', revealedMutationIds: [], parts: [{ instanceId: asset.id, assetId: asset.id, slot: asset.slot!, scale: 100, variant: 0, contributorIds: [] }] });
    const layer = layers[0]!;
    const bounds = layerBounds(layer);
    assert.ok(bounds.left >= DRAW_BOUNDS.left - 1e-8 && bounds.left + bounds.width <= DRAW_BOUNDS.right + 1e-8, asset.id);
    assert.ok(bounds.top >= DRAW_BOUNDS.top - 1e-8 && bounds.top + bounds.height <= DRAW_BOUNDS.bottom + 1e-8, asset.id);
  }
});
