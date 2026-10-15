import type { BattleEvent } from '../../shared/types.ts';
import graphics from '../../assets/battle-v2/effect-art.json' with {type:'json'};
export type EffectId = 'strike'|'slash'|'bite'|'corrosion'|'retaliation'|'electric'|'poison'|'bleed'|'restraint'|'roar'|'regeneration'|'slowing'|'crawling'|'dodge'|'block'|'malfunction'|'detach'|'knockout'|'recover'|'timeout';
export interface EffectGraphic {url:string;width:number;height:number;upper?:string;lower?:string}
interface Effect { status: 'ready'|'planned'; words: readonly string[]; sound: string|null; duration: number; priority: number; direct: boolean; major: boolean; art?:EffectGraphic; anchor?:'actor'|'target' }
/** Sole effect/sound semantic registry. Readiness refers to the development library, not production rollout. */
export const EFFECTS: Record<EffectId,Effect> = {
 strike:{status:'ready',words:['THUD!','BAM!','POW!','WHAM!'],sound:'strike',duration:620,priority:4,direct:true,major:true,art:graphics.strike},
 slash:{status:'ready',words:['RIP!','SLASH!','SLICE!'],sound:'slash',duration:620,priority:5,direct:true,major:true,art:graphics.slash},
 bite:{status:'ready',words:['CHOMP!','CRUNCH!'],sound:'bite',duration:620,priority:5,direct:true,major:true,art:graphics.bite},
 corrosion:{status:'ready',words:['CORROSION!','ACID ATTACK!'],sound:'corrosion',duration:760,priority:8,direct:false,major:true,art:graphics.corrosion},
 retaliation:{status:'ready',words:['RETRIBUTION!','THORN DAMAGE!'],sound:'retaliation',duration:650,priority:9,direct:false,major:true,art:graphics.retaliation,anchor:'actor'},
 electric:{status:'ready',words:['DISCHARGE'],sound:'electric',duration:650,priority:7,direct:false,major:false,art:graphics.electric},
 poison:{status:'ready',words:['Poison'],sound:'poison',duration:550,priority:1,direct:false,major:false},
 bleed:{status:'ready',words:['Bleeding'],sound:'bleed',duration:550,priority:1,direct:false,major:false},
 restraint:{status:'ready',words:['Restrained'],sound:'restraint',duration:650,priority:3,direct:false,major:false},
 roar:{status:'ready',words:['Roar'],sound:'roar',duration:650,priority:3,direct:false,major:false},
 regeneration:{status:'ready',words:['Reweaving'],sound:'regeneration',duration:550,priority:1,direct:false,major:false},
 slowing:{status:'ready',words:['Slowed'],sound:'slowing',duration:650,priority:2,direct:false,major:false},
 crawling:{status:'ready',words:['Crawling'],sound:'crawling',duration:650,priority:2,direct:false,major:false},
 dodge:{status:'ready',words:['WHIFF!','MISSED!'],sound:'miss',duration:620,priority:2,direct:false,major:true},
 block:{status:'ready',words:['BLOCKED!','DENIED!'],sound:'guard',duration:400,priority:2,direct:false,major:true,art:graphics.block,anchor:'actor'},
 malfunction:{status:'ready',words:['Objection'],sound:'malfunction',duration:550,priority:3,direct:false,major:false},
 detach:{status:'ready',words:['Detached'],sound:'detach',duration:650,priority:3,direct:false,major:false},
 knockout:{status:'ready',words:['CEASED!','DEFEAT!'],sound:'defeat',duration:900,priority:10,direct:false,major:true},
 recover:{status:'ready',words:['Recovered'],sound:null,duration:450,priority:0,direct:false,major:false},
 timeout:{status:'ready',words:['ROUND OVER','YOUR TIME IS UP'],sound:'result',duration:800,priority:0,direct:false,major:true},
};
export function effectFor(e: BattleEvent): EffectId {
 if(e.kind==='attack'){
  if(['barbed-hide','porcelain-teeth'].includes(e.mutationId??'')&&/punish contact/i.test(e.caption))return 'retaliation';
  if(/bite|maw closes/i.test(e.caption))return 'bite';
  if(/slash/i.test(e.caption))return 'slash';
  return 'strike';
 }
 if(e.kind==='restraint')return e.mutationId==='bellows-lung'?'roar':/detached limb/i.test(e.caption)?'crawling':'restraint';
 return e.kind;
}
/** Position follows the receiving body (offense) or defending source (defense).
 * Orientation follows the acting creature, independently of the effect's position. */
export function effectPlacement(e:BattleEvent){
 const id=effectFor(e),side=EFFECTS[id].anchor==='actor'?e.actor:e.target;
 return {side,direction:e.actor==='team'?1 as const:-1 as const};
}
/** Per-cue amplitude adjustments; independent of device volume and preserved source files. */
export const SOUND_GAINS:Readonly<Record<string,number>>={strike:1.15,guard:1.15,recoil:1.035,defeat:1.15,crawling:1.15,malfunction:1.15,poison:1.15,slowing:1.15};

/** Cosmetic pseudorandom choice from public event identity, stable across frames, seeking and reload.
 * Never uses hidden battle entropy and never changes gameplay or the authoritative timeline. */
export function letteringFor(battleId:string,event:BattleEvent):string{
 const id=effectFor(event),words=EFFECTS[id].words;let hash=2166136261;
 for(const character of `${battleId}:${event.sequence}:${event.offsetMs}:${id}`)hash=Math.imul(hash^character.charCodeAt(0),16777619);
 hash=Math.imul(hash^(hash>>>16),0x85ebca6b);hash=Math.imul(hash^(hash>>>13),0xc2b2ae35);hash=(hash^(hash>>>16))>>>0;
 return words[Math.floor(hash/4294967296*words.length)]!;
}

/** Source-specific sound variants stay in the sole semantic registry. */
export function soundFor(event:BattleEvent){return effectFor(event)==='retaliation'&&event.mutationId==='porcelain-teeth'?null:EFFECTS[effectFor(event)].sound;}
/** Shards use captions only; all other graphics must be explicitly supplied in the registry. */
export function graphicFor(event:BattleEvent,events:readonly BattleEvent[]=[]){
 const id=effectFor(event);
 // Match the defender and exact contact, using the complete timeline rather than
 // the capped visible effects. Partial armor absorption also emits a block.
 if(id==='strike'&&events.some(e=>e.kind==='block'&&e.actor===event.target&&e.target===event.target&&e.offsetMs===event.offsetMs))return undefined;
 return id==='retaliation'&&event.mutationId==='porcelain-teeth'?undefined:EFFECTS[id].art;
}
