import { mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
import { newExperiment, applyMutation, effectiveCreature, publicCreature } from '../src/server/dna-mechanics.ts';
import { produceBattle, seededRandom } from '../src/server/combat.ts';
import { RIVAL_CATALOGUE } from '../src/server/catalogue/rivals.ts';
import { DNA_CATALOGUE } from '../src/server/catalogue/dna.ts';
import { PRODUCER_CONSTRAINTS } from '../src/server/catalogue/mechanics.ts';
const rows=[],times=[];let maxEvents=0,maxBytes=0;const eventKinds=new Set();
for(let n=2;n<=8;n++)for(const round of [1,2,3])for(const rival of RIVAL_CATALOGUE)for(const strategy of ['random','tactical','cosmetic']){
 let wins=0,draws=0,losses=0,duration=0;
 for(let sample=0;sample<12;sample++){
  const seed=`${n}/${round}/${rival.id}/${strategy}/${sample}`,random=seededRandom(seed),e=newExperiment();
  for(let i=0;i<n*6;i++){const choices=DNA_CATALOGUE.filter(d=>strategy==='random'||d.family===strategy);const d=choices[Math.floor(random()*choices.length)];applyMutation(e,d.id,`p${i%n}`,`Scientist ${i%n}`,crypto.randomUUID(),i,n);}
  const f={attemptId:e.id,rulesVersion:e.rulesVersion,catalogueVersion:e.catalogueVersion,playerCount:n,releasedAtMs:0,reason:'deadline',creature:publicCreature(e),...effectiveCreature(e),constraints:{...PRODUCER_CONSTRAINTS},active:structuredClone(e.active),history:structuredClone(e.history)};
  const start=performance.now(),b=produceBattle(f,rival.id,round,0,seed,'simulation');times.push(performance.now()-start);
  assert.ok(b.timeline.durationMs<=30000&&b.timeline.events.length<=512);assert.ok(b.timeline.events.every(e=>e.teamHealth>=0&&e.rivalHealth>=0));
  for(const side of ['team','rival']){const controls=b.timeline.events.filter(e=>e.kind==='restraint'&&e.target===side);assert.ok(controls.reduce((n,e)=>n+e.durationMs,0)<=10500);for(let i=1;i<controls.length;i++)assert.ok(controls[i].offsetMs>=controls[i-1].offsetMs+controls[i-1].durationMs+5000);}
  maxEvents=Math.max(maxEvents,b.timeline.events.length);maxBytes=Math.max(maxBytes,Buffer.byteLength(JSON.stringify(b.timeline)));b.timeline.events.forEach(e=>eventKinds.add(e.kind));duration+=b.timeline.durationMs;
  if(b.result.outcome==='victory')wins++;else if(b.result.outcome==='draw')draws++;else losses++;
 }
 rows.push({n,round,rival:rival.id,strategy,samples:12,wins,draws,losses,meanDurationMs:Math.round(duration/12)});
}
times.sort((a,b)=>a-b);const byRound=[1,2,3].map(round=>({round,...Object.fromEntries(['random','tactical','cosmetic'].map(strategy=>{const matching=rows.filter(r=>r.round===round&&r.strategy===strategy),samples=matching.reduce((n,r)=>n+r.samples,0);return[strategy,{samples,winRate:matching.reduce((n,r)=>n+r.wins,0)/samples,drawRate:matching.reduce((n,r)=>n+r.draws,0)/samples,meanDurationMs:Math.round(matching.reduce((n,r)=>n+r.meanDurationMs*r.samples,0)/samples)}];}))}));
const report={version:'0.3.0',simulationCount:times.length,seededCases:true,nodeTimingIsNotCloudflareCpu:true,timingMs:{median:times[Math.floor(times.length*.5)],p95:times[Math.floor(times.length*.95)],max:times.at(-1)},maxEvents,maxTimelineBytes:maxBytes,eventKinds:[...eventKinds].sort(),byRound,rows};
await mkdir('dist/combat-checks',{recursive:true});await writeFile('dist/combat-checks/simulation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,rows:undefined},null,2));
