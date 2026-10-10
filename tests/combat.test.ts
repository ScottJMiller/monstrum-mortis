import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { applyMutation, beginRelease } from '../src/server/dna-mechanics.ts';
import { newRoom, connect, startRound, settle, snapshot, disconnect, advancePrivate, replayPrivate, completePublicRound } from '../src/server/room-model.ts';
import type { Seat } from '../src/server/room-model.ts';
import { awardSummaries, battleOutcome, newCombatSession, produceBattle } from '../src/server/combat.ts';
import { DNA_CATALOGUE } from '../src/server/catalogue/dna.ts';
import { RIVAL_CATALOGUE } from '../src/server/catalogue/rivals.ts';
import { GAME_RULES } from '../src/shared/rules.ts';
import { parseAction } from '../src/server/validation.ts';
import { PROTOCOL_VERSION } from '../src/shared/protocol.ts';
import { migrateRoom } from '../src/server/room-storage.ts';
import { battleFrame } from '../src/client/battle-playback.ts';
import { ASSET_MANIFEST } from '../src/assets/manifest.ts';
const uid=()=>crypto.randomUUID();
function room(n=2,visibility:'private'|'public'='private'){
 const r=newRoom('ABCDEF',visibility,'remote','secret',uid(),'',0);
 if(visibility==='public')r.publicState={region:'americas',sessionId:uid(),teamScore:0,completed:[],ready:[],replay:[],resultsStartedAtMs:null};
 for(let i=0;i<n;i++){const s:Seat={id:`p${i}`,guestId:null,alias:`Scientist ${i}`,symbol:'*',role:'player',operationHash:uid(),entryFingerprint:'',tokenHash:'hidden',joinedAtMs:0,connectedAtMs:null,connected:false,disconnectDeadlineMs:null,eligible:true,finished:false,departed:false,remainingDoses:0,nextInjectionAtMs:0};r.seats.push(s);connect(r,s,0);}
 startRound(r,0);settle(r,8000);return r;
}
function specimen(ids:string[],n=2){const r=room(n);ids.forEach((id,i)=>applyMutation(r.experiment!,id,r.seats[i%n]!.id,r.seats[i%n]!.alias,uid(),8000+i,n));beginRelease(r,9000,'deadline');return r.experiment!.frozen!;}
const run=(ids:string[],seed='fixed',round:1|2|3=2,rival='iron-widow')=>produceBattle(specimen(ids),rival,round,14000,seed,'battle-fixture');

test('seeded timelines are repeatable, bounded and leave the frozen creature immutable',()=>{
 const f=specimen(['razor-talons','venom-glands','hook-tentacles','reweaving-tissue','titan-fibers']),before=structuredClone(f);
 const a=produceBattle(f,'the-unfinished',2,14000,'test-seed','battle-fixture'),b=produceBattle(f,'the-unfinished',2,14000,'test-seed','battle-fixture');
 assert.deepEqual(a,b);assert.deepEqual(f,before);assert.notDeepEqual(a.timeline.events,produceBattle(f,'the-unfinished',2,14000,'another-seed','battle-fixture').timeline.events);
 assert.ok(a.timeline.durationMs<=30000);assert.ok(a.timeline.events.length<=512);assert.ok(a.timeline.events.every((e,i)=>e.sequence===i+1&&e.offsetMs>=0&&e.offsetMs<=a.timeline.durationMs&&(i===0||a.timeline.events[i-1]!.offsetMs<=e.offsetMs)&&e.teamHealth>=0&&e.teamHealth<=100&&e.rivalHealth>=0&&e.rivalHealth<=100));
 assert.ok(!JSON.stringify(a.timeline).includes('test-seed'));assert.ok(!('outcome'in a.timeline));
});
for(const d of DNA_CATALOGUE)test(`combat accepts ${d.autopsyName} and stays bounded`,()=>{
 const battle=run([d.id]);assert.ok(battle.timeline.events.length>0&&battle.timeline.events.length<=512);assert.ok(battle.result.stats.vitality>0);assert.ok(battle.result.traits[0]!.description.includes(d.mechanicalIntent));
 if(d.family==='cosmetic'){assert.equal(battle.result.contributions[0]!.damage,0);assert.equal(battle.result.contributions[0]!.cosmeticDoses,1);}
});

