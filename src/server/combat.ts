import type { AwardId, AwardSummary, BattleEvent, BattleEventKind, BattleTimeline, BodySlot, ContributionSummary, CreatureStats, CreatureView, RivalView, RoundOutcome, RoundResult } from '../shared/types.ts';
import { BASE_STATS, clamp, diminishing } from './catalogue/mechanics.ts';
import type { AbilityKind } from './catalogue/mechanics.ts';
import { COMBAT_RULES as C, COMBAT_VERSION } from './catalogue/combat.ts';
import { rival, RIVAL_CATALOGUE } from './catalogue/rivals.ts';
import { dna, effectiveCreature, publicHistory } from './dna-mechanics.ts';
import type { Experiment, FrozenAbility, FrozenCreature } from './dna-mechanics.ts';

type Side = 'team' | 'rival';
type Weights = BattleEvent['contributorWeights'];
export interface StoredBattle { version: string; seed: string; timeline: BattleTimeline; result: RoundResult }
export interface CombatSession { version: string; sessionId: string; rivalIds: string[]; battle: StoredBattle | null; completed: RoundResult[] }
/** Only this seeded generator is used by the pure battle producer. Never send its seed. */
export function seededRandom(seed: string): () => number {
 let state=2166136261; for(const char of seed) state=Math.imul(state^char.charCodeAt(0),16777619)>>>0;
 return ()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
}
export function newCombatSession(sessionId: string=crypto.randomUUID(), seed: string=crypto.randomUUID()): CombatSession {
 const random=seededRandom(seed), ids=RIVAL_CATALOGUE.map(r=>r.id);
 for(let i=ids.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[ids[i],ids[j]]=[ids[j]!,ids[i]!];}
 return {version:COMBAT_VERSION,sessionId,rivalIds:ids.slice(0,3),battle:null,completed:[]};
}
export function rivalView(id: string): RivalView { const r=rival(id);return {id,name:r.name,assetId:`rival.${id}`,strength:r.strength,weakness:r.weakness}; }
const round = (n: number)=>Math.round(n*1e6)/1e6;
const sumWeights=(items:Weights[]):Weights=>{
 const map=new Map<string,number>();for(const w of items.flat())map.set(w.playerId,(map.get(w.playerId)??0)+w.weight);
 return [...map].sort(([a],[b])=>a.localeCompare(b)).map(([playerId,weight])=>({playerId,weight}));
};
/** Positive active stat deltas only; baseline damage/protection is deliberately unattributed. */
function statWeights(e:Experiment, key:keyof CreatureStats):Weights {
 const entries: {potency:number;weights:Weights}[]=[];let negative=0;
 for(const p of Object.values(e.active)){
  const d=dna(p.dnaId),delta=d.deltas[key]??0, share=1/d.targets.length;
  const units=p.contributions.reduce((n,c)=>n+c.units,0);if(!delta||!units)continue;
  const potency=delta*share*diminishing(units/share);if(potency<0){negative+=potency;continue;}
  entries.push({potency,weights:p.contributions.map(c=>({playerId:c.playerId,weight:c.units/units}))});
 }
 const total=entries.reduce((n,e)=>n+e.potency,0);if(!total)return[];
 const stat=effectiveCreature(e).stats[key];const credited=Math.min(total,Math.max(0,stat-Math.max(0,BASE_STATS[key]+negative)));
 return sumWeights(entries.map(e=>e.weights.map(w=>({...w,weight:w.weight*e.potency/total*credited/Math.max(stat,.000001)}))));
}
interface Fighter {
 side:Side; hp:number; maxHp:number; stats:CreatureStats; abilities:FrozenAbility[]; experiment:Experiment|null;
 nextAttack:number; attacks:number; landed:number; controlledUntil:number; controlUsed:number; immuneUntil:number;
 slowUntil:number; slow:number; corrodedUntil:number; corrosion:number; vulnerableUntil:number; vulnerability:number;
 statuses:Partial<Record<'poison'|'bleed',{until:number;source:Side;ability:FrozenAbility}>>;
 crawlingHazard: {until:number;ability:FrozenAbility}|null; shardsUntil:number; shard:FrozenAbility|null; creature:CreatureView|null;
}
function ability(f:Fighter,kind:AbilityKind):FrozenAbility|undefined {return f.abilities.find(a=>a.kind===kind);}
function value(f:Fighter,kind:AbilityKind){return ability(f,kind)?.magnitude??0;}
function cadence(f:Fighter,random:()=>number,time:number){
 const acceleration = random() < value(f, 'accelerated-attack') ? .65 : 1;
 return Math.ceil(clamp((C.attackBaseMs-(f.stats.agility-10)*45)*(1-value(f,'cadence'))*acceleration*(time<f.slowUntil?1+f.slow:1),[C.minAttackMs,C.maxAttackMs])/C.tickMs)*C.tickMs;
}
export const healthPercent=(hp:number,max:number)=>Math.round(Math.max(0,hp)/max*100*C.healthPercentPrecision)/C.healthPercentPrecision;
export function battleOutcome(teamHp:number,teamMax:number,rivalHp:number,rivalMax:number):RoundOutcome{
 if(teamHp<=0&&rivalHp<=0)return'draw';if(teamHp<=0)return'defeat';if(rivalHp<=0)return'victory';
 const a=healthPercent(teamHp,teamMax),b=healthPercent(rivalHp,rivalMax);return a===b?'draw':a>b?'victory':'defeat';
}
export function awardSummaries(contributions:ContributionSummary[]):AwardSummary[]{
 const fields: [AwardId,keyof ContributionSummary][]=[['instrument-of-ruin','damage'],['keeper-of-the-unkillable','protection'],['architect-of-inconvenience','inconvenience'],['most-questionable-science','liabilityDoses'],['anatomical-liability','malfunction'],['curator-of-the-unnecessary','cosmeticDoses']];
 return fields.flatMap(([awardId,field])=>{
  const amounts=contributions.map(c=>({id:c.playerId,value:Number(c[field])+(field==='protection'?c.healing:0)}));const best=Math.max(0,...amounts.map(c=>c.value));
  return best>0?[{awardId,recipientIds:amounts.filter(c=>Math.abs(c.value-best)<.000001).map(c=>c.id).sort(),evidenceAmount:round(best)}]:[];
 });
}
export function combineContributions(results:RoundResult[]):ContributionSummary[]{
 const map=new Map<string,ContributionSummary>();for(const c of results.flatMap(r=>r.contributions)){
  const prior=map.get(c.playerId);if(!prior)map.set(c.playerId,{...c});else for(const key of ['damage','protection','healing','inconvenience','liabilityDoses','malfunction','cosmeticDoses'] as const)prior[key]=round(prior[key]+c[key]);
 }return [...map.values()].sort((a,b)=>a.playerId.localeCompare(b.playerId));
}
/** A bounded, synchronous producer. No wall clock, random UUID or runtime physics inside it. */
export function produceBattle(frozen:FrozenCreature,rivalId:string,roundNumber:1|2|3,startsAtMs:number,seed:string,battleId:string, participants:{playerId:string;alias:string}[]=[]):StoredBattle{
 const random=seededRandom(seed),definition=rival(rivalId),multiplier=C.roundMultipliers[roundNumber-1]!;
 const experiment:Experiment={id:frozen.attemptId,rulesVersion:frozen.rulesVersion,catalogueVersion:frozen.catalogueVersion,compositionSeed:frozen.creature.compositionSeed,active:structuredClone(frozen.active),history:structuredClone(frozen.history),frozen:null};
 const rivalStats={...definition.stats,vitality:definition.stats.vitality*multiplier,power:definition.stats.power*multiplier,regeneration:definition.stats.regeneration*multiplier};
 const fighter=(side:Side,stats:CreatureStats,abilities:FrozenAbility[],experiment:Experiment|null,creature:CreatureView|null):Fighter=>({side,hp:stats.vitality,maxHp:stats.vitality,stats:{...stats},abilities:structuredClone(abilities),experiment,creature,nextAttack:C.openingMs,attacks:0,landed:0,controlledUntil:0,controlUsed:0,immuneUntil:0,slowUntil:0,slow:0,corrodedUntil:0,corrosion:0,vulnerableUntil:0,vulnerability:0,statuses:{},crawlingHazard:null,shardsUntil:0,shard:null});
 const team=fighter('team',frozen.stats,frozen.abilities,experiment,structuredClone(frozen.creature));
 const enemy=fighter('rival',rivalStats,definition.abilities.map(a=>({...a,magnitude:a.magnitude*multiplier,sourceDnaIds:[],contributors:[]})),null,null);
 const events:BattleEvent[]=[];
 function emit(time:number,kind:BattleEventKind,actor:Fighter,target:Fighter,magnitude:number,caption:string,weights:Weights=[],a?:FrozenAbility,creature?:CreatureView,durationMs?:number){
  if(events.length>=C.maxEvents)throw new Error('Battle event bound exceeded');
  events.push({sequence:events.length+1,offsetMs:time,kind,actor:actor.side,target:target.side,magnitude:round(magnitude),caption,mutationId:a?.sourceDnaIds[0]??null,contributorWeights:weights.map(w=>({...w,weight:round(w.weight)})),teamHealth:healthPercent(team.hp,team.maxHp),rivalHealth:healthPercent(enemy.hp,enemy.maxHp),...(creature?{creature:structuredClone(creature)}:{}),...(durationMs?{durationMs}:{})});
 }
 const credits=(f:Fighter,key:keyof CreatureStats)=>f.experiment?statWeights(f.experiment,key):[];
 function damage(time:number,kind:BattleEventKind,from:Fighter,to:Fighter,n:number,caption:string,weights:Weights=[],a?:FrozenAbility){const actual=Math.min(Math.max(0,to.hp),Math.max(0,n));to.hp=round(Math.max(0,to.hp-n));emit(time,kind,from,to,actual,caption,weights,a);}
 function control(time:number,from:Fighter,to:Fighter,a:FrozenAbility,caption:string){
  if(time<to.immuneUntil||to.hp<=0)return;
  const remaining=C.durationMs*frozen.constraints.maxControlDuty-to.controlUsed;
  const duration=Math.min(remaining,a.magnitude*1000*(1-value(to,'restraint-resistance')));
  if(duration<=0)return;const boundedDuration=Math.min(remaining,round(duration));
  const resistance=ability(to,'restraint-resistance');if(resistance&&a.magnitude*1000>boundedDuration)emit(time,'recover',to,to,(a.magnitude*1000-boundedDuration)/1000,'The counterweight resists restraint.',resistance.contributors,resistance);
  to.controlUsed+=boundedDuration;to.controlledUntil=Math.max(to.controlledUntil,time+boundedDuration);to.immuneUntil=time+boundedDuration+frozen.constraints.sameControlImmunityMs;
  emit(time,'restraint',from,to,boundedDuration/1000,caption,a.contributors,a,undefined,boundedDuration);
 }
 function detach(time:number,f:Fighter,slot:BodySlot,caption:string){
  const part=f.experiment?.active[slot];if(!part||!f.creature||!f.experiment)return;
  const d=dna(part.dnaId),sources=part.contributions;const total=sources.reduce((n,c)=>n+c.units,0);
  const weights=sumWeights([sources.map(c=>({playerId:c.playerId,weight:c.units/total}))]);
  const removed=f.creature.parts.filter(p=>p.instanceId===`${f.experiment!.id}:${slot}`);
  const a=d.abilities[0];const frozenA=a?ability(f,a.kind):undefined;
  if(part.dnaId==='wandering-limb'&&frozenA)f.crawlingHazard={until:time+7000,ability:frozenA};
  if(part.dnaId==='porcelain-teeth'&&frozenA){f.shard=frozenA;f.shardsUntil=time+3000;}
  if(part.dnaId==='candle-flesh'&&frozenA){enemy.slow=frozenA.magnitude;enemy.slowUntil=time+(frozenA.lifetimeMs??2000);const delayed=Math.min(2000,Math.max(0,enemy.nextAttack-time))*frozenA.magnitude;enemy.nextAttack+=delayed;emit(time,'slowing',f,enemy,delayed/1000,'Melting flesh leaves a slowing slick.',frozenA.contributors,frozenA,undefined,2000);}
  delete f.experiment.active[slot];const effective=effectiveCreature(f.experiment);f.stats=effective.stats;f.abilities=effective.abilities;
  // Removed anatomy stays removed, rather than inventing a replacement mouth/limb.
  f.creature.parts=f.creature.parts.filter(p=>!removed.includes(p));
  if(removed.some(p=>p.slot==='body')&&!f.creature.parts.some(p=>p.slot==='body'))f.creature.parts.unshift({instanceId:'remaining-core',slot:'body',assetId:'creature.blob',variant:0,scale:1,contributorIds:[]});
  f.hp=Math.min(f.hp,f.stats.vitality);f.maxHp=f.stats.vitality;
  emit(time,'detach',f,f,1,caption,weights,{kind:'lost-action',magnitude:0,unit:'ratio',sourceDnaIds:[part.dnaId],contributors:weights},f.creature);
 }
 function attack(time:number,from:Fighter,to:Fighter){
  if(time<from.controlledUntil){from.nextAttack=from.controlledUntil;return;}
  from.attacks++;from.nextAttack=time+cadence(from,random,time);
  const mishap=clamp(from.stats.instability*C.mishapPerInstability,[0,C.maxMishapChance]);
  if(random()<mishap){
   const n=C.mishapDamage*(1-value(from,'landing-recovery'));damage(time,'malfunction',from,from,n,'An organ has filed an objection.',credits(from,'instability'));
   return;
  }
  if(random()<value(from,'lost-action')){const a=ability(from,'lost-action')!;emit(time,'malfunction',from,from,1,'Existential doubts consume an attack.',a.contributors,a);return;}
  const hit=clamp(C.baseHit+value(from,'accuracy')+(time<to.vulnerableUntil?to.vulnerability:0),C.hitBounds);
  const dodge=clamp((to.stats.agility-6)*.01,C.dodgeBounds);
  if(random()>hit||random()<dodge){
   from.vulnerableUntil=time+1000;from.vulnerability=value(from,'miss-vulnerability');
   emit(time,'dodge',to,from,0,'The blow misses its intended department.');const landing=ability(from,'landing-recovery');if(landing){const saved=(from.nextAttack-time)*landing.magnitude;from.nextAttack-=saved;emit(time,'recover',from,from,saved/1000,'Soft paws shorten landing recovery.',landing.contributors,landing);}return;
  }
  from.landed++;
  const spread=C.damageSpread[0]+random()*(C.damageSpread[1]-C.damageSpread[0]);
  const raw=from.stats.power*spread;
  const protection=Math.max(0,to.stats.protection-(time<to.corrodedUntil?to.corrosion:0));
  const prevented=raw*Math.min(C.maxArmorReduction,protection*C.armorDamageRatio);
  const form=from.experiment?.active.mouth?.dnaId==='guillotine-teeth'?'A guillotine bite lands.':from.experiment?.active.mouth?.dnaId==='porcelain-teeth'?'Porcelain teeth bite.':from.experiment?.active['forelimb-left']?.dnaId==='razor-talons'||from.experiment?.active['forelimb-right']?.dnaId==='razor-talons'?'Active talons slash.':'A body strike lands.';
  damage(time,'attack',from,to,raw-prevented,from.side==='team'?form:definition.archetype==='heavy-bites'?'The maw closes in a heavy bite.':definition.archetype==='speed'?'The seraph darts in for a strike.':'The rival strikes.',credits(from,'power'));
  if(prevented>0)emit(time,'block',to,to,Math.min(raw,prevented),'Armor absorbs part of the blow.',credits(to,'protection'));
  const electric=ability(from,'electric-strike');if(electric&&from.landed%3===0)damage(time,'electric',from,to,electric.magnitude,'The coils discharge.',electric.contributors,electric);
  for(const kind of ['poison','bleed'] as const){const a=ability(from,kind);if(a){to.statuses[kind]={until:time+(a.lifetimeMs??3000),source:from.side,ability:a};emit(time,kind,from,to,0,kind==='poison'?'Poison enters circulation.':'Talons open a bleeding wound.',[],a,undefined,a.lifetimeMs);}}
  const acid=ability(from,'armor-reduction');if(acid){to.corrosion=acid.magnitude;to.corrodedUntil=time+(acid.lifetimeMs??4000);emit(time,'corrosion',from,to,acid.magnitude,'Corrosion weakens the armor.',acid.contributors,acid,undefined,acid.lifetimeMs);}
  for(const kind of ['restraint','attack-delay','crawling-distraction'] as const){const a=ability(from,kind);if(a)control(time,from,to,a,kind==='attack-delay'?'A dreadful roar delays the rival.':'A limb restrains the rival.');}
  // No retaliation can trigger retaliation; it is contact-only, not recursive damage.
  for(const kind of ['contact-retaliation','shard-retaliation'] as const){const a=ability(to,kind)??(kind==='shard-retaliation'&&time<to.shardsUntil?to.shard:undefined);if(a)damage(time,'attack',to,from,a.magnitude,kind==='contact-retaliation'?'Barbs punish contact.':'Loose porcelain shards punish contact.',a.contributors,a);}
 }
 let duration:number=C.durationMs;
 for(let time:number=C.tickMs;time<=C.durationMs;time+=C.tickMs){
  for(const f of [team,enemy]){
   if(f.hp<=0)continue;
   if(time%C.tickDamageMs===0){
    for(const kind of ['poison','bleed'] as const){const status=f.statuses[kind];if(status&&time<=status.until){const from=status.source==='team'?team:enemy;damage(time,kind,from,f,status.ability.magnitude,kind==='poison'?'Poison damages tissue.':'The wound continues to bleed.',status.ability.contributors,status.ability);}}
    if(f.hp>0&&f.stats.regeneration>0){const healing=Math.min(f.stats.regeneration,f.maxHp-f.hp);if(healing>0){f.hp=round(f.hp+healing);emit(time,'regeneration',f,f,healing,'Tissue reweaves itself.',credits(f,'regeneration'));}}
   }
  }
  if(time===12_000){if(team.experiment?.active.skin?.dnaId==='candle-flesh')detach(time,team,'skin','Candle Flesh melts away; its protection penalty ends.');if(team.experiment?.active['forelimb-right']?.dnaId==='wandering-limb')detach(time,team,'forelimb-right','The Wandering Limb leaves its post.');}
  if(time===18_000&&team.experiment?.active.mouth?.dnaId==='porcelain-teeth')detach(time,team,'mouth','Porcelain Teeth shatter; the bite loses its teeth.');
  if(team.crawlingHazard&&team.hp>0&&enemy.hp>0&&time>=enemy.immuneUntil&&time<=team.crawlingHazard.until){control(time,team,enemy,team.crawlingHazard.ability,'The detached limb distracts its rival.');team.crawlingHazard=null;}
  const alive=[team.hp>0,enemy.hp>0];
  // Attacks scheduled for the same tick resolve as one exchange, permitting mutual KO.
  if(alive[0]&&team.hp>0&&time>=team.nextAttack)attack(time,team,enemy);
  if(alive[1]&&time>=enemy.nextAttack)attack(time,enemy,team);
  if(team.hp<=0||enemy.hp<=0){if(team.hp<=0)emit(time,'knockout',enemy,team,0,'Our specimen has ceased cooperating.');if(enemy.hp<=0)emit(time,'knockout',team,enemy,0,'The rival is no longer operational.');duration=time;break;}
 }
 if(duration===C.durationMs&&team.hp>0&&enemy.hp>0)emit(duration,'timeout',team,enemy,0,'Time expires. Remaining health percentage decides the result.');
 const outcome=battleOutcome(team.hp,team.maxHp,enemy.hp,enemy.maxHp);
 const contributions:ContributionSummary[]=participants.map(p=>({...p,damage:0,protection:0,healing:0,inconvenience:0,liabilityDoses:0,malfunction:0,cosmeticDoses:0}));
 for(const h of frozen.history){let c=contributions.find(c=>c.playerId===h.playerId);if(!c){c={playerId:h.playerId,alias:h.alias,damage:0,protection:0,healing:0,inconvenience:0,liabilityDoses:0,malfunction:0,cosmeticDoses:0};contributions.push(c);}if(dna(h.dnaId).family==='cosmetic')c.cosmeticDoses++;if(dna(h.dnaId).family==='liability')c.liabilityDoses++;}
 for(const event of events){const field=event.kind==='block'?'protection':event.kind==='regeneration'?'healing':event.kind==='malfunction'?'malfunction':['restraint','corrosion','slowing'].includes(event.kind)?'inconvenience':['attack','electric','poison','bleed'].includes(event.kind)&&event.actor==='team'?'damage':null;
  for(const w of event.contributorWeights){const c=contributions.find(c=>c.playerId===w.playerId);if(c&&field)c[field]=round(c[field]+(field==='malfunction'?1:event.magnitude)*w.weight);if(c&&event.kind==='poison'&&event.magnitude>0)c.inconvenience=round(c.inconvenience+event.magnitude*w.weight);}
 }
 contributions.sort((a,b)=>a.playerId.localeCompare(b.playerId));
 const timeline:BattleTimeline={battleId,startsAtMs,durationMs:duration,events,initialCreature:structuredClone(frozen.creature),rival:rivalView(rivalId)};
 const statuses=publicHistory(experiment);
 const result:RoundResult={battleId,round:roundNumber,rival:rivalView(rivalId),outcome,completedAtMs:startsAtMs+duration,stats:{...frozen.stats},traits:frozen.history.map((h,i)=>({name:dna(h.dnaId).autopsyName,status:statuses[i]!.status==='replaced'&&Object.values(frozen.active).some(p=>p.contributions.some(c=>c.injectionId===h.actionId))?'detached in battle':statuses[i]!.status,description:`${dna(h.dnaId).mechanicalIntent}. Per unreinforced two-player dose: ${Object.entries(dna(h.dnaId).deltas).map(([key,value])=>`${key} ${value!>0?'+':''}${value}`).join(', ') || 'no stat delta'}${dna(h.dnaId).abilities.map(a=>`; ${a.kind}: ${a.magnitude} ${a.unit}${a.lifetimeMs?`, ${a.lifetimeMs/1000}s`:''}`).join('')}. Dose potency: 2/${frozen.playerCount}; reinforced effects diminish and cap.`})),awards:awardSummaries(contributions),contributions,finalTeamHealth:healthPercent(team.hp,team.maxHp),finalRivalHealth:healthPercent(enemy.hp,enemy.maxHp)};
 return {version:COMBAT_VERSION,seed,timeline,result};
}
