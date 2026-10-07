import { useState } from 'react';
import { ART } from './creature-render.ts';
import { Chamber } from './Chamber.tsx';
import type { CreatureView, MorphologyPart } from '../shared/types.ts';

/** Imported only by the Vite development entry; no fixture mutation controls ship. */
export function ArtGallery() {
  const [selected, setSelected] = useState<string[]>([]);
  const [motion, setMotion] = useState(false);
  const assets = ART.filter(a => a.id.startsWith('mutation.'));
  const chosen = ART.filter(a => selected.includes(a.id));
  const replacementSlots = new Set(chosen.map(a => a.slot));
  const base = ART.filter(a => a.id.startsWith('creature.') && !replacementSlots.has(a.slot));
  const parts: MorphologyPart[] = [...base, ...chosen].map(a => ({ instanceId: a.id, assetId: a.id, slot: a.slot!, variant: 0, scale: 1, contributorIds: [] }));
  const creature: CreatureView = { compositionSeed: 'local-art-review-only', parts, revealedMutationIds: [] };
  return <main className="laboratory-shell"><h1>Local art inspection</h1><p>Development fixture only. These controls do not contact the room service or apply DNA rules.</p><div className="laboratory-layout"><Chamber creature={creature} motion={motion} /><section><h2>Module combinations</h2><button onClick={() => setMotion(!motion)}>{motion ? 'Pause preview' : 'Animate preview'}</button><button onClick={() => setSelected([])}>Starter anatomy</button>{assets.map(a => <label className="checkbox" key={a.id}><input type="checkbox" checked={selected.includes(a.id)} onChange={() => setSelected(ids => ids.includes(a.id) ? ids.filter(id => id !== a.id) : [...ids, a.id])} />{a.id.replace('mutation.', '').replaceAll('-', ' ')}</label>)}</section></div></main>;
}
