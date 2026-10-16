import type { BattleEvent, BattleTimeline } from '../../shared/types.ts';
import type { PublicIntegratedForm } from '../../shared/integrated-form.ts';
import { battleFrame } from '../battle-playback.ts';
import { EFFECTS, effectFor, soundFor, letteringFor } from './effects.ts';
export type Pose = 'idle'|'attack'|'recoil'|'defense'|'defeat';
export type Side = 'team'|'rival';
export const ANIMATION_BOUNDS = { anticipation:180, recovery:420, hitStop:45, effects:3, lettering:1, voices:8 } as const;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export function sceneFrame(timeline:BattleTimeline, elapsed:number, motion=true){
 const state=battleFrame(timeline,timeline.startsAtMs+elapsed);
 // Transient arena effects clear at the boundary; a separate final word remains.
 const remaining=timeline.durationMs-elapsed;
 const countdown=elapsed>=0&&remaining>0&&remaining<=3000?Math.ceil(remaining/1000):null;
 const terminalEvent=remaining<=0?timeline.events.findLast(e=>e.offsetMs<=timeline.durationMs&&(e.kind==='knockout'||e.kind==='timeout')):undefined;
 const finalLetter=remaining<=0?(terminalEvent?letteringFor(timeline.battleId,terminalEvent):EFFECTS.timeout.words[0]!):null;
 // The producer resolves timeouts by the published remaining health percentages.
 // Read the terminal snapshot, never intermediate frames or art-only overrides.
 const timeoutWinner=terminalEvent?.kind==='timeout'?(terminalEvent.teamHealth===terminalEvent.rivalHealth?'Draw':terminalEvent.teamHealth>terminalEvent.rivalHealth?'Our specimen wins':`${timeline.rival.name} wins`):null;
 const effects=elapsed>=timeline.durationMs?[]:timeline.events.filter(e=>elapsed>=e.offsetMs&&elapsed-e.offsetMs<EFFECTS[effectFor(e)].duration)
  .map(event=>({event,id:effectFor(event),age:elapsed-event.offsetMs}))
  .sort((a,b)=>EFFECTS[b.id].priority-EFFECTS[a.id].priority||b.event.sequence-a.event.sequence);
 const active=effects.filter(e=>EFFECTS[e.id].status==='ready').slice(0,ANIMATION_BOUNDS.effects);
 const letter=active.find(e=>EFFECTS[e.id].major)??null;
 const fighter=(side:Side)=>{
  if(timeline.events.some(e=>e.kind==='knockout'&&e.target===side&&e.offsetMs<=elapsed))return {pose:'defeat' as Pose,attackStyle:'generic' as const,x:0,rotation:0,reaction:'defeat',contact:false};
  const attack=elapsed>=timeline.durationMs?undefined:timeline.events.findLast(e=>EFFECTS[effectFor(e)].direct&&e.actor===side&&elapsed>=e.offsetMs-ANIMATION_BOUNDS.anticipation&&elapsed<e.offsetMs+ANIMATION_BOUNDS.recovery);
  const missed=elapsed>=timeline.durationMs?undefined:timeline.events.findLast(e=>e.kind==='dodge'&&e.target===side&&elapsed>=e.offsetMs-180&&elapsed<e.offsetMs+420);
  const reaction=effects.find(e=>(e.event.target===side&&e.event.magnitude>0&&e.event.kind!=='regeneration')||(e.id==='dodge'&&e.event.actor===side)||((e.id==='block')&&e.event.actor===side));
  let pose:Pose='idle',x=0,rotation=0;let contact=false;
  const outgoing=attack??missed;
  if(outgoing){
   const age=elapsed-outgoing.offsetMs; contact=age>=0&&age<45;pose=age<-90?'idle':'attack';
   // Short anticipation, 45ms cosmetic hold, then recover. Clock itself never stops.
   x=age<0?(-5+35*clamp((age+180)/180)):30*(1-clamp((age-45)/375));
   rotation=age<0?-2*(1-clamp((age+180)/180)):1*(1-clamp(age/420));
  }else if(reaction){
   pose=reaction.id==='block'||reaction.id==='dodge'?'defense':'recoil';
   x=-9*Math.sin(Math.PI*clamp(reaction.age/420));rotation=-3*Math.sin(Math.PI*clamp(reaction.age/420));
  }
  return {pose,attackStyle:attack&&effectFor(attack)==='bite'?'bite' as const:'generic' as const,x:motion?x:0,rotation:motion?rotation:0,reaction:reaction?.id??'none',contact};
 };
 return {state,team:fighter('team'),rival:fighter('rival'),effects:active,letter,finalLetter,timeoutWinner,countdown,captions:state.captions,
  compact:effects.filter(e=>!EFFECTS[e.id].major||EFFECTS[e.id].status==='planned').slice(0,4)};
}
/** Teeth meet at contact, open in recoil and close again. Pure seeking; static mode stays closed. */
export function biteJawOffset(age:number,motion:boolean){return motion&&age>0&&age<300?16*Math.sin(Math.PI*age/300):0;}
export function integrationFrame(form:PublicIntegratedForm,now:number,motion=true){
 const elapsed=Math.max(0,now-form.integration.startsAtMs);
 const reveal=clamp((elapsed-2000)/1500);
 return {elapsed,phase:elapsed<2000?'integrating':elapsed<3500?'reveal':elapsed<5000?'unleash':'battle',
  reveal:motion?reveal:elapsed<2000?0:1,fluidPulse:false,done:now>=form.integration.endsAtMs};
}
export interface InjectionAccent { sequence:number; started:number; ends:number }
/** New accepted state replaces the accent; nothing is queued. Selection/rejection/replay stays inert. */
export function acceptedAccent(previous:InjectionAccent|null,sequence:number,now:number,accepted:boolean):InjectionAccent|null{
 if(!accepted||sequence<=(previous?.sequence??0))return previous;
 return {sequence,started:now,ends:now+800};
}
export function timelyCues(events:BattleEvent[],previous:number,now:number,hidden=false){
 if(hidden||now<previous||now-previous>250)return [];
 return initiationEvents(events).filter(e=>e.offsetMs>previous&&e.offsetMs<=now&&soundFor(e))
  .sort((a,b)=>EFFECTS[effectFor(b)].priority-EFFECTS[effectFor(a)].priority||a.sequence-b.sequence).slice(0,3);
}
/** Stateless onset derivation: refreshes/ticks do not replay a sound while a status is active.
 * Reading the full prefix also suppresses a tick immediately after seeking/reconnection. */
export function initiationEvents(events:BattleEvent[]){
 const until=new Map<string,number>();return events.filter(e=>{
  const id=effectFor(e);if(!soundFor(e))return false;
  if(id==='poison'||id==='bleed'){
   if(e.magnitude!==0)return false;
   const key=`${e.target}:${id}`,active=e.offsetMs<=(until.get(key)??-1);
   until.set(key,e.offsetMs+(e.durationMs??3000));return !active;
  }
  if(id==='regeneration'){
   const key=`${e.target}:${id}`,active=e.offsetMs<=(until.get(key)??-1);
   until.set(key,e.offsetMs+1100);return !active;
  }
  return true;
 });
}
