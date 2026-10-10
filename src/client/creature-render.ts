import production from '../assets/production.json' with { type: 'json' };
import type { BodySlot, CreatureView } from '../shared/types.ts';
import type { ColorMatrix } from 'pixi.js';

type Point = { x: number; y: number };
export type AnatomyAnchor = 'center' | 'eyes' | 'mouth' | 'shoulder-left' | 'shoulder-right' | 'hips' | 'crown' | 'halo' | 'chest' | 'belly' | 'heart' | 'glands' | 'side' | 'tail' | 'temple';
export type AnatomyLayer = 'rear-appendages' | 'rear-growth' | 'body' | 'surface' | 'organs' | 'forelimbs' | 'face';
const depth: Record<AnatomyLayer, number> = { 'rear-appendages': 0, 'rear-growth': 10, body: 20, surface: 30, organs: 40, forelimbs: 50, face: 60 };
// Include transparent rotated corners outside the old 600-unit nominal frame.
// This remains inside the chamber glass; rectangle fitting must not shrink the approved raised paws.
export const DRAW_BOUNDS = { left: -48, right: 648, top: 12, bottom: 768 };
export interface RenderAsset {
  id: string; url: string; dimensions: number[]; description: string;
  slot?: BodySlot; attachment?: Point; width?: number; order?: number;
  pivot: Point; mirroredSlots: string[]; anchor?: AnatomyAnchor; layer?: AnatomyLayer; mirrorOnLeft?: boolean;
  offset?: Point; heightScale?: number; rotation?: number; opacity?: number; mirror?: boolean;
  skew?: Point;
  color?: { saturation: number; channels: number[]; lift: number };
  colorGrade?: number[];
  bodyFrame?: { width: number; height: number };
  rightPose?: { offset: Point; width: number; heightScale: number; rotation: number; skew?: Point };
}
export const ART = production as RenderAsset[];
export const CHAMBER_URL = '/assets/laboratory/lab.chamber.webp';
export const PHONE_CHAMBER_URL = '/assets/laboratory/lab.chamber-phone.webp';
export interface RenderLayer {
  key: string; asset: RenderAsset; x: number; y: number; width: number; height: number;
  anchor: Point; pivot: Point; order: number; mirror: boolean; opacity: number; rotation: number; skew: Point;
}
export interface BodyLayout { profile: 'blob' | 'candle' | 'skeleton'; x: number; y: number; width: number; height: number; anchors: Record<AnatomyAnchor, Point> }
/** Nominal anatomical frames are independent of reinforcement; growing a part never moves its socket. */
export function bodyLayout(creature: CreatureView | null): BodyLayout {
  const body = creature?.parts.find(p => p.slot === 'body' && p.assetId === 'mutation.brittle-skeleton') ??
    creature?.parts.find(p => p.slot === 'body' && (p.opacity ?? 1) === 1);
  const profile = body?.assetId === 'mutation.brittle-skeleton' ? 'skeleton' : body?.assetId === 'mutation.candle-flesh' ? 'candle' : 'blob';
  const width = 400;
  const dimensions = ART.find(a => a.id === (profile === 'skeleton' ? 'mutation.brittle-skeleton' : profile === 'candle' ? 'mutation.candle-flesh' : 'creature.blob'))!.dimensions;
  const frame = ART.find(a => a.id === (body?.assetId ?? 'creature.blob'))?.bodyFrame;
  const height = width * (frame ? frame.height / frame.width : dimensions[1]! / dimensions[0]!);
  const x = 300; const y = 338;
  const points: Record<AnatomyAnchor, Point> = {
    center: { x: .5, y: .5 }, eyes: { x: .5, y: .235 }, mouth: { x: .5, y: .395 },
    'shoulder-left': { x: .17, y: .42 }, 'shoulder-right': { x: .83, y: .42 }, hips: { x: .5, y: .85 },
    crown: { x: .5, y: .10 }, halo: { x: .5, y: -.105 }, temple: { x: .5, y: .10 },
    chest: { x: .5, y: .52 }, belly: { x: .5, y: .73 }, heart: { x: .74, y: .47 },
    glands: { x: .38, y: .50 }, side: { x: .16, y: .80 }, tail: { x: .82, y: .87 },
  };
  const anchors = Object.fromEntries(Object.entries(points).map(([key, p]) => [key, { x: x + (p.x - .5) * width, y: y + (p.y - .5) * height }])) as Record<AnatomyAnchor, Point>;
  anchors.halo.y = Math.max(96, anchors.halo.y);
  return { profile, x, y, width, height, anchors };
}
/** Fit about the actual attachment pivot. Never clamp/reposition an individual socket to fit the image. */
export function fitAtAnchor(anchor: Point, pivot: Point, desiredWidth: number, aspect: number, mirror: boolean, rotation = 0, skew = { x: 0, y: 0 }) {
  const px = mirror ? 1 - pivot.x : pivot.x;
  const [a,b,c,d] = axes(rotation,skew);
  const corners = [0, 1].flatMap(x => [0, 1].map(y => ({ x: (x - px) * a + (y - pivot.y) * aspect * c, y: (x - px) * b + (y - pivot.y) * aspect * d })));
  const ratio = (space: number, fraction: number) => fraction > 0 ? space / fraction : Infinity;
  const width = Math.max(0, Math.min(desiredWidth, ...corners.flatMap(p => [ratio(anchor.x - DRAW_BOUNDS.left, -p.x), ratio(DRAW_BOUNDS.right - anchor.x, p.x), ratio(anchor.y - DRAW_BOUNDS.top, -p.y), ratio(DRAW_BOUNDS.bottom - anchor.y, p.y)])));
  const height = width * aspect;
  return { x: anchor.x + (.5 - px) * width * a + (.5 - pivot.y) * height * c, y: anchor.y + (.5 - px) * width * b + (.5 - pivot.y) * height * d, width, height };
}
/** Column directions shared with Pixi's rotation/skew transform. Scale remains around the real pivot. */
export function axes(rotation: number, skew = {x:0,y:0}) {
  return [Math.cos(rotation+skew.y),Math.sin(rotation+skew.y),-Math.sin(rotation-skew.x),Math.cos(rotation-skew.x)] as const;
}
export function layerTransform(layer: Pick<RenderLayer,'rotation'|'skew'|'mirror'>) {
 const [a,b,c,d]=axes(layer.rotation,layer.skew),sign=layer.mirror?-1:1;
 return `translate(-50%, -50%) matrix(${a*sign},${b*sign},${c},${d},0,0)`;
}
/** Shared sRGB transform for Pixi and SVG fallback. Alpha is unchanged. */
export function colorMatrix(asset: RenderAsset): ColorMatrix {
  if (asset.colorGrade) return asset.colorGrade as ColorMatrix;
  const color = asset.color ?? { saturation: 1, channels: [1, 1, 1], lift: 0 };
  const weights = [.2126, .7152, .0722];
  return [0, 1, 2].flatMap(row => [...weights.map((w, col) => ((1 - color.saturation) * w + (row === col ? color.saturation : 0)) * color.channels[row]!), 0, color.lift]).concat([0, 0, 0, 1, 0]) as ColorMatrix;
}
export function layerBounds(layer: Pick<RenderLayer, 'x' | 'y' | 'width' | 'height' | 'rotation'> & {skew?:Point}) {
  const [a,b,c,d]=axes(layer.rotation,layer.skew);
  const w = Math.abs(a) * layer.width + Math.abs(c) * layer.height;
  const h = Math.abs(b) * layer.width + Math.abs(d) * layer.height;
  return { left: layer.x - w / 2, top: layer.y - h / 2, width: w, height: h };
}
/** A render projection only: never select mutations or apply replacement/game rules. */
export function creatureLayers(creature: CreatureView | null): { layers: RenderLayer[]; missing: string[] } {
  const parts = creature ? creature.parts : [
    { instanceId: 'starter-body', assetId: 'creature.blob', slot: 'body' as const, scale: 1, variant: 0 },
    { instanceId: 'starter-eyes', assetId: 'creature.eyes', slot: 'eyes' as const, scale: 1, variant: 0 },
    { instanceId: 'starter-mouth', assetId: 'creature.mouth', slot: 'mouth' as const, scale: 1, variant: 0 },
  ];
  const layout = bodyLayout(creature); const missing: string[] = []; const layers: RenderLayer[] = [];
  for (const part of parts) {
    const asset = ART.find(a => a.id === part.assetId);
    if (!asset?.slot || !asset.anchor || !asset.layer || !asset.width || !layout.anchors[asset.anchor] ||
      (asset.slot !== part.slot && !asset.mirroredSlots.includes(part.slot)) || !Number.isFinite(part.scale) ||
      ![asset.pivot.x, asset.pivot.y].every(v => Number.isFinite(v) && v >= 0 && v <= 1)) {
      missing.push(part.assetId); continue;
    }
    const mirror = asset.slot === 'forelimb-left' ? (part.slot === 'forelimb-left' ? (asset.mirrorOnLeft ?? false) : !(asset.mirrorOnLeft ?? false)) : (asset.mirror ?? false);
    const right = part.slot === 'forelimb-right' ? asset.rightPose : undefined;
    const socket = part.slot === 'forelimb-right' ? layout.anchors['shoulder-right'] : layout.anchors[asset.anchor];
    const anchor = { x: socket.x + (right?.offset.x ?? (asset.offset?.x ?? 0) * (part.slot === 'forelimb-right' ? -1 : 1)) * layout.width, y: socket.y + (right?.offset.y ?? asset.offset?.y ?? 0) * layout.height };
    // Body texture uses its own nominal frame, surface organs use torso-relative sizes.
    const nominal = (right?.width ?? asset.width) * layout.width;
    // Preserve the approved baseline proportions. Growth caps must never squash the source face.
    const grown = nominal * Math.max(.25, Math.min(1.3, part.scale));
    const aspect = asset.dimensions[1]! / asset.dimensions[0]! * (right?.heightScale ?? asset.heightScale ?? 1);
    const desired = asset.layer === 'face' ? Math.min(grown, nominal * 1.15) : grown;
    const rotation = (right?.rotation ?? (asset.rotation ?? 0) * (part.slot === 'forelimb-right' ? -1 : 1)) * Math.PI / 180;
    const authoredSkew=right ? right.skew ?? {x:0,y:0} : asset.skew ?? {x:0,y:0};
    const sign=part.slot==='forelimb-right'&&!right?-1:1;
    const skew={x:authoredSkew.x*Math.PI/180*sign,y:authoredSkew.y*Math.PI/180*sign};
    const geometry = fitAtAnchor(anchor, asset.pivot, desired, aspect, mirror, rotation,skew);
    const style = part as { opacity?: number; layerOffset?: number };
    // Preserve server-requested translucent coexistence (skeleton + candle) without inventing anatomy.
    layers.push({ key: part.instanceId, asset, ...geometry, anchor, pivot: asset.pivot,
      order: depth[asset.layer] + (asset.order ?? 0) + Math.max(0, Math.min(1, style.layerOffset ?? 0)), mirror, rotation, skew, opacity: Math.max(.2, Math.min(1, style.opacity ?? 1)) * (asset.opacity ?? 1) });
  }
  layers.sort((a, b) => a.order - b.order || a.key.localeCompare(b.key));
  return { layers, missing };
}

export function describeCreature(creature: CreatureView | null): string {
  if (!creature) return 'Starter preview: a waxy olive-green blob with two weary eyes and a crooked smile. Awaiting specimen initialization.';
  const { layers, missing } = creatureLayers(creature);
  return `Shared creature. ${layers.map(l => l.asset.description).join(' ')}${missing.length ? ' Some artwork is unavailable.' : ''}`;
}
