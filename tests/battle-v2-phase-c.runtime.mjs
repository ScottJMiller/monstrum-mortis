import assert from 'node:assert/strict';
import {runtime,action,uid,sleep,wait} from './support/combat-runtime.mjs';
const h=await runtime();let passes=0;const pass=s=>console.log(`PASS ${++passes}: ${s}`);
async function start(lab){await lab.sockets[0].send(action('start-private-session'));await h.record(lab.id,r=>{r.phaseDeadlineMs=Date.now()-1;});return h.view(lab.entries[0]);}
try{
 for(const count of [2,4,8]){
  const lab=await h.laboratory(count);await start(lab);const before=await Promise.all(lab.entries.map(e=>h.view(e))),attemptId=before[0].snapshot.attemptId;
  await h.record(lab.id,r=>{for(const [i,s] of r.seats.entries())s.tray[0].dnaId=count===4&&i===0?'guillotine-teeth':'razor-talons';});
  const injections=await Promise.all(lab.sockets.map((c,i)=>c.send(action('inject',{attemptId,specimenId:before[i].controller.tray[0].specimenId}))));assert.ok(injections.every(x=>x.kind==='action-accepted'));
  await h.record(lab.id,r=>{for(const s of r.seats)s.nextInjectionAtMs=0;});
  const switches=lab.sockets.map(()=>action('pull-switch',{attemptId}));await Promise.all(lab.sockets.map((c,i)=>c.send(switches[i])));
  const views=await Promise.all(lab.entries.map(e=>h.view(e))),stored=await h.record(lab.id),chosen=stored.battlePresentation;
  if(count===4){assert.ok([1,'blob'].includes(chosen.form.family));assert.equal(chosen.form.votes[1],1);}else assert.equal(chosen.form.family,'blob');assert.equal(chosen.form.votes.blob,1);assert.equal(stored.experiment.frozen.playerCount,count);
  assert.ok(views.every(v=>v.snapshot.phase==='release'));for(const v of views){assert.deepEqual(v.snapshot.battlePresentation,views[0].snapshot.battlePresentation);assert.equal('votes' in v.snapshot.battlePresentation.form,false);assert.equal(JSON.stringify(v.snapshot).includes('reconnectToken'),false);}
  await lab.sockets[0].send(switches[0]);await h.evict(lab.id);assert.deepEqual((await h.record(lab.id)).battlePresentation,chosen);
  const battle=await wait(()=>h.view(lab.entries[0]),v=>v.snapshot.phase==='battle',7000);assert.equal(battle.snapshot.battle.startsAtMs,chosen.form.integration.endsAtMs);assert.deepEqual((await h.record(lab.id)).battlePresentation,chosen);
  const late=await h.api(`/api/rooms/${lab.id}/join`,{operationId:uid(),alias:'Legacy display',role:'display'}),display=await h.socket(late);assert.equal((await h.view(late)).controller,null);assert.deepEqual((await h.view(late)).snapshot.battlePresentation,views[0].snapshot.battlePresentation);assert.equal((await display.send(action('pull-switch',{attemptId}))).code,'unauthorized');
  await h.restart();assert.deepEqual((await h.view(lab.entries[0])).snapshot.battlePresentation,views[0].snapshot.battlePresentation);assert.deepEqual((await h.record(lab.id)).battlePresentation,chosen);
  pass(`${count} independent clients: concurrent injections/switches, deduplicated/tied votes, atomic form/arena, replay/eviction/full restart, late viewing-only display`);
 }
 const legacy=await h.laboratory();await start(legacy);await h.record(legacy.id,r=>{r.schemaVersion=5;delete r.presentationVersion;delete r.battlePresentation;});
 const original=await h.record(legacy.id),old=await h.view(legacy.entries[0]);assert.equal(old.snapshot.battlePresentation,null);assert.deepEqual((await h.record(legacy.id)).seats,original.seats);
 await h.record(legacy.id,r=>{r.phaseDeadlineMs=Date.now()-1;});assert.equal((await h.view(legacy.entries[0])).snapshot.battlePresentation,null);pass('schema-5 active attempt upgrades without retroactive form or hand/credential migration');
 for(const region of ['europe-africa','asia-pacific']){
  const guest=await h.api('/api/guests',{operationId:uid()});const denied=await h.api(`/api/queue/${region}/enter`,{operationId:uid(),mode:'fresh-session'},undefined,400,guest);assert.equal(denied.code,'invalid-action');
  // Seed an existing pre-rollout ticket and real guest lease, then use real owner APIs.
  const bindings=await h.mf.getBindings(),authority=bindings.GUEST_LEASES.get(bindings.GUEST_LEASES.idFromName(`guest:${guest.guestId}`)),ticketId=uid();
  assert.equal(await authority.acquireQueue(ticketId,region),true);
  const sql=await h.mf.unsafeGetDurableObjectStorage('monstrum-mortis','MatchmakingPool',{name:`pool:${region}`});
  const now=Date.now(),ticket={id:ticketId,guestId:guest.guestId,alias:guest.alias,mode:'fresh-session',enteredAtMs:now,lastSeenAtMs:now,leaseRenewAtMs:now+45000,state:'inactive',checkId:null,ready:false,admission:null};
  const rows=await sql.exec('SELECT record FROM pool_state');const {newPool}=await import('../src/server/queue-model.ts');const state=rows.length?JSON.parse(rows[0].record):newPool();
  state.tickets.push(ticket);await sql.exec('INSERT OR REPLACE INTO pool_state(singleton,region,record) VALUES(1,?,?)',region,JSON.stringify(state));
  const retry=await h.api(`/api/queue/${region}/enter`,{operationId:ticketId,mode:'fresh-session'},undefined,200,guest);assert.equal(retry.ticketId,ticketId);assert.equal(retry.region,region);
  await h.api(`/api/queue/${region}/resume`,{ticketId},undefined,200,guest);await h.api(`/api/queue/${region}/cancel`,{ticketId},undefined,200,guest);
  pass(`${region}: new entries refused; existing owner ticket retry/resume/cancel preserves its pool`);
 }
 console.log(`Completed ${passes} Phase C persistence/admission scenarios; isolated local SQLite/independent clients, no deployment.`);
}finally{await h.close();}
