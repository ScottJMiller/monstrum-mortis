import test from 'node:test';
import assert from 'node:assert/strict';
import { newRoom,connect,startRound,settle,snapshot } from '../src/server/room-model.ts';
import type {Seat} from '../src/server/room-model.ts';
import { applyMutation,beginRelease } from '../src/server/dna-mechanics.ts';
import { migrateRoom } from '../src/server/room-storage.ts';
import { validBattlePresentation } from '../src/server/integrated-form.ts';
const uid=()=>crypto.randomUUID();
function room(){const r=newRoom('ABCDEF','private','remote','secret',uid(),'',0);for(let i=0;i<2;i++){const s:Seat={id:uid(),guestId:null,alias:'Scientist',symbol:'*',role:'player',operationHash:uid(),entryFingerprint:'',tokenHash:'hidden',joinedAtMs:0,connectedAtMs:null,connected:false,disconnectDeadlineMs:null,eligible:true,finished:false,departed:false,remainingDoses:0,nextInjectionAtMs:0};r.seats.push(s);connect(r,s,0);}startRound(r,0);settle(r,8000);return r;}
test('release stores one immutable form/arena from survivors; snapshots omit private votes and retain authoritative freeze',()=>{
 const r=room();for(const id of ['razor-talons','counterweight-tail','guillotine-teeth'])applyMutation(r.experiment!,id,r.seats[0]!.id,'Scientist',uid(),8000,2);
 settle(r,83000);const selected=structuredClone(r.battlePresentation),frozen=structuredClone(r.experiment!.frozen);
 assert.equal(selected!.form.family,'blob');assert.equal(selected!.form.votes.blob,2);assert.equal(selected!.form.votes[1],1);
 const view=snapshot(r,83000);assert.equal('votes' in view.battlePresentation!.form,false);assert.equal(JSON.stringify(view).includes('hidden'),false);
 beginRelease(r,84000,'unanimous');assert.deepEqual(r.battlePresentation,selected);settle(r,88000);assert.deepEqual(r.battlePresentation,selected);assert.deepEqual(r.experiment!.frozen,frozen);
 assert.deepEqual(migrateRoom(structuredClone(r)),r);assert.equal(validBattlePresentation(selected,frozen!),true);
});
test('schema-5 active attempts preserve credentials, hand, freeze/timeline and no presentation retrofit; next attempts opt in',()=>{
 for(const phase of ['experiment','release','battle'] as const){
  const r=room();if(phase!=='experiment')settle(r,phase==='release'?83000:88000);
  const raw=structuredClone(r) as unknown as Record<string,unknown>;raw.schemaVersion=5;delete raw.presentationVersion;delete raw.battlePresentation;
  const prior=structuredClone(raw),m=migrateRoom(raw);
  assert.equal(m.schemaVersion,6);assert.equal(m.presentationVersion,null);assert.equal(m.battlePresentation,null);assert.equal(snapshot(m,8000).battlePresentationVersion,null);
  assert.deepEqual(m.seats,prior.seats);assert.deepEqual(m.experiment,prior.experiment);assert.deepEqual(m.combat,prior.combat);
  if(phase==='experiment'){settle(m,83000);assert.equal(m.battlePresentation,null);}
  m.phase='lobby';startRound(m,90000);assert.equal(m.presentationVersion,'battle-v2-b2');assert.equal(m.battlePresentation,null);assert.equal(m.experiment!.history.length,0);
 }
});
test('stored selection corruption fails closed without rerolling; tied choices validate without entropy',()=>{
 const r=room();for(const id of ['razor-talons','guillotine-teeth'])applyMutation(r.experiment!,id,r.seats[0]!.id,'Scientist',uid(),8000,2);settle(r,83000);
 for(const family of [1,'blob'] as const){const copy=structuredClone(r);copy.battlePresentation!.form.family=family;assert.doesNotThrow(()=>migrateRoom(copy));}
 for(const mutate of [(p:typeof r)=>{p.battlePresentation!.arena='invalid' as never;},(p:typeof r)=>{p.battlePresentation!.form.family=3;},(p:typeof r)=>{p.battlePresentation!.form.modifiers.scale=1.1;},(p:typeof r)=>{p.battlePresentation!.form.integration.endsAtMs++;},(p:typeof r)=>{p.battlePresentation!.form.votes.blob++;},(p:typeof r)=>{p.battlePresentation=null;}]){const copy=structuredClone(r);mutate(copy);assert.throws(()=>migrateRoom(copy),/presentation/);}
});