test('replacement removes active damage/ability credit; paired surviving sources split normalized credit',()=>{
 const replaced=run(['razor-talons','kitten-paws']);assert.ok(!replaced.timeline.events.some(e=>e.kind==='bleed'));assert.equal(replaced.result.contributions.find(p=>p.playerId==='p0')!.damage,0);
 const active=run(['venom-glands','venom-glands']);const poison=active.timeline.events.filter(e=>e.kind==='poison'&&e.magnitude>0);
 assert.ok(poison.length);for(const e of poison)assert.deepEqual(e.contributorWeights,[{playerId:'p0',weight:.5},{playerId:'p1',weight:.5}]);
 const partial=run(['razor-talons','wandering-limb']);assert.ok(partial.timeline.events.some(e=>e.kind==='bleed'));assert.ok(partial.result.contributions.find(p=>p.playerId==='p0')!.damage>0);
});
test('baseline is unattributed; no qualifying evidence produces no award; ties share awards',()=>{
 assert.deepEqual(run([]).result.awards,[]);
 const cosmetic=run(['funeral-mane','cathedral-horns']);assert.deepEqual(cosmetic.result.awards.find(a=>a.awardId==='curator-of-the-unnecessary')!.recipientIds,['p0','p1']);assert.equal(cosmetic.result.awards.length,1);
 const zero={playerId:'none',alias:'None',damage:0,protection:0,healing:0,inconvenience:0,liabilityDoses:0,malfunction:0,cosmeticDoses:0};assert.deepEqual(awardSummaries([zero]),[]);
});
test('normalized two-to-eight-player investment gives identical mechanical timelines and apportioned credit',()=>{
 let expected:unknown;
 for(let n=2;n<=8;n++){const f=specimen(Array(n).fill('venom-glands'),n),b=produceBattle(f,'maw-engine',2,0,'normalization','normalization');const data=b.timeline.events.map(({contributorWeights,...e})=>e);if(expected)assert.deepEqual(data,expected);else expected=data;
  const credited=b.result.contributions.reduce((a,p)=>a+p.damage,0);assert.ok(credited>0);assert.ok(b.result.contributions.every(p=>Math.abs(p.damage-credited/n)<.00001));
 }
});
test('control duration and immunity prevent permanent restraint even at maximum reinforcement',()=>{
 const f=specimen(['hook-tentacles','hook-tentacles','hook-tentacles','hook-tentacles','bellows-lung','bellows-lung']);
 const b=produceBattle(f,'iron-widow',3,0,'control','control'),control=b.timeline.events.filter(e=>e.kind==='restraint'&&e.target==='rival');
 assert.ok(control.length);assert.ok(control.reduce((n,e)=>n+e.durationMs!,0)<=10500);
 for(let i=1;i<control.length;i++)assert.ok(control[i]!.offsetMs>=control[i-1]!.offsetMs+control[i-1]!.durationMs!+5000);
});
test('melting and detachment remove rendered parts and change subsequent attack availability',()=>{
 const b=run(['candle-flesh','wandering-limb','porcelain-teeth','auxiliary-heart'],'detach',1,'iron-widow');
 for(const id of ['candle-flesh','wandering-limb','porcelain-teeth']){const e=b.timeline.events.find(e=>e.kind==='detach'&&e.mutationId===id);assert.ok(e,id);assert.ok(!e.creature!.parts.some(p=>p.assetId===`mutation.${id}`));}
 const tooth=b.timeline.events.find(e=>e.kind==='detach'&&e.mutationId==='porcelain-teeth')!;assert.ok(!b.timeline.events.some(e=>e.offsetMs>tooth.offsetMs&&e.caption==='Porcelain teeth bite.'));
 assert.ok(b.timeline.events.some(e=>e.kind==='slowing'));assert.ok(b.timeline.events.some(e=>e.caption.includes('detached limb')));
});
test('expiry compares rounded health percentages; mutual knockout draws',()=>{
 assert.equal(battleOutcome(50,100,75,150),'draw');assert.equal(battleOutcome(50.001,100,50,100),'draw');assert.equal(battleOutcome(50.01,100,50,100),'victory');assert.equal(battleOutcome(0,100,0,100),'draw');assert.equal(battleOutcome(0,100,1,100),'defeat');
});
test('all six rivals have real alpha artwork and checked provenance; round strength is fixed',()=>{
 const ledger=JSON.parse(readFileSync('assets/rival-provenance.json','utf8'));
 for(const r of RIVAL_CATALOGUE){const a=ASSET_MANIFEST.find(a=>a.id===`rival.${r.id}`)!;assert.equal(a.status,'ready');assert.ok(existsSync(`public${a.url}`));const entry=ledger.find(e=>e.id===a.id);assert.equal(createHash('sha256').update(readFileSync(entry.source)).digest('hex'),entry.sourceSha256);assert.equal(createHash('sha256').update(readFileSync(entry.runtime)).digest('hex'),entry.runtimeSha256);assert.ok(entry.prompt&&entry.tool);}
 for(let i=0;i<20;i++){const c=newCombatSession(uid(),`rivals${i}`);assert.equal(new Set(c.rivalIds).size,3);}
});
test('one authoritative result survives repeated catch-up; snapshots hide seeds, stats and outcomes until completion',()=>{
 const r=room();settle(r,88000);const b=r.combat!.battle!,deadline=r.phaseDeadlineMs!;
 const view=snapshot(r,88000);assert.equal(view.phase,'battle');assert.equal(view.result,null);assert.equal(view.session!.completed.length,0);assert.equal(view.teamScore,0);
 for(const secret of [b.seed,'tokenHash','drawPlan','abilities'])assert.ok(!JSON.stringify(view).includes(secret));
 settle(r,deadline-1);assert.equal(r.phase,'battle');settle(r,deadline);assert.equal(r.phase,'autopsy');assert.equal(r.combat!.completed.length,1);const revision=r.revision;settle(r,deadline+1000);assert.equal(r.revision,revision);assert.equal(snapshot(r,deadline).teamScore,GAME_RULES.score[b.result.outcome]);
 assert.deepEqual(migrateRoom(structuredClone(r)).combat,r.combat);
});
test('private three-round progression, host-intent fences and replay reset',()=>{
 const r=room();const rivals=[];
 for(let i=1;i<=3;i++){settle(r,r.phaseDeadlineMs!);settle(r,r.phaseDeadlineMs!);settle(r,r.phaseDeadlineMs!);const id=r.combat!.battle!.timeline.battleId;settle(r,r.phaseDeadlineMs!);assert.equal(r.combat!.completed.length,i);rivals.push(r.combat!.battle!.result.rival.id);if(i<3){assert.throws(()=>advancePrivate(r,uid(),100000*i),/changed/);advancePrivate(r,id,100000*i);}}
 assert.equal(r.phase,'session-results');assert.equal(new Set(rivals).size,3);const session=r.combat!.sessionId;assert.throws(()=>replayPrivate(r,uid(),400000),/changed/);replayPrivate(r,session,400000);assert.equal(r.phase,'briefing');assert.equal(r.round,1);assert.notEqual(r.combat!.sessionId,session);assert.equal(r.combat!.completed.length,0);
});
test('started battles finish despite disconnects and cannot accept a forged binding outcome',()=>{
 const r=room(2,'public');settle(r,88000);const b=r.combat!.battle!;assert.throws(()=>completePublicRound(r,r.publicState!.sessionId,uid(),'victory',88000),/authoritative/);
 for(const s of r.seats)disconnect(r,s,88001);
 settle(r,r.phaseDeadlineMs!);assert.equal(r.combat!.completed.length,1);assert.equal(r.publicState!.completed.length,1);assert.equal(r.publicState!.teamScore,GAME_RULES.score[b.result.outcome]);
});
test('schema-4 migration preserves credentials and active DNA but enables combat only at a fresh boundary',()=>{
 const r=room();const old=structuredClone(r) as unknown as Record<string,unknown>;old.schemaVersion=4;delete old.combat;(old.experiment as {rulesVersion:string}).rulesVersion='0.2.0';const converted=migrateRoom(old);assert.equal(converted.schemaVersion,5);assert.equal(converted.combat,null);assert.equal(converted.seats[0]!.tokenHash,'hidden');assert.deepEqual(converted.experiment,r.experiment?{...r.experiment,rulesVersion:'0.2.0'}:null);settle(converted,88000);assert.equal(converted.phase,'battle');assert.equal(converted.phaseDeadlineMs,null);
});
test('new progression intents require valid fences; old protocol and authoritative outcome fields fail',()=>{
 const base={protocolVersion:PROTOCOL_VERSION,actionId:uid()};assert.throws(()=>parseAction({...base,kind:'advance-private-round'}));assert.throws(()=>parseAction({...base,kind:'play-again-private',sessionId:'bad'}));assert.throws(()=>parseAction({...base,kind:'advance-private-round',battleId:uid(),outcome:'victory'}));assert.equal(parseAction({...base,kind:'advance-private-round',battleId:uid()}).kind,'advance-private-round');assert.throws(()=>parseAction({...base,protocolVersion:4,kind:'start-private-session'}));
});
test('playback seeks the same health/anatomy after skipped frames and never replays a backlog',()=>{
 const b=run(['candle-flesh','porcelain-teeth'],'seek',1);const frame=battleFrame(b.timeline,b.timeline.startsAtMs+23000);
 assert.deepEqual(frame,battleFrame(b.timeline,b.timeline.startsAtMs+23000));assert.ok(frame.recent.every(e=>frame.elapsed-e.offsetMs<=800));const last=frame.visible.at(-1);assert.equal(frame.teamHealth,last?.teamHealth??100);assert.deepEqual(frame.creature,frame.visible.findLast(e=>e.creature)?.creature??b.timeline.initialCreature);assert.equal(battleFrame(b.timeline,0).elapsed,0);assert.equal(battleFrame(b.timeline,1e9).elapsed,b.timeline.durationMs);
});

