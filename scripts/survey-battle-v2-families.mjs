/** Development-only model, not telemetry or gameplay calibration. No Worker caller. */
import {writeFile} from 'node:fs/promises';
import {DNA_CATALOGUE} from '../src/server/catalogue/dna.ts';
import {draw} from '../src/server/dna-mechanics.ts';
import {selectIntegratedForm} from '../src/server/integrated-form.ts';
import {VOTED_FAMILIES} from '../src/shared/integrated-form.ts';
const catalogue=Object.fromEntries(DNA_CATALOGUE.map(d=>[d.id,d]));let state=0x424c4f42;
function random(){state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;}
const report={model:'Current weighted dealing and all-liability safeguards, uniform random tray choices, all six doses/player, round-robin injections; expected uniform highest-vote tie shares. Not human playtest or observed production frequency.',seed:'0x424c4f42',descriptorVersion:'battle-v2-b2',cohorts:[]};
for(const n of [2,4,6,8]){
 const count=Object.fromEntries(VOTED_FAMILIES.map(f=>[f,0])),trials=20000;let noVotes=0;
 for(let trial=0;trial<trials;trial++){
  const players=Array.from({length:n},()=>{const tray=Array.from({length:4},()=>draw(random));if(tray.every(id=>catalogue[id].family==='liability'))tray[3]=draw(random,true);return {tray,plans:Array.from({length:6},()=>({primary:draw(random),safe:draw(random,true)}))};});
  const active={};for(let dose=0;dose<6;dose++)for(const player of players){const at=Math.floor(random()*4),id=player.tray[at];for(const target of catalogue[id].targets)active[target]={dnaId:id,contributions:[]};player.tray[at]=player.tray.every((id,i)=>i===at||catalogue[id].family==='liability')?player.plans[dose].safe:player.plans[dose].primary;}
  const form=selectIntegratedForm({active,attemptId:'development-survey',releasedAtMs:0},()=>0),maximum=Math.max(...Object.values(form.votes));
  if(!maximum){count.blob++;noVotes++;continue;}const tied=VOTED_FAMILIES.filter(f=>form.votes[f]===maximum);for(const f of tied)count[f]+=1/tied.length;
 }
 report.cohorts.push({players:n,trials,noVoteFallbacks:noVotes,selectionPercent:Object.fromEntries(Object.entries(count).map(([f,c])=>[f,+(100*c/trials).toFixed(2)]))});
}
await writeFile('docs/battle-v2-phase-c-review/family-regressions/vote-survey.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
