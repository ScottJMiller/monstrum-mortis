import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
const persistence = await mkdtemp(join(tmpdir(), 'mm-fresh-admission-'));
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
 const c={ws,messages,close(){clearInterval(timer);ws.close();},async send(kind) {const actionId=uid();ws.send(JSON.stringify({protocolVersion:4,actionId,kind}));return wait(async()=>messages.find(m=>m.actionId===actionId),Boolean,5000);}};
 clients.push(c); return c;
}
async function roomSocket(entry) { return socket(`/api/rooms/${entry.credentials.roomId}/socket`,['mm-v4',`token.${entry.credentials.reconnectToken}`]); }
async function snap(e) {return (await api(`/api/rooms/${e.credentials.roomId}/snapshot`,null,null,200,e.credentials)).snapshot;}

try {
 origin=await mf.ready; bindings=await mf.getBindings();
 const guests=await Promise.all([createGuest(),createGuest(),createGuest()]);
 const roomId=`p-${uid()}`;
 const members=guests.map(g=>({guestId:g.guestId,alias:g.alias,reservationId:uid(),ticketId:uid()}));
 for(const m of members)assert.equal(await bindings.GUEST_LEASES.get(bindings.GUEST_LEASES.idFromName(`guest:${m.guestId}`)).acquireQueue(m.ticketId,'americas'),true);
 const room=bindings.ROOMS.get(bindings.ROOMS.idFromName(`room:${roomId}`));
 const allocation=await room.allocatePublic({allocationId:uid(),roomId,region:'americas',members});assert.equal(allocation.ok,true);
 const entries=[];
 for(let i=0;i<members.length;i++){
  const m=members[i];assert.equal(await bindings.GUEST_LEASES.get(bindings.GUEST_LEASES.idFromName(`guest:${m.guestId}`)).moveToRoom(m.ticketId,'americas',roomId,m.reservationId),true);
  entries.push(await api(`/api/rooms/${roomId}/admit`,{operationId:uid(),reservationId:m.reservationId,admissionToken:allocation.value[i].admissionToken}));
 }
 assert.equal((await snap(entries[0])).phase,'lobby');
 await roomSocket(entries[0]);await roomSocket(entries[1]);
 const briefing=await snap(entries[0]);assert.equal(briefing.phase,'briefing');
 assert.equal(briefing.players.find(p=>p.playerId===entries[2].credentials.sessionId).waitingForNextRound,true);
 const third=await roomSocket(entries[2]);
 const joined=await snap(entries[2]);assert.equal(joined.phase,'briefing');assert.equal(joined.phaseDeadlineMs,briefing.phaseDeadlineMs);
 assert.ok(joined.players.every(p=>!p.waitingForNextRound));
 await wait(async()=>third.messages.find(m=>m.kind==='room-snapshot'&&m.snapshot.phase==='experiment'),Boolean,12000);
 for(const entry of entries){const view=await snap(entry);assert.equal(view.playerCountAtExperimentStart,3);assert.ok(view.players.every(p=>!p.waitingForNextRound));}
 console.log('PASS: three lobby admissions followed by staggered sockets all enter round one; real briefing deadline and experiment scaling remain correct.');
} finally {for(const c of clients)c.close();await mf.dispose();await rm(persistence,{recursive:true,force:true});}
