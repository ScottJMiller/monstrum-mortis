import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { DNA_CATALOGUE } from '../src/server/catalogue/dna.ts';
import { PROTOCOL_VERSION } from '../src/shared/protocol.ts';

const persistence = await mkdtemp(join(tmpdir(), 'mm-dna-runtime-'));
const options = { name: 'monstrum-mortis', modules: true, scriptPath: resolve('dist/worker/worker.js'), compatibilityDate: '2026-10-05', resourcePersistencePath: persistence, unsafeInspectDurableObjects: true,
 durableObjects: Object.fromEntries(['LaboratoryRoom','MatchmakingPool','GuestLease'].map((className,i) => [['ROOMS','MATCHMAKING','GUEST_LEASES'][i], {className,useSQLite:true}])), serviceBindings: {ASSETS:async()=>new Response('asset')} };
let mf = new Miniflare(convertV4MiniflareOptions(options)); let origin; const clients=[]; const uid=()=>crypto.randomUUID();
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); let requests=0;
async function wait(fn,predicate,timeout=12000) { const end=Date.now()+timeout; while(Date.now()<end){const v=await fn();if(predicate(v))return v;await sleep(25);}throw new Error('DNA runtime wait timed out'); }
async function api(path,value,credentials,expected=200) { const response=await fetch(new URL(path,origin),{method:value===undefined?'GET':'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':`198.51.100.${++requests%250}`,...(credentials?{Authorization:`Bearer ${credentials.reconnectToken}`}:{})},...(value===undefined?{}:{body:JSON.stringify(value)})});const data=await response.json();assert.equal(response.status,expected,JSON.stringify(data));return data; }
async function view(e) { return api(`/api/rooms/${e.credentials.roomId}/snapshot`,undefined,e.credentials); }
async function socket(e) {
 const url=new URL(`/api/rooms/${e.credentials.roomId}/socket`,origin);url.protocol='ws:';
 const ws=new WebSocket(url,['mm-v5',`token.${e.credentials.reconnectToken}`]);const messages=[];
 ws.addEventListener('message',event=>{if(event.data!=='pong')messages.push(JSON.parse(event.data));});
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 const timer=setInterval(()=>{if(ws.readyState===WebSocket.OPEN)ws.send('ping');},10000);
 const c={ws,messages,close(){clearInterval(timer);ws.close();},async send(action){const after=messages.length;ws.send(JSON.stringify(action));return wait(async()=>messages.slice(after).find(m=>m.actionId===action.actionId && ['action-accepted','action-rejected'].includes(m.kind)),Boolean);}};
 clients.push(c);return c;
}
function action(kind,extra={}){return{protocolVersion:PROTOCOL_VERSION,actionId:uid(),kind,...extra};}
async function storage(roomId) { const bindings=await mf.getBindings();const stub=bindings.ROOMS.get(bindings.ROOMS.idFromName(`room:${roomId}`));return {stub,sql:await mf.unsafeGetDurableObjectStorage('monstrum-mortis','LaboratoryRoom',{id:stub.id.toString()})}; }
async function record(roomId) { const {sql}=await storage(roomId);return JSON.parse((await sql.exec('SELECT record FROM room_state'))[0].record); }
async function edit(roomId,fn) { const {sql}=await storage(roomId);const r=JSON.parse((await sql.exec('SELECT record FROM room_state'))[0].record);fn(r);await sql.exec('UPDATE room_state SET record = ?',JSON.stringify(r));return r; }
async function laboratory(n=2,realBriefing=false) {
 const host=await api('/api/rooms/private',{operationId:uid(),alias:'Host',presentation:'remote'},undefined,201);const entries=[host];const sockets=[await socket(host)];
 for(let i=1;i<n;i++){const e=await api(`/api/rooms/${host.credentials.roomId}/join`,{operationId:uid(),alias:`Scientist ${i}`,role:'player'});entries.push(e);sockets.push(await socket(e));}
 assert.equal((await sockets[0].send(action('start-private-session'))).kind,'action-accepted');
 if(!realBriefing)await edit(host.credentials.roomId,r=>{r.phaseDeadlineMs=Date.now()-1;});
 await wait(()=>view(host),v=>v.snapshot.phase==='experiment');return {entries,sockets,id:host.credentials.roomId};
}
let passed=0;const pass=text=>console.log(`PASS ${++passed}: ${text}`);
try {
 origin=await mf.ready;
 const {entries,sockets,id}=await laboratory(2,true);let [one,two]=sockets;
 const display=await api(`/api/rooms/${id}/join`,{operationId:uid(),alias:'Display',role:'display'});const screen=await socket(display);
 const first=await view(entries[0]);const second=await view(entries[1]);const attemptId=first.snapshot.attemptId;
 assert.equal(first.controller.tray.length,4);assert.equal(first.controller.remainingDoses,6);assert.notDeepEqual(first.controller.tray.map(s=>s.specimenId),second.controller.tray.map(s=>s.specimenId));
 assert.equal((await view(display)).controller,null);assert.ok(screen.messages.every(m=>m.kind!=='controller-snapshot'));
 for(const data of [first.snapshot,first.controller]) for(const hidden of ['dnaId','drawPlan','deltas','abilities','secret','tokenHash'])assert.ok(!JSON.stringify(data).includes(hidden));
 assert.equal((await one.send(action('pull-switch',{attemptId}))).code,'switch-locked');
 assert.equal((await one.send(action('inject',{attemptId,specimenId:second.controller.tray[0].specimenId}))).code,'invalid-action');
 assert.equal((await screen.send(action('inject',{attemptId,specimenId:first.controller.tray[0].specimenId}))).code,'unauthorized');
 pass('real briefing initializes owner-only trays; display, specimen ownership and minimum switch rules are enforced');
 const injection=action('inject',{attemptId,specimenId:first.controller.tray[0].specimenId});
 const both=await Promise.all([one.send(injection),two.send(action('inject',{attemptId,specimenId:second.controller.tray[0].specimenId}))]);assert.ok(both.every(m=>m.kind==='action-accepted'));
 let after=await view(entries[0]);assert.equal(after.snapshot.mutations.length,2);assert.equal(after.controller.remainingDoses,5);
 assert.deepEqual(after.snapshot.creature,(await view(entries[1])).snapshot.creature);
 assert.deepEqual(after.snapshot.creature,(await view(display)).snapshot.creature);
 assert.equal((await one.send(injection)).kind,'action-accepted');assert.equal((await view(entries[0])).controller.remainingDoses,5);
 assert.equal((await one.send({...injection,specimenId:second.controller.tray[1].specimenId})).code,'idempotency-conflict');
 const cooldownReject=action('inject',{attemptId,specimenId:after.controller.tray[0].specimenId});assert.equal((await one.send(cooldownReject)).code,'cooldown');
 assert.equal((await one.send(action('pull-switch',{attemptId}))).code,'cooldown');
 const waitMs=Math.max(0,after.controller.nextInjectionAtMs-Date.now()+30);await sleep(waitMs);
 assert.equal((await one.send(cooldownReject)).code,'cooldown','a rejected receipt does not become accepted when time advances');
 const concurrent=await Promise.all([one.send(action('inject',{attemptId,specimenId:after.controller.tray[0].specimenId})),one.send(action('inject',{attemptId,specimenId:after.controller.tray[1].specimenId}))]);
 assert.equal(concurrent.filter(m=>m.kind==='action-accepted').length,1);assert.equal(concurrent.filter(m=>m.code==='cooldown').length,1);
 pass('independent/concurrent injections synchronize once; duplicate, conflicting, rejected replay and real six-second cooldown behavior pass');
 const persisted=await view(entries[0]);const stored=await record(id);const {stub}=await storage(id);
 await mf.unsafeEvictDurableObject('monstrum-mortis','LaboratoryRoom',{id:stub.id.toString(),webSockets:'hibernate'});
 assert.deepEqual((await view(entries[0])).controller.tray,persisted.controller.tray);assert.equal((await one.send(injection)).kind,'action-accepted');
 for(const c of clients)c.close();await sleep(150);await mf.dispose();mf=new Miniflare(convertV4MiniflareOptions(options));origin=await mf.ready;
 one=await socket(entries[0]);two=await socket(entries[1]);
 const restored=await view(entries[0]);assert.deepEqual(restored.controller.tray,persisted.controller.tray);assert.equal(restored.controller.remainingDoses,persisted.controller.remainingDoses);assert.equal(restored.controller.nextInjectionAtMs,persisted.controller.nextInjectionAtMs);
 assert.deepEqual((await record(id)).seats[0].drawPlan,stored.seats[0].drawPlan);assert.equal((await one.send(injection)).kind,'action-accepted');
 pass('hibernating reactivation and full SQLite runtime restart preserve trays, hidden draw packets, cooldowns, budgets and receipts');
 // Test-only cooldown timestamps allow spending the rest without changing production rules.
 for(let i=restored.controller.remainingDoses;i>0;i--){await edit(id,r=>{r.seats[0].nextInjectionAtMs=Date.now()-1;});const v=await view(entries[0]);assert.equal((await one.send(action('inject',{attemptId,specimenId:v.controller.tray[0].specimenId}))).kind,'action-accepted');}
 let spent=await view(entries[0]);assert.equal(spent.controller.remainingDoses,0);assert.equal(spent.controller.switchPulled,false);assert.equal(spent.snapshot.phase,'experiment');
 await edit(id,r=>{r.seats[0].nextInjectionAtMs=Date.now()-1;});
 assert.equal((await one.send(action('inject',{attemptId,specimenId:spent.controller.tray[0].specimenId}))).code,'no-doses');
 assert.equal((await one.send(action('pull-switch',{attemptId}))).kind,'action-accepted');assert.equal((await view(entries[0])).snapshot.phase,'experiment');
 const lastSwitch=action('pull-switch',{attemptId});assert.equal((await two.send(lastSwitch)).kind,'action-accepted');
 const frozen=(await record(id)).experiment.frozen;assert.equal(frozen.history.length,7);assert.equal(frozen.reason,'unanimous');
 const release=await view(entries[1]);assert.equal(release.snapshot.phaseDeadlineMs-frozen.releasedAtMs,5000);
 assert.equal((await two.send(lastSwitch)).kind,'action-accepted');assert.deepEqual((await record(id)).experiment.frozen,frozen);
 assert.equal((await two.send(action('inject',{attemptId,specimenId:spent.controller.tray[0].specimenId}))).code,'wrong-phase');
 await wait(()=>view(entries[1]),v=>v.snapshot.phase==='battle',7000);assert.deepEqual((await record(id)).experiment.frozen,frozen);assert.equal((await view(entries[1])).snapshot.teamScore,0);
 pass('six doses do not auto-switch; dose forfeiture, duplicate final switch, one real five-second release and immutable released-creature boundary pass');
 const types=await laboratory(2);let lastSequence=0;
 for(const definition of DNA_CATALOGUE){if(lastSequence===15)await sleep(10010);await edit(types.id,r=>{const s=r.seats[0];s.remainingDoses=6;s.drawCursor=0;s.nextInjectionAtMs=0;s.tray[0].dnaId=definition.id;});const v=await view(types.entries[0]);const result=await types.sockets[0].send(action('inject',{attemptId:v.snapshot.attemptId,specimenId:v.controller.tray[0].specimenId}));assert.equal(result.kind,'action-accepted');const changed=await view(types.entries[1]);assert.equal(changed.snapshot.mutations.at(-1).name,definition.autopsyName);assert.equal(changed.snapshot.mutations.length,++lastSequence);assert.ok(changed.snapshot.creature.parts.some(p=>p.assetId===`mutation.${definition.id}`));}
 assert.equal((await record(types.id)).experiment.history.length,30);
 pass('all 30 hidden DNA types pass through the real injection handler and synchronize named anatomy/history to an independent client');
 for(let n=2;n<=8;n++){const lab=await laboratory(n);const v=await view(lab.entries[0]);assert.equal(v.snapshot.playerCountAtExperimentStart,n);await edit(lab.id,r=>{r.seats[0].tray[0].dnaId='venom-glands';});assert.equal((await lab.sockets[0].send(action('inject',{attemptId:v.snapshot.attemptId,specimenId:v.controller.tray[0].specimenId}))).kind,'action-accepted');const r=await record(lab.id);const units=r.experiment.active.mouth.contributions[0].units;assert.equal(units,2/n);assert.equal(r.seats[0].remainingDoses,5);for(let i=1;i<n;i++)assert.deepEqual((await view(lab.entries[i])).snapshot.creature,(await view(lab.entries[0])).snapshot.creature);}
 pass('2–8 actual independent client cohorts lock N and receive identical normalized accepted anatomy');
 const legacy=await laboratory(2);const original=await record(legacy.id);
 for(const schemaVersion of [2,3]){await edit(legacy.id,r=>{r.schemaVersion=schemaVersion;delete r.experiment;});const migrated=await view(legacy.entries[0]);assert.equal(migrated.snapshot.mechanicsAvailable,false);assert.equal(migrated.controller.tray.length,0);assert.equal(migrated.snapshot.phaseDeadlineMs,original.phaseDeadlineMs);assert.equal((await record(legacy.id)).schemaVersion,5);}
 const bad=await record(legacy.id);await edit(legacy.id,r=>{r.schemaVersion=99;});await api(`/api/rooms/${legacy.id}/snapshot`,undefined,legacy.entries[0].credentials,503);await edit(legacy.id,r=>Object.assign(r,bad));
 pass('real schema-2/3 migrations preserve credentials and active deadlines without retroactive doses; unknown schemas fail closed');
 const pending=await view(types.entries[0]);const priorAttempt=pending.snapshot.attemptId;
 await edit(types.id,r=>{r.phaseDeadlineMs=Date.now()-1;});const deadlineAction=action('inject',{attemptId:priorAttempt,specimenId:pending.controller.tray[0].specimenId});assert.equal((await types.sockets[0].send(deadlineAction)).code,'deadline-passed');assert.equal((await view(types.entries[0])).snapshot.phase,'release');
 assert.equal((await types.sockets[0].send({...action('inject',{attemptId:uid(),specimenId:pending.controller.tray[0].specimenId})})).code,'stale-session');
 const url=new URL(`/api/rooms/${types.id}/socket`,origin);const old=await mf.dispatchFetch(url,{headers:{Upgrade:'websocket','Sec-WebSocket-Protocol':`mm-v3, token.${types.entries[0].credentials.reconnectToken}`}});assert.equal(old.status,426);
 pass('expired deadlines and stale attempt IDs reject new injections; old protocol requires reload without discarding credentials');
 let limited;
 for(let i=0;i<35;i++){const intent=action('pull-switch',{attemptId:priorAttempt});limited=await types.sockets[0].send(intent);assert.equal(limited.actionId,intent.actionId);}
 assert.equal(limited.code,'rate-limited');pass('rate-limited valid intentions retain their action ID so pending controllers can recover');
 console.log(`All ${passed} DNA runtime scenarios passed. Fixtures only seed isolated test storage; no deployment; browser rendering is verified separately.`);
} finally {for(const c of clients)c.close();await mf.dispose();await rm(persistence,{recursive:true,force:true});}
