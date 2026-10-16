import assert from 'node:assert/strict';
import {runtime,uid,action,sleep} from './support/combat-runtime.mjs';
import {DNA_CATALOGUE} from '../src/server/catalogue/dna.ts';
const h=await runtime();let passes=0;const pass=s=>console.log(`PASS ${++passes}: ${s}`);
try{
 const lab=await h.formingLaboratory(),v=await h.view(lab.entries[0]),attemptId=v.snapshot.attemptId;
 const shot=action('inject',{attemptId,specimenId:v.controller.tray[0].specimenId});assert.equal((await lab.sockets[0].send(shot)).kind,'action-accepted');assert.equal((await lab.sockets[0].send(shot)).kind,'action-accepted');assert.equal((await h.view(lab.entries[0])).controller.remainingDoses,5);
 assert.equal((await lab.sockets[0].send({...shot,specimenId:v.controller.tray[1].specimenId})).code,'idempotency-conflict');
 const early=action('inject',{attemptId,specimenId:v.controller.tray[1].specimenId});assert.equal((await lab.sockets[0].send(early)).code,'cooldown');await sleep(6050);assert.equal((await lab.sockets[0].send(early)).code,'cooldown');assert.equal((await lab.sockets[0].send({...early,actionId:uid()})).kind,'action-accepted');pass('real six-second cooldown and immutable rejected/accepted receipts across retry');
 const types=await h.formingLaboratory();for(const [i,d]of DNA_CATALOGUE.entries()){
   const player=i<15?0:1;await h.record(types.id,r=>{const s=r.seats[player];s.remainingDoses=6;s.drawCursor=0;s.nextInjectionAtMs=0;s.tray[0].dnaId=d.id;});await h.evict(types.id);const own=await h.view(types.entries[player]);assert.equal((await types.sockets[player].send(action('inject',{attemptId:own.snapshot.attemptId,specimenId:own.controller.tray[0].specimenId}))).kind,'action-accepted');
   const peer=await h.view(types.entries[1-player]);assert.equal(peer.snapshot.mutations.at(-1).name,d.autopsyName);assert.equal(peer.snapshot.mutations.length,i+1);assert.ok(peer.snapshot.creature.parts.some(p=>p.assetId===`mutation.${d.id}`));assert.deepEqual(peer.snapshot.creature,(await h.view(types.entries[player])).snapshot.creature);
 }pass('all 30 real DNA handlers synchronize named anatomy and ordered history to an independent client');
 for(let n=2;n<=8;n++){
   const x=await h.formingLaboratory(n);await h.record(x.id,r=>{r.seats[0].tray[0].dnaId='venom-glands';});await h.evict(x.id);const own=await h.view(x.entries[0]);assert.equal(own.snapshot.playerCountAtExperimentStart,n);assert.equal((await x.sockets[0].send(action('inject',{attemptId:own.snapshot.attemptId,specimenId:own.controller.tray[0].specimenId}))).kind,'action-accepted');const stored=await h.record(x.id);assert.equal(stored.experiment.active.mouth.contributions[0].units,2/n);for(let i=1;i<n;i++)assert.deepEqual((await h.view(x.entries[i])).snapshot.creature,(await h.view(x.entries[0])).snapshot.creature);
 }pass('2–8 independent clients retain 2/N scaling, private six-dose budgets and identical accepted state');
 const deadline=await h.formingLaboratory();let own=await h.view(deadline.entries[0]);await h.record(deadline.id,r=>{r.phaseDeadlineMs=Date.now()-1;});assert.equal((await deadline.sockets[0].send(action('inject',{attemptId:own.snapshot.attemptId,specimenId:own.controller.tray[0].specimenId}))).code,'deadline-passed');const frozen=JSON.stringify((await h.record(deadline.id)).experiment.frozen);await h.evict(deadline.id);own=await h.view(deadline.entries[0]);assert.equal(own.snapshot.phase,'release');assert.equal(JSON.stringify((await h.record(deadline.id)).experiment.frozen),frozen);pass('deadline boundary rejects further doses and freezes exactly one creature across reactivation');
 console.log(`Completed ${passes} DNA runtime regression groups on the current public-only contract. Specimen/cooldown fixture editing is development-only.`);
}finally{await h.close();}
