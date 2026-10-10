import type { CreatureStats } from '../../shared/types.ts';
import type { AbilityDefinition } from './mechanics.ts';
export interface RivalDefinition { id: string; name: string; archetype: string; strength: string; weakness: string; stats: CreatureStats; abilities: AbilityDefinition[] }
const stats = (vitality: number, power: number, protection: number, agility: number, regeneration = 0, instability = 0): CreatureStats => ({vitality,power,protection,agility,regeneration,instability});
export const RIVAL_CATALOGUE: readonly RivalDefinition[] = [
  { id:'iron-widow', name:'Iron Widow', archetype:'armor', strength:'Riveted armor absorbs direct blows.', weakness:'Slow legs leave openings for poison and corrosion.', stats:stats(105,10,25,6), abilities:[] },
  { id:'gutter-seraph', name:'Gutter Seraph', archetype:'speed', strength:'Quick feet evade attacks and strike often.', weakness:'Its slight body cannot endure much punishment.', stats:stats(78,9,5,20), abilities:[{kind:'cadence',magnitude:.08,unit:'ratio'}] },
  { id:'carrion-duke', name:'Carrion Duke', archetype:'regeneration', strength:'Damaged tissue steadily grows back.', weakness:'Slow, soft flesh is vulnerable to sustained attacks.', stats:stats(100,9,5,7,1.8), abilities:[] },
  { id:'coil-saint', name:'Coil Saint', archetype:'electric-bursts', strength:'Every third landed strike discharges its coils.', weakness:'Delicate coils make it an unstable specimen.', stats:stats(90,8,8,11,0,7), abilities:[{kind:'electric-strike',magnitude:6,unit:'damage'}] },
  { id:'maw-engine', name:'Maw Engine', archetype:'heavy-bites', strength:'A heavy bite punishes an unprotected body.', weakness:'Its ponderous jaws recover slowly after a miss.', stats:stats(105,15,10,5), abilities:[{kind:'miss-vulnerability',magnitude:.15,unit:'ratio'}] },
  { id:'the-unfinished', name:'The Unfinished', archetype:'unstable-mixture', strength:'A confused mixture of poison, restraint and claws.', weakness:'Unstable anatomy can malfunction or lose a turn.', stats:stats(95,10,9,10,0,10), abilities:[{kind:'poison',magnitude:1,unit:'damage/second',lifetimeMs:4000},{kind:'restraint',magnitude:.5,unit:'seconds'},{kind:'lost-action',magnitude:.08,unit:'ratio'}] },
];
export function rival(id: string): RivalDefinition {
 const r=RIVAL_CATALOGUE.find(r=>r.id===id); if(!r) throw new Error('Unsupported rival'); return r;
}
