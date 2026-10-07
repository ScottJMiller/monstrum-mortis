import production from '../assets/production.json' with { type: 'json' };
import type { BodySlot, CreatureView } from '../shared/types.ts';

export interface RenderAsset {
  id: string; url: string; dimensions: number[]; description: string;
  slot?: BodySlot; attachment?: { x: number; y: number }; width?: number; order?: number;
  pivot: { x: number; y: number }; mirroredSlots: string[];
}
export const ART = production as RenderAsset[];
export const CHAMBER_URL = '/assets/laboratory/lab.chamber.webp';
export const PHONE_CHAMBER_URL = '/assets/laboratory/lab.chamber-phone.webp';
export interface RenderLayer { key: string; asset: RenderAsset; x: number; y: number; width: number; height: number; order: number; mirror: boolean; }
const slots: Record<BodySlot, { x: number; y: number }> = {
  body: { x: .5, y: .55 }, eyes: { x: .5, y: .44 }, mouth: { x: .5, y: .57 },
  'forelimb-left': { x: .25, y: .54 }, 'forelimb-right': { x: .75, y: .54 },
  'lower-limbs': { x: .5, y: .78 }, skin: { x: .5, y: .55 },
  'head-growth': { x: .5, y: .29 }, appendages: { x: .69, y: .60 },
};
/** A render projection only: never select mutations or apply replacement/game rules. */
export function creatureLayers(creature: CreatureView | null): { layers: RenderLayer[]; missing: string[] } {
  const parts = creature ? creature.parts : [
    { instanceId: 'starter-body', assetId: 'creature.blob', slot: 'body' as const, scale: 1, variant: 0 },
    { instanceId: 'starter-eyes', assetId: 'creature.eyes', slot: 'eyes' as const, scale: 1, variant: 0 },
    { instanceId: 'starter-mouth', assetId: 'creature.mouth', slot: 'mouth' as const, scale: 1, variant: 0 },
  ];
  const missing: string[] = [];
  const layers: RenderLayer[] = [];
  for (const part of parts) {
    const asset = ART.find(a => a.id === part.assetId);
    if (!asset?.slot || !asset.attachment || !asset.width || !slots[part.slot] ||
      (asset.slot !== part.slot && !asset.mirroredSlots.includes(part.slot)) || !Number.isFinite(part.scale)) {
      missing.push(part.assetId); continue;
    }
    const mirror = asset.slot === 'forelimb-left' && part.slot === 'forelimb-right';
    const point = asset.slot === part.slot ? asset.attachment : slots[part.slot];
    // Limit drawing bounds only; the received composition and gameplay values stay untouched.
    const width = Math.min(560, asset.width * 600 * Math.max(.25, Math.min(1.5, part.scale)));
    const height = Math.min(610, width * (asset.dimensions[1]! / asset.dimensions[0]!));
    const x = Math.max(width / 2, Math.min(600 - width / 2, point.x * 600));
    const y = Math.max(height / 2, Math.min(720 - height / 2, point.y * 720));
    layers.push({ key: part.instanceId, asset, x, y, width, height, order: asset.order ?? 0, mirror });
  }
  layers.sort((a, b) => a.order - b.order || a.key.localeCompare(b.key));
  return { layers, missing };
}

export function describeCreature(creature: CreatureView | null): string {
  if (!creature) return 'Starter preview: a waxy olive-green blob with two weary eyes and a crooked smile. Awaiting specimen initialization.';
  const { layers, missing } = creatureLayers(creature);
  return `Shared creature. ${layers.map(l => l.asset.description).join(' ')}${missing.length ? ' Some artwork is unavailable.' : ''}`;
}
