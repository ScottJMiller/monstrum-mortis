import type { BattleTimeline } from '../../shared/types.ts';
export interface DamageFrame { severity:0|1|2; melted:boolean; limbLost:boolean; teethLost:boolean }
/** Text beside health replaces damaged artwork; retained flags reflect server events only. */
export function damageLabels(damage:DamageFrame){return [damage.severity===2?'Critical health':damage.severity===1?'Wounded':null,damage.melted?'Candle Flesh melted':null,damage.limbLost?'Wandering Limb detached':null,damage.teethLost?'Porcelain Teeth shattered':null].filter((label):label is string=>label!==null);}
/** Text damage feedback reads timeline health and accepted detachment events; it never changes artwork, family or stats. */
export function damageFrame(timeline:BattleTimeline,elapsed:number,side:'team'|'rival'):DamageFrame{
 let health=100,melted=false,limbLost=false,teethLost=false;
 for(const event of timeline.events){
  if(event.offsetMs>elapsed)break;
  health=side==='team'?event.teamHealth:event.rivalHealth;
  if(event.kind==='detach'&&event.actor===side){
   if(event.mutationId==='candle-flesh')melted=true;
   if(event.mutationId==='wandering-limb')limbLost=true;
   if(event.mutationId==='porcelain-teeth')teethLost=true;
  }
 }
 return {severity:health<=30?2:health<=65?1:0,melted,limbLost,teethLost};
}