test('stored combat corruption fails closed instead of rerolling or scoring it',()=>{
 for(const mutate of [(c:any)=>c.version='future',(c:any)=>c.rivalIds=['iron-widow','iron-widow','iron-widow'],(c:any)=>c.battle.timeline.events[0].sequence=9,(c:any)=>c.battle.timeline.events[0].teamHealth=101,(c:any)=>c.battle.timeline.events[0].contributorWeights=[{playerId:'p',weight:2}],(c:any)=>c.battle.result.completedAtMs++]){const r=room();settle(r,88000);mutate(r.combat);assert.throws(()=>migrateRoom(r),/stored combat/);}
});
test('trait-specific combat events, landing recovery and resistance remain effective at fractional potency',()=>{
 for(const [id,kind] of [['venom-glands','poison'],['razor-talons','bleed'],['storm-organ','electric'],['acid-bladder','corrosion'],['hook-tentacles','restraint'],['bellows-lung','restraint'],['reweaving-tissue','regeneration']])assert.ok(run([id!],'ability',2,'iron-widow').timeline.events.some(e=>e.kind===kind&&e.magnitude>0),id);
 const recovery=Array.from({length:12},(_,i)=>run(['kitten-paws'],`recovery${i}`,2,'the-unfinished').timeline.events).flat();assert.ok(recovery.some(e=>e.kind==='recover'&&e.caption.includes('landing')));
 const resistance=run(['counterweight-tail'],'resist',2,'the-unfinished').timeline.events;assert.ok(resistance.some(e=>e.kind==='recover'&&e.caption.includes('counterweight')));const restraint=resistance.find(e=>e.kind==='restraint'&&e.target==='team')!;assert.equal(restraint.durationMs,450);
});

test('the producer resolves an actual same-exchange mutual knockout as a draw',()=>{
 const frozen=specimen([]);frozen.stats={...RIVAL_CATALOGUE.find(r=>r.id==='maw-engine')!.stats};
 let mutual:ReturnType<typeof produceBattle>|undefined;
 for(let i=0;i<200&&!mutual;i++){const b=produceBattle(frozen,'maw-engine',2,0,`mutual-${i}`,'mutual-fixture');if(b.result.outcome==='draw'&&b.result.finalTeamHealth===0&&b.result.finalRivalHealth===0)mutual=b;}
 assert.ok(mutual);const knockouts=mutual.timeline.events.filter(e=>e.kind==='knockout');assert.equal(knockouts.length,2);assert.equal(knockouts[0]!.offsetMs,knockouts[1]!.offsetMs);assert.equal(mutual.timeline.durationMs,knockouts[0]!.offsetMs);
});
