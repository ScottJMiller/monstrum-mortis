import type { BattleEvent } from '../../shared/types.ts';
import graphics from '../../assets/battle-v2/effect-art.json' with {type:'json'};
export type EffectId = 'strike'|'slash'|'bite'|'corrosion'|'retaliation'|'electric'|'poison'|'bleed'|'restraint'|'roar'|'regeneration'|'slowing'|'crawling'|'dodge'|'block'|'malfunction'|'detach'|'knockout'|'recover'|'timeout';
export interface EffectGraphic {url:string;width:number;height:number;upper?:string;lower?:string}
interface Effect { status: 'ready'|'planned'; words: readonly string[]; sound: string|null; duration: number; priority: number; direct: boolean; major: boolean; art?:EffectGraphic; anchor?:'actor'|'target' }
/** Sole effect/sound semantic registry. Planned entries get captions, not an advertised finished effect. */
export const EFFECTS: Record<EffectId,Effect> = {
 strike:{status:'ready',words:['THUD!','BAM!','POW!','WHAM!'],sound:'strike',duration:620,priority:4,direct:true,major:true,art:graphics.strike},
 slash:{status:'ready',words:['RIP!','SLASH!','SLICE!'],sound:'slash',duration:620,priority:5,direct:true,major:true,art:graphics.slash},
 bite:{status:'ready',words:['CHOMP!','CRUNCH!'],sound:'bite',duration:620,priority:5,direct:true,major:true,art:graphics.bite},
 corrosion:{status:'ready',words:['CORROSION!','ACID ATTACK!'],sound:'corrosion',duration:760,priority:8,direct:false,major:true,art:graphics.corrosion},
 retaliation:{status:'ready',words:['RETRIBUTION!','THORN DAMAGE!'],sound:'retaliation',duration:650,priority:9,direct:false,major:true,art:graphics.retaliation,anchor:'actor'},
 electric:{status:'planned',words:['DISCHARGE'],sound:null,duration:650,priority:7,direct:false,major:false},
 poison:{status:'planned',words:['Poison'],sound:null,duration:550,priority:1,direct:false,major:false},
 bleed:{status:'planned',words:['Bleeding'],sound:null,duration:550,priority:1,direct:false,major:false},
 restraint:{status:'planned',words:['Restrained'],sound:null,duration:650,priority:3,direct:false,major:false},
 roar:{status:'planned',words:['Roar'],sound:null,duration:650,priority:3,direct:false,major:false},
 regeneration:{status:'planned',words:['Reweaving'],sound:null,duration:550,priority:1,direct:false,major:false},
 slowing:{status:'planned',words:['Slowed'],sound:null,duration:650,priority:2,direct:false,major:false},
 crawling:{status:'planned',words:['Crawling'],sound:null,duration:650,priority:2,direct:false,major:false},
 dodge:{status:'ready',words:['WHIFF!','MISSED!'],sound:'miss',duration:620,priority:2,direct:false,major:true},
 block:{status:'ready',words:['BLOCKED!','DENIED!'],sound:'guard',duration:400,priority:2,direct:false,major:true,art:graphics.block,anchor:'actor'},
 malfunction:{status:'planned',words:['Objection'],sound:null,duration:550,priority:3,direct:false,major:false},
 detach:{status:'planned',words:['Detached'],sound:null,duration:650,priority:3,direct:false,major:false},
 knockout:{status:'ready',words:['CEASED!','DEFEAT!'],sound:'defeat',duration:900,priority:10,direct:false,major:true},
 recover:{status:'planned',words:['Recovered'],sound:null,duration:450,priority:0,direct:false,major:false},
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
export const SOUND_GAINS:Readonly<Record<string,number>>={strike:1.15,guard:1.15,recoil:1.15,defeat:1.15};

/** Cosmetic pseudorandom choice from public event identity, stable across frames, seeking and reload.
 * Never uses hidden battle entropy and never changes gameplay or the authoritative timeline. */
export function letteringFor(battleId:string,event:BattleEvent):string{
 const id=effectFor(event),words=EFFECTS[id].words;let hash=2166136261;
 for(const character of `${battleId}:${event.sequence}:${event.offsetMs}:${id}`)hash=Math.imul(hash^character.charCodeAt(0),16777619);
 hash=Math.imul(hash^(hash>>>16),0x85ebca6b);hash=Math.imul(hash^(hash>>>13),0xc2b2ae35);hash=(hash^(hash>>>16))>>>0;
 return words[Math.floor(hash/4294967296*words.length)]!;
}
