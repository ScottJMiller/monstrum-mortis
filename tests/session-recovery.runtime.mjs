import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
const persistence = await mkdtemp(join(tmpdir(), 'mm-session-recovery-'));
const options = { name: 'monstrum-mortis', modules: true, scriptPath: resolve('dist/worker/worker.js'), compatibilityDate: '2026-10-05', resourcePersistencePath: persistence,
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
async function wait(fn, predicate, timeout=15000) { const end=Date.now()+timeout; while(Date.now()<end) { const value=await fn(); if(predicate(value)) return value; await sleep(500); } throw new Error('Runtime wait timed out'); }
async function socket(path, protocols) {
 const url=new URL(path,origin); url.protocol='ws:'; const ws=new WebSocket(url, protocols); const messages=[];
 ws.addEventListener('message',e=>{ if(e.data!=='pong') messages.push(JSON.parse(e.data)); });
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 const timer=setInterval(()=>{if(ws.readyState===WebSocket.OPEN) ws.send('ping');},10000);
 const c={ws,messages,close(){clearInterval(timer);ws.close();},async send(kind) {const actionId=uid();ws.send(JSON.stringify({protocolVersion:3,actionId,kind}));return wait(async()=>messages.find(m=>m.actionId===actionId),Boolean,5000);}};
 clients.push(c); return c;
}
async function roomSocket(entry) { return socket(`/api/rooms/${entry.credentials.roomId}/socket`,['mm-v3',`token.${entry.credentials.reconnectToken}`]); }
async function snap(e) {return (await api(`/api/rooms/${e.credentials.roomId}/snapshot`,null,null,200,e.credentials)).snapshot;}

try {
 origin=await mf.ready; bindings=await mf.getBindings();
 const publicGuests=[await createGuest(),await createGuest()];
 const roomId=`p-${uid()}`;
 const members=publicGuests.map(g=>({guestId:g.guestId,alias:g.alias,reservationId:uid(),ticketId:uid()}));
 for(const m of members) assert.equal(await bindings.GUEST_LEASES.get(bindings.GUEST_LEASES.idFromName(`guest:${m.guestId}`)).acquireQueue(m.ticketId,'americas'),true);
 const stub=bindings.ROOMS.get(bindings.ROOMS.idFromName(`room:${roomId}`));
 const allocation=await stub.allocatePublic({allocationId:uid(),roomId,region:'americas',members});assert.equal(allocation.ok,true);
 for(const m of members) assert.equal(await bindings.GUEST_LEASES.get(bindings.GUEST_LEASES.idFromName(`guest:${m.guestId}`)).moveToRoom(m.ticketId,'americas',roomId,m.reservationId),true);
 const m=members[1];const grant=allocation.value[1];
 const publicEntry=await api(`/api/rooms/${roomId}/admit`,{operationId:uid(),reservationId:m.reservationId,admissionToken:grant.admissionToken});
 const publicClient=await roomSocket(publicEntry);
 // Owner recovery does not require the lost room credential, and cannot release a different guest or newer claim.
 const recoveryGuest=await createGuest();
 const privateEntry=await api('/api/rooms/private',{operationId:uid(),alias:'Recovery Test',presentation:'remote'},recoveryGuest,201);
 const lostClient=await roomSocket(privateEntry);
 const session=await api('/api/guests/session',null,recoveryGuest);assert.equal(session.holder.kind,'room');
 await api('/api/guests/session',null,{...recoveryGuest,accessToken:'x'.repeat(43)},401);
 const leaveBody={kind:session.holder.kind,id:session.holder.id,nonce:session.holder.nonce};
 await api('/api/guests/leave-session',leaveBody,await createGuest());
 assert.equal((await snap(privateEntry)).players.length,1);
 await api('/api/guests/leave-session',{...leaveBody,nonce:'wrong-nonce'},recoveryGuest,409);
 assert.equal((await api('/api/guests/leave-session',leaveBody,recoveryGuest)).holder,null);
 await api(`/api/rooms/${privateEntry.credentials.roomId}/snapshot`,null,null,401,privateEntry.credentials);
 await wait(async()=>lostClient.ws.readyState,s=>s!==WebSocket.OPEN,5000);

 const newTicket=await enter(recoveryGuest,'europe-africa');
 await api('/api/guests/leave-session',leaveBody,recoveryGuest,409);
 assert.ok(['waiting','ready-check'].includes((await status(newTicket)).state));
 const queuedSession=await api('/api/guests/session',null,recoveryGuest);
 assert.equal((await api('/api/guests/leave-session',{kind:queuedSession.holder.kind,id:queuedSession.holder.id,nonce:queuedSession.holder.nonce},recoveryGuest)).holder,null);
 const publicSession=await api('/api/guests/session',null,publicGuests[1]);assert.equal(publicSession.holder.kind,'room');
 assert.equal((await api('/api/guests/leave-session',{kind:'room',id:publicSession.holder.id,nonce:publicSession.holder.nonce},publicGuests[1])).holder,null);
 await api(`/api/rooms/${roomId}/snapshot`,null,null,401,publicEntry.credentials);
 await wait(async()=>publicClient.ws.readyState,s=>s!==WebSocket.OPEN,5000);

 await enter(publicGuests[1],'europe-africa');
 console.log('PASS: authenticated lost-seat recovery for private/public rooms, queue cancellation, wrong-token denial, and stale/wrong-owner recovery cannot release another claim');

} finally {for(const c of clients)c.close();await mf.dispose();await rm(persistence,{recursive:true,force:true});}
