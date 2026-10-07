import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
const persistence = await mkdtemp(join(tmpdir(), 'mm-queue-runtime-'));
const options = { name: 'monstrum-mortis', modules: true, scriptPath: resolve('dist/worker/worker.js'), compatibilityDate: '2026-10-05', resourcePersistencePath: persistence, unsafeInspectDurableObjects: true,
 durableObjects: Object.fromEntries(['LaboratoryRoom','MatchmakingPool','GuestLease'].map((className,i) => [['ROOMS','MATCHMAKING','GUEST_LEASES'][i], { className, useSQLite: true }])), serviceBindings: { ASSETS: async () => new Response('asset') } };
let mf = new Miniflare(convertV4MiniflareOptions(options)); let origin; let bindings; const clients = [];
const uid = () => crypto.randomUUID(); const sleep = ms => new Promise(r => setTimeout(r, ms));
let requests = 0;
async function api(path, value, guest, expected = 200, seat = null) {
 const response = await fetch(new URL(path, origin), { method: value ? 'POST' : 'GET', headers: { 'Content-Type':'application/json', 'CF-Connecting-IP': `198.51.100.${++requests % 250}`, ...(guest ? { 'X-Guest-Id': guest.guestId, 'X-Guest-Token':guest.accessToken, Authorization:`Bearer ${guest.accessToken}` } : {}), ...(seat ? { Authorization:`Bearer ${seat.reconnectToken}` } : {}) }, ...(value ? { body:JSON.stringify(value) } : {}) });
 const data = await response.json(); assert.equal(response.status, expected, JSON.stringify(data)); return data;
}
async function createGuest() { return api('/api/guests',{operationId:uid()}); }
async function enter(g, region='americas', mode='fresh-session', id=uid()) { const status = await api(`/api/queue/${region}/enter`, { operationId:id, mode },g); return {g,id,region,status}; }
async function status(t) { return api(`/api/queue/${t.region}/status?ticketId=${t.id}`,null,t.g); }
async function ready(t) { const s = await status(t); return api(`/api/queue/${t.region}/ready`, {ticketId:t.id,readyCheckId:s.readyCheckId},t.g); }
async function wait(fn, predicate, timeout=15000) { const end=Date.now()+timeout; while(Date.now()<end) { const value=await fn(); if(predicate(value)) return value; await sleep(500); } throw new Error('Runtime wait timed out'); }
async function socket(path, protocols) {
 const url=new URL(path,origin); url.protocol='ws:'; const ws=new WebSocket(url, protocols); const messages=[];
 ws.addEventListener('message',e=>{ if(e.data!=='pong') messages.push(JSON.parse(e.data)); });
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 const timer=setInterval(()=>{if(ws.readyState===WebSocket.OPEN) ws.send('ping');},10000);
 const c={ws,messages,close(){clearInterval(timer);ws.close();},async send(kind) {const actionId=uid();ws.send(JSON.stringify({protocolVersion:4,actionId,kind}));return wait(async()=>messages.find(m=>m.actionId===actionId),Boolean,5000);}};
 clients.push(c); return c;
}
async function roomSocket(entry) { return socket(`/api/rooms/${entry.credentials.roomId}/socket`,['mm-v4',`token.${entry.credentials.reconnectToken}`]); }
async function snap(e) {return (await api(`/api/rooms/${e.credentials.roomId}/snapshot`,null,null,200,e.credentials)).snapshot;}
async function inspect(className, id) {return mf.unsafeGetDurableObjectStorage('monstrum-mortis', className, {id});}
async function editRoom(roomId, edit) {
 const stub=bindings.ROOMS.get(bindings.ROOMS.idFromName(`room:${roomId}`)); const storage=await inspect('LaboratoryRoom',stub.id.toString());
 const rows=await storage.exec('SELECT record FROM room_state'); const r=JSON.parse(rows[0].record); edit(r); await storage.exec('UPDATE room_state SET record = ?',JSON.stringify(r)); return stub;
}
let passed=0;function checked(s){console.log(`PASS ${++passed}: ${s}`);}
try {
 origin=await mf.ready; bindings=await mf.getBindings();
 const issuance=uid(); const g=await api('/api/guests',{operationId:issuance}); assert.deepEqual(await api('/api/guests',{operationId:issuance}),g);
 assert.match(g.alias,/^[A-Z][a-z]+ [A-Z][a-z]+$/); assert.ok(!JSON.stringify(g).includes('secret'));
 await api('/api/queue/americas/enter',{operationId:uid(),mode:'fresh-session'},null,400);
 await api('/api/queue/americas/enter',{operationId:uid(),mode:'fresh-session'},{...g,accessToken:'x'.repeat(43)},401);
 const first=await enter(g); assert.equal(first.status.state,'waiting');
 const raced=await Promise.all(['europe-africa','asia-pacific'].map(region=>api(`/api/queue/${region}/enter`,{operationId:uid(),mode:'fresh-session'},g,409)));
 assert.ok(raced.every(r=>r.code==='guest-busy'));
 const replay=await api('/api/queue/americas/enter',{operationId:first.id,mode:'fresh-session'},g); assert.equal(replay.enteredAtMs,first.status.enteredAtMs);
 await api('/api/rooms/private',{operationId:uid(),alias:'Guest',presentation:'remote'},g,409);
 await api('/api/queue/americas/enter',{operationId:first.id,mode:'fill-existing-laboratory'},g,409);
 const qsocket=await socket(`/api/queue/americas/socket?ticketId=${first.id}`,['mm-queue-v4',`guest.${g.guestId}`,`token.${g.accessToken}`]);
 checked('guest issuance replay, authored identity, authorization, duplicate ticket and cross-pool/private-seat exclusion');
 const group=[first];for(let i=0;i<3;i++) group.push(await enter(await createGuest()));
 const check=await status(first);assert.equal(check.state,'ready-check');assert.equal(check.readyDeadlineMs-check.serverTimeMs<=10000,true);
 for(let i=0;i<2;i++) group.push(await enter(await createGuest()));
 assert.equal((await status(group[5])).readyCheckId,check.readyCheckId);
 await ready(first);await ready(group[1]);await ready(group[4]);
 await api('/api/queue/americas/cancel',{ticketId:group[3].id},group[3].g);
 const pool=bindings.MATCHMAKING.get(bindings.MATCHMAKING.idFromName('pool:americas'));
 await mf.unsafeEvictDurableObject('monstrum-mortis','MatchmakingPool',{id:pool.id.toString(),webSockets:'hibernate'});
 const matched=await wait(()=>status(first),s=>s.state==='matched');
 assert.equal((await status(group[2])).state,'inactive');assert.equal((await status(group[5])).state,'inactive');
 assert.equal((await status(group[3])).state,'cancelled');
 await api('/api/queue/americas/ready',{ticketId:first.id,readyCheckId:check.readyCheckId},first.g);
 await api('/api/queue/americas/ready',{ticketId:first.id,readyCheckId:uid()},first.g,409);
 const qstatus=await wait(async()=>qsocket.messages.find(m=>m.status?.state==='matched'),Boolean,5000);
 assert.equal(qstatus.status.admission.roomId,matched.admission.roomId);
 const others=await Promise.all([status(group[1]),status(group[4])]); assert.ok(others.every(s=>s.admission.roomId===matched.admission.roomId));
 assert.ok(!JSON.stringify(qstatus).includes(group[1].g.guestId));assert.ok(!JSON.stringify(qstatus).includes(group[1].g.accessToken));
 // Simulate a coordinator crash after room/lease commits but before the final journal commit.
 const poolStorage=await inspect('MatchmakingPool',pool.id.toString());const row=(await poolStorage.exec('SELECT record FROM pool_state'))[0];const journal=JSON.parse(row.record);
 const allocation=journal.allocations.find(a=>a.roomId===matched.admission.roomId);allocation.done=false;
 for(const member of allocation.members){const t=journal.tickets.find(t=>t.id===member.ticketId);t.state='allocating';t.admission=null;}
 await poolStorage.exec('UPDATE pool_state SET record = ?',JSON.stringify(journal));
 await mf.unsafeEvictDurableObject('monstrum-mortis','MatchmakingPool',{id:pool.id.toString(),webSockets:'hibernate'});
 const retried=await status(first);assert.equal(retried.state,'matched');assert.deepEqual(retried.admission,matched.admission);
 checked('real ten-second ready alarm, six-player fill, cancellation, inactive guests and hibernating owner-only queue socket');
 const entries=[];for(const s of [matched,...others]) entries.push(await api(`/api/rooms/${s.admission.roomId}/admit`,{operationId:uid(),reservationId:s.admission.reservationId,admissionToken:s.admission.admissionToken}));
 await api('/api/queue/americas/cancel',{ticketId:group[4].id},group[4].g); // consumed admission cancelled before connecting
 await api(`/api/rooms/${matched.admission.roomId}/snapshot`,null,null,401,entries[2].credentials);
 const c1=await roomSocket(entries[0]);const c2=await roomSocket(entries[1]);
 const briefing=await snap(entries[0]); assert.equal(briefing.hostPlayerId,null);assert.equal(briefing.phase,'briefing');assert.equal(briefing.players.length,2);
 await api('/api/queue/americas/cancel',{ticketId:first.id},first.g,409);
 await api(`/api/rooms/${matched.admission.roomId}/join`,{operationId:uid(),alias:'Intruder',role:'player'},null,403);
 const experiment=await wait(()=>snap(entries[0]),s=>s.phase==='experiment',12000);assert.equal(experiment.playerCountAtExperimentStart,2);
 await api('/api/queue/asia-pacific/enter',{operationId:uid(),mode:'fresh-session'},first.g,409);
 checked('single-owner admissions, consumed-admission cancellation, hostless start, real eight-second briefing and no fresh mid-session entry');
 const roomId=entries[0].credentials.roomId;const sessionId=experiment.publicSession.sessionId;
 const room=await editRoom(roomId,r=>{r.phase='battle';r.phaseDeadlineMs=null;});
 const completion=uid();assert.equal((await room.finishPublicBattle(sessionId,completion,'victory')).ok,true);
 assert.equal((await room.finishPublicBattle(sessionId,completion,'victory')).ok,true);
 const results=await snap(entries[0]);assert.equal(results.teamScore,100);assert.equal(results.phase,'autopsy');
 assert.equal((await snap(entries[0])).phase,'autopsy');
 const filler=await enter(await createGuest(),'americas','fill-existing-laboratory'); const offer=await wait(()=>status(filler),s=>s.state==='ready-check');
 assert.equal(offer.offer.teamScore,100);assert.equal(offer.offer.reason,'vacancy');await ready(filler);
 const fillMatched=await wait(()=>status(filler),s=>s.state==='matched');assert.equal(fillMatched.admission.roomId,roomId);
 const replacement=await api(`/api/rooms/${roomId}/admit`,{operationId:uid(),reservationId:fillMatched.admission.reservationId,admissionToken:fillMatched.admission.admissionToken}); const c3=await roomSocket(replacement);
 assert.equal(replacement.controller.remainingDoses,0);assert.ok((await snap(entries[0])).players.find(p=>p.playerId===replacement.credentials.sessionId).waitingForNextRound);
 await c1.send('next-round-ready');await c2.send('next-round-ready');await c3.send('next-round-ready');const next=await wait(()=>snap(entries[0]),s=>s.phase==='briefing');assert.equal(next.round,2);assert.equal(next.teamScore,100);
 checked('binding-only completion replay, results minimum, explicit replacement context/admission and fresh next-round eligibility');
 // Full runtime restart preserves guest fencing, room sessions and admitted controller credentials.
 for(const c of clients)c.close(); await sleep(100);await mf.dispose();mf=new Miniflare(convertV4MiniflareOptions(options));origin=await mf.ready;bindings=await mf.getBindings();
 const restored=await snap(entries[0]);assert.equal(restored.teamScore,100);assert.equal(restored.publicSession.sessionId,sessionId);
 const rc1=await roomSocket(entries[0]);const rc2=await roomSocket(entries[1]);
 await api('/api/queue/europe-africa/enter',{operationId:uid(),mode:'fresh-session'},first.g,409);
 assert.equal((await rc1.send('leave')).kind,'action-accepted');await enter(first.g,'europe-africa');
 await api('/api/queue/americas/resume',{ticketId:group[2].id},group[2].g);
 const old=(await status(group[2])).enteredAtMs;assert.equal(old,group[2].status.enteredAtMs);
 // Pure guest authority races and stale-release fencing use real SQLite/RPC objects.
 const fenceGuest=await createGuest();const authority=bindings.GUEST_LEASES.get(bindings.GUEST_LEASES.idFromName(`guest:${fenceGuest.guestId}`));
 const fenceA=uid(),fenceB=uid();const claims=await Promise.all([authority.acquireQueue(fenceA,'americas'),authority.acquireQueue(fenceB,'europe-africa')]);assert.equal(claims.filter(Boolean).length,1);
 const winning=claims[0]?fenceA:fenceB;const winningRegion=claims[0]?'americas':'europe-africa';assert.equal((await authority.cancelTicket(winning)).allowed,true);
 assert.equal(await authority.moveToRoom(winning,winningRegion,roomId,uid()),false);const newClaim=uid();assert.equal(await authority.acquireQueue(newClaim,'asia-pacific'),true);assert.equal(await authority.release('queue',winning,winning),false);
 const expiredGuests=[await createGuest(),await createGuest()];const expId=`p-${uid()}`;const expMembers=expiredGuests.map(g=>({guestId:g.guestId,alias:g.alias,reservationId:uid(),ticketId:uid()}));
 for(const m of expMembers)await bindings.GUEST_LEASES.get(bindings.GUEST_LEASES.idFromName(`guest:${m.guestId}`)).acquireQueue(m.ticketId,'americas');
 const expRoom=bindings.ROOMS.get(bindings.ROOMS.idFromName(`room:${expId}`));const expAllocation=await expRoom.allocatePublic({allocationId:uid(),roomId:expId,region:'americas',members:expMembers});assert.equal(expAllocation.ok,true);
 const token=expAllocation.value[0].admissionToken;
 for(const m of expMembers)assert.equal(await bindings.GUEST_LEASES.get(bindings.GUEST_LEASES.idFromName(`guest:${m.guestId}`)).moveToRoom(m.ticketId,'americas',expId,m.reservationId),true);
 await editRoom(expId,r=>{for(const g of r.reservations)g.expiresAtMs=Date.now()-1;});
 await api(`/api/rooms/${expId}/admit`,{operationId:uid(),reservationId:expMembers[0].reservationId,admissionToken:token},null,410);
 await enter(expiredGuests[0],'asia-pacific');
 checked('atomic fresh cross-pool claim race, cancellation-before-transfer fence and stale release cannot clear a new claim');
 // Seed only the future battle producer boundary; execute real result/replay intents and room synchronization.
 const rc3=await roomSocket(replacement);let progressed=await editRoom(roomId,r=>{r.phase='battle';r.phaseDeadlineMs=null;r.round=3;});
 assert.equal((await progressed.finishPublicBattle(sessionId,uid(),'draw')).ok,true);assert.equal((await snap(entries[1])).phase,'session-results');
 assert.equal((await rc2.send('public-replay-opt-in')).kind,'action-accepted');assert.equal((await rc3.send('public-replay-opt-in')).kind,'action-accepted');
 await editRoom(roomId,r=>{r.phaseDeadlineMs=Date.now()-1;});const replayed=await snap(entries[1]);assert.equal(replayed.phase,'briefing');assert.equal(replayed.round,1);assert.equal(replayed.teamScore,0);assert.notEqual(replayed.publicSession.sessionId,sessionId);
 rc3.close();await sleep(100);
 await editRoom(roomId,r=>{r.phase='experiment';r.round=2;r.phaseDeadlineMs=Date.now()+60000;r.publicState.teamScore=100;r.recovery=null;r.lockedPlayerIds=[entries[1].credentials.sessionId,replacement.credentials.sessionId];for(const seat of r.seats)if(r.lockedPlayerIds.includes(seat.id))seat.eligible=true;const lost=r.seats.find(s=>s.id===replacement.credentials.sessionId);lost.connected=false;lost.disconnectDeadlineMs=Date.now()-31000;});
 const recovering=await snap(entries[1]);assert.equal(recovering.phase,'recovery-lobby');assert.equal(recovering.round,2);assert.equal(recovering.teamScore,100);
 const recoveryFill=await enter(await createGuest(),'americas','fill-existing-laboratory');const recoveryOffer=await wait(()=>status(recoveryFill),s=>s.state==='ready-check');assert.equal(recoveryOffer.offer.reason,'recovery');assert.equal(recoveryOffer.offer.round,2);await ready(recoveryFill);
 const recoveredGrant=await wait(()=>status(recoveryFill),s=>s.state==='matched');const recoveryEntry=await api(`/api/rooms/${roomId}/admit`,{operationId:uid(),reservationId:recoveredGrant.admission.reservationId,admissionToken:recoveredGrant.admission.admissionToken});await roomSocket(recoveryEntry);
 assert.equal((await rc2.send('next-round-ready')).kind,'action-accepted');const retry=await snap(entries[1]);assert.equal(retry.phase,'briefing');assert.equal(retry.round,2);assert.equal(retry.teamScore,100);
 checked('trusted completion boundary, real replay opt-ins/reset and recovery replacement retry retains completed score and round');
 // Remove the expiry-test waiter so the fallback uses exactly two guests.
 const pendingPool=bindings.MATCHMAKING.get(bindings.MATCHMAKING.idFromName('pool:asia-pacific'));const pendingSql=await inspect('MatchmakingPool',pendingPool.id.toString());const pendingModel=JSON.parse((await pendingSql.exec('SELECT record FROM pool_state'))[0].record);const expTicket=pendingModel.tickets.find(t=>t.guestId===expiredGuests[0].guestId);await api('/api/queue/asia-pacific/cancel',{ticketId:expTicket.id},expiredGuests[0]);
 // Two-member, thirty-second fallback is tested against a real alarm in an independent pool.
 const low1=await enter(await createGuest(),'asia-pacific');const low2=await enter(await createGuest(),'asia-pacific');
 const low=await wait(()=>status(low1),s=>s.state==='ready-check',35000); assert.ok(low.serverTimeMs-low1.status.enteredAtMs>=30000);assert.equal((await status(low2)).readyCheckId,low.readyCheckId);
 checked('full SQLite runtime restart, room reconnection, lease release on leave, inactive resume priority and real thirty-second fallback');
 console.log(`All ${passed} public matchmaking runtime scenarios passed.`);
} finally {for(const c of clients)c.close();await mf.dispose();await rm(persistence,{recursive:true,force:true});}
