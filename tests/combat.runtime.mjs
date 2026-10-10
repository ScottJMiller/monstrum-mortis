import assert from 'node:assert/strict';
import { runtime, action, uid, sleep, wait } from './support/combat-runtime.mjs';
import { GAME_RULES } from '../src/shared/rules.ts';
import { battleFrame } from '../src/client/battle-playback.ts';
const h=await runtime();let passed=0;const pass=s=>console.log(`PASS ${++passed}: ${s}`);
async function expire(id,e){await h.record(id,r=>{const next=Date.now()-1;if(r.phase==='battle'&&r.combat?.battle){const shift=next-r.phaseDeadlineMs;r.combat.battle.timeline.startsAtMs+=shift;r.combat.battle.result.completedAtMs+=shift;}r.phaseDeadlineMs=next;});return h.view(e);}
async function fixtureBattle(id,e){let v=await h.view(e);for(let i=0;i<4&&v.snapshot.phase!=='battle';i++)v=await expire(id,e);assert.equal(v.snapshot.phase,'battle');return v;}
try{
 const lab=await h.laboratory(),[host,peer]=lab.entries;
 assert.equal((await lab.sockets[0].send(action('start-private-session'))).kind,'action-accepted');
 const briefing=(await h.view(host)).snapshot;assert.ok(briefing.rival.strength&&briefing.rival.weakness);assert.equal(briefing.combatAvailable,true);
 await wait(()=>h.view(host),v=>v.snapshot.phase==='experiment');
 let views=await Promise.all(lab.entries.map(e=>h.view(e))),attemptId=views[0].snapshot.attemptId;
 const accepted=await Promise.all(lab.sockets.map((c,i)=>c.send(action('inject',{attemptId,specimenId:views[i].controller.tray[0].specimenId}))));assert.ok(accepted.every(r=>r.kind==='action-accepted'));
 views=await Promise.all(lab.entries.map(e=>h.view(e)));await sleep(Math.max(0,Math.max(...views.map(v=>v.controller.nextInjectionAtMs))-Date.now()+20));
 const switchAction=action('pull-switch',{attemptId});assert.equal((await lab.sockets[0].send(switchAction)).kind,'action-accepted');assert.equal((await lab.sockets[1].send(action('pull-switch',{attemptId}))).kind,'action-accepted');
 const release=await h.view(host);assert.equal(release.snapshot.phase,'release');assert.equal(release.snapshot.teamScore,0);assert.equal(release.snapshot.result,null);assert.equal(release.snapshot.battle,null);
 const battle=await wait(()=>h.view(host),v=>v.snapshot.phase==='battle',7000);assert.ok(battle.snapshot.battle.events.length>0);assert.equal(battle.snapshot.result,null);
 const stored=await h.record(lab.id), frozen=structuredClone(stored.experiment.frozen),seed=stored.combat.battle.seed,deadline=stored.phaseDeadlineMs;
 const late=await h.api(`/api/rooms/${lab.id}/join`,{operationId:uid(),alias:'Late Scientist',role:'player'}),lateSocket=await h.socket(late);
 const display=await h.api(`/api/rooms/${lab.id}/join`,{operationId:uid(),alias:'Shared Display',role:'display'}),screen=await h.socket(display);
 assert.equal((await h.view(late)).controller.remainingDoses,0);assert.equal((await h.view(display)).controller,null);
 for(const e of [host,peer,late,display]){const v=await h.view(e);assert.deepEqual(v.snapshot.battle,battle.snapshot.battle);assert.ok(!JSON.stringify(v.snapshot).includes(seed));assert.equal(v.snapshot.session.completed.length,0);}
 assert.equal((await screen.send(action('advance-private-round',{battleId:stored.combat.battle.timeline.battleId}))).code,'unauthorized');
 assert.equal((await lab.sockets[1].send(action('advance-private-round',{battleId:stored.combat.battle.timeline.battleId}))).code,'unauthorized');
 assert.equal((await lab.sockets[0].send(action('inject',{attemptId,specimenId:uid()}))).code,'wrong-phase');
 assert.equal((await lab.sockets[0].send(switchAction)).kind,'action-accepted');assert.deepEqual((await h.record(lab.id)).experiment.frozen,frozen);
 pass('real 8/6/5-second boundaries produce one shared battle; display, late seat, seed privacy, injection lock and host authorization pass');
 await h.evict(lab.id);
 assert.deepEqual((await h.view(peer)).snapshot.battle,battle.snapshot.battle);assert.equal((await h.record(lab.id)).combat.battle.seed,seed);
 await h.restart();lab.sockets[0]=await h.socket(host);lab.sockets[1]=await h.socket(peer);await h.socket(late);await h.socket(display);
 const resumed=(await h.view(host)).snapshot;assert.equal(resumed.phaseDeadlineMs,deadline);assert.deepEqual(resumed.battle,battle.snapshot.battle);assert.equal((await h.record(lab.id)).combat.battle.seed,seed);
 const now=Date.now();assert.deepEqual(battleFrame(resumed.battle,now),battleFrame(battle.snapshot.battle,now));
 pass('hibernating eviction and full local runtime restart preserve the seed/timeline/deadline and seek directly to the current frame');
 console.log(`Waiting ${Math.ceil((deadline-Date.now())/1000)}s for the actual battle completion alarm…`);
 const results=await wait(()=>h.view(host),v=>v.snapshot.phase==='autopsy',35000);assert.equal(results.snapshot.session.completed.length,1);assert.equal(results.snapshot.teamScore,GAME_RULES.score[results.snapshot.result.outcome]);assert.deepEqual((await h.record(lab.id)).experiment.frozen,frozen);
 for(const e of [peer,late,display])assert.deepEqual((await h.view(e)).snapshot.result,results.snapshot.result);
 const count=(await h.record(lab.id)).combat.completed.length;await h.view(host);await h.view(peer);assert.equal((await h.record(lab.id)).combat.completed.length,count);
 const oldAdvance=action('advance-private-round',{battleId:results.snapshot.result.battleId});assert.equal((await lab.sockets[0].send(action('advance-private-round',{battleId:uid()}))).code,'stale-session');assert.equal((await lab.sockets[0].send(oldAdvance)).kind,'action-accepted');
 assert.equal((await h.view(host)).snapshot.round,2);assert.equal((await lab.sockets[0].send(oldAdvance)).kind,'action-accepted');assert.equal((await h.view(host)).snapshot.round,2);
 pass('actual battle deadline commits one recoverable result and exact outcome score; duplicate advance receipts cannot skip a round');
 for(let round=2;round<=3;round++){await expire(lab.id,host);const experiment=await h.view(late);assert.equal(experiment.controller.remainingDoses,6);assert.equal(experiment.snapshot.playerCountAtExperimentStart,3);assert.equal(experiment.snapshot.mutations.length,0);await fixtureBattle(lab.id,host);const result=await expire(lab.id,host);assert.equal(result.snapshot.session.completed.length,round);if(round===2)assert.equal((await lab.sockets[0].send(action('advance-private-round',{battleId:result.snapshot.result.battleId}))).kind,'action-accepted');}
 const final=(await h.view(host)).snapshot;assert.equal(final.phase,'session-results');assert.equal(new Set(final.session.completed.map(r=>r.rival.id)).size,3);assert.equal(final.teamScore,final.session.completed.reduce((n,r)=>n+GAME_RULES.score[r.outcome],0));
 const prior=final.session.sessionId;assert.equal((await lab.sockets[1].send(action('play-again-private',{sessionId:prior}))).code,'unauthorized');assert.equal((await lab.sockets[0].send(action('play-again-private',{sessionId:prior}))).kind,'action-accepted');const replay=(await h.view(host)).snapshot;assert.equal(replay.round,1);assert.equal(replay.teamScore,0);assert.notEqual(replay.session.sessionId,prior);assert.equal(replay.session.completed.length,0);
 pass('private three-round session uses distinct rivals, fresh blobs/budgets, no earlier late-seat credit, correct total and host-only replay');
 const publicLab=await h.publicLaboratory(4);const pHost=publicLab.entries[0];await wait(()=>h.view(pHost),v=>v.snapshot.phase==='briefing');
 for(let round=1;round<=3;round++){await fixtureBattle(publicLab.id,pHost);const v=await expire(publicLab.id,pHost);assert.equal(v.snapshot.round,round);assert.equal(v.snapshot.publicSession.completedRounds,round);assert.equal(v.snapshot.session.completed.length,round);if(round<3){for(const c of publicLab.sockets)assert.equal((await c.send(action('next-round-ready'))).kind,'action-accepted');assert.equal((await h.view(pHost)).snapshot.phase,'autopsy');await h.record(publicLab.id,r=>{r.publicState.resultsStartedAtMs=Date.now()-10001;});await wait(()=>h.view(pHost),v=>v.snapshot.phase==='briefing');}}
 const publicFinal=(await h.view(pHost)).snapshot,publicId=publicFinal.session.sessionId;assert.equal(publicFinal.phase,'session-results');assert.equal(publicFinal.teamScore,publicFinal.session.completed.reduce((n,r)=>n+GAME_RULES.score[r.outcome],0));
 for(const c of publicLab.sockets.slice(0,2))assert.equal((await c.send(action('public-replay-opt-in'))).kind,'action-accepted');await expire(publicLab.id,pHost);const regroup=(await h.view(pHost)).snapshot;assert.equal(regroup.phase,'briefing');assert.equal(regroup.players.length,2);assert.equal(regroup.teamScore,0);assert.notEqual(regroup.session.sessionId,publicId);assert.equal(regroup.session.completed.length,0);
 pass('real matchmaking admission feeds three automatic public outcomes; ten-second readiness gate and explicit two-player regroup preserve progression and reset history');
 const eight=await h.laboratory(8),eHost=eight.entries[0];assert.equal((await eight.sockets[0].send(action('start-private-session'))).kind,'action-accepted');
 for(let round=1;round<=3;round++){
  await expire(eight.id,eHost);const current=(await h.view(eHost)).snapshot.attemptId;
  for(let dose=0;dose<6;dose++){
   await h.record(eight.id,r=>{for(const s of r.seats){s.nextInjectionAtMs=0;s.tray[0].dnaId='venom-glands';}});
   const views=await Promise.all(eight.entries.map(e=>h.view(e)));
   const receipts=await Promise.all(eight.sockets.map((c,i)=>c.send(action('inject',{attemptId:current,specimenId:views[i].controller.tray[0].specimenId}))));assert.ok(receipts.every(r=>r.kind==='action-accepted'));
  }
  const before=await h.record(eight.id);assert.equal(before.experiment.history.length,48);assert.ok(before.seats.every(s=>s.remainingDoses===0&&!s.switchPulled));
  await fixtureBattle(eight.id,eHost);const finished=await expire(eight.id,eHost);assert.equal(finished.snapshot.session.completed.length,round);assert.equal(finished.snapshot.result.contributions.length,8);
  for(const e of eight.entries.slice(1))assert.deepEqual((await h.view(e)).snapshot.result,finished.snapshot.result);
  if(round<3)assert.equal((await eight.sockets[0].send(action('advance-private-round',{battleId:finished.snapshot.result.battleId}))).kind,'action-accepted');
 }
 assert.equal((await h.view(eHost)).snapshot.phase,'session-results');pass('eight independent socket clients spend all 48 doses per round and complete three rounds with identical results and fresh budgets');
 console.log(`All ${passed} combat runtime scenarios passed. Only later-round deadlines were advanced in isolated SQLite fixtures; the first battle used actual alarms. No deployment.`);
}finally{await h.close();}
