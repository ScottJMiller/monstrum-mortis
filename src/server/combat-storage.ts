import { COMBAT_RULES, COMBAT_VERSION } from './catalogue/combat.ts';
import { RIVAL_CATALOGUE } from './catalogue/rivals.ts';
import type { CombatSession } from './combat.ts';
import { ServiceError, UUID } from './validation.ts';
const fail=()=>{throw new ServiceError('temporarily-unavailable','Unsupported or corrupt stored combat.',503);};
const finite=(n:unknown,min:number,max:number)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
/** Validate persisted boundaries before using a stored seed/timeline, never reroll corrupt battles. */
export function validateCombatSession(c:CombatSession){
 if(!c||c.version!==COMBAT_VERSION||typeof c.sessionId!=='string'||!UUID.test(c.sessionId)||!Array.isArray(c.rivalIds)||c.rivalIds.length!==3||new Set(c.rivalIds).size!==3||!c.rivalIds.every(id=>RIVAL_CATALOGUE.some(r=>r.id===id))||!Array.isArray(c.completed)||c.completed.length>3)fail();
 const ids=new Set();let priorRound=0;
 for(const r of c.completed){
  if(!r||!UUID.test(r.battleId)||ids.has(r.battleId)||!Number.isInteger(r.round)||r.round<=priorRound||r.round>3||!['victory','draw','defeat'].includes(r.outcome)||!Number.isFinite(r.completedAtMs)||!Array.isArray(r.contributions)||!Array.isArray(r.awards)||!Array.isArray(r.traits)||!r.stats)fail();
  ids.add(r.battleId);priorRound=r.round;
 }
 const b=c.battle;if(!b)return;
 const t=b.timeline;if(b.version!==COMBAT_VERSION||typeof b.seed!=='string'||b.seed.length<1||b.seed.length>128||!t||!UUID.test(t.battleId)||!Number.isFinite(t.startsAtMs)||!finite(t.durationMs,100,COMBAT_RULES.durationMs)||!Array.isArray(t.events)||t.events.length<1||t.events.length>COMBAT_RULES.maxEvents||!b.result||b.result.battleId!==t.battleId||b.result.completedAtMs!==t.startsAtMs+t.durationMs||!['victory','draw','defeat'].includes(b.result.outcome))fail();
 let offset=0;
 for(const [i,e]of t.events.entries()){
  if(!e||e.sequence!==i+1||!finite(e.offsetMs,offset,t.durationMs)||!finite(e.teamHealth,0,100)||!finite(e.rivalHealth,0,100)||!finite(e.magnitude,0,1000)||!['team','rival'].includes(e.actor)||!['team','rival'].includes(e.target)||!Array.isArray(e.contributorWeights)||e.contributorWeights.some(w=>typeof w.playerId!=='string'||!finite(w.weight,0,1)))fail();
  offset=e.offsetMs;
 }
 if(offset!==t.durationMs)fail();
}
