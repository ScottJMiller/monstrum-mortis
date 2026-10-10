import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,resolve,extname } from 'node:path';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { PROTOCOL_VERSION, ROOM_SOCKET_PROTOCOL } from '../../src/shared/protocol.ts';
export const uid=()=>crypto.randomUUID();
export const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export const action=(kind,extra={})=>({protocolVersion:PROTOCOL_VERSION,actionId:uid(),kind,...extra});
export async function wait(fn,predicate=Boolean,timeout=12000){const end=Date.now()+timeout;while(Date.now()<end){const result=await fn();if(predicate(result))return result;await sleep(25);}throw new Error('Combat verification wait timed out');}
export async function runtime(){
 const persistence=await mkdtemp(join(tmpdir(),'mm-combat-')),clients=[];let requests=0;
 const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml'};
 const options=convertV4MiniflareOptions({name:'monstrum-mortis',modules:true,scriptPath:resolve('dist/worker/worker.js'),compatibilityDate:'2026-10-05',resourcePersistencePath:persistence,unsafeInspectDurableObjects:true,durableObjects:Object.fromEntries(['LaboratoryRoom','MatchmakingPool','GuestLease'].map((className,i)=>[['ROOMS','MATCHMAKING','GUEST_LEASES'][i],{className,useSQLite:true}])),serviceBindings:{ASSETS:async request=>{const path=new URL(request.url).pathname;try{const file=path==='/'?'/index.html':path;return new Response(await readFile(resolve('dist/client')+file),{headers:{'Content-Type':mime[extname(file)]??'application/octet-stream'}});}catch{return new Response('Missing asset',{status:404});}}}});
 let mf=new Miniflare(options),origin=await mf.ready;
 const harness={get mf(){return mf;},get origin(){return origin;},
  async api(path,value,credentials,expected=200,guest){const response=await fetch(new URL(path,origin),{method:value===undefined?'GET':'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':`198.51.100.${++requests%250}`,...(credentials?{Authorization:`Bearer ${credentials.reconnectToken}`}:guest?{'X-Guest-Id':guest.guestId,'X-Guest-Token':guest.accessToken,Authorization:`Bearer ${guest.accessToken}`}: {})},...(value===undefined?{}:{body:JSON.stringify(value)})});const data=await response.json();assert.equal(response.status,expected,JSON.stringify(data));return data;},
  async view(e){return harness.api(`/api/rooms/${e.credentials.roomId}/snapshot`,undefined,e.credentials);},
  // Inspection/eviction accept names directly; do not allocate unused RPC stubs.
  async storage(id){const sql=await mf.unsafeGetDurableObjectStorage('monstrum-mortis','LaboratoryRoom',{name:`room:${id}`});return {sql};},
  async evict(id){await mf.unsafeEvictDurableObject('monstrum-mortis','LaboratoryRoom',{name:`room:${id}`,webSockets:'hibernate'});},
  async record(id,edit){const {sql}=await harness.storage(id),r=JSON.parse((await sql.exec('SELECT record FROM room_state'))[0].record);if(edit){edit(r);r.revision++;await sql.exec('UPDATE room_state SET record=?',JSON.stringify(r));}return r;},
  async socket(e){const url=new URL(`/api/rooms/${e.credentials.roomId}/socket`,origin);url.protocol='ws:';const ws=new WebSocket(url,[ROOM_SOCKET_PROTOCOL,`token.${e.credentials.reconnectToken}`]),messages=[];ws.addEventListener('message',event=>{if(event.data!=='pong')messages.push(JSON.parse(event.data));});await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});const timer=setInterval(()=>{if(ws.readyState===WebSocket.OPEN)ws.send('ping');},10000);const c={ws,messages,close(){clearInterval(timer);ws.close();},async send(a){const after=messages.length;ws.send(JSON.stringify(a));return wait(()=>messages.slice(after).find(m=>m.actionId===a.actionId&&['action-accepted','action-rejected'].includes(m.kind)));}};clients.push(c);return c;},
  async laboratory(n=2){const host=await harness.api('/api/rooms/private',{operationId:uid(),alias:'Host',presentation:'remote'},undefined,201),entries=[host],sockets=[await harness.socket(host)];for(let i=1;i<n;i++){const e=await harness.api(`/api/rooms/${host.credentials.roomId}/join`,{operationId:uid(),alias:`Scientist ${i}`,role:'player'});entries.push(e);sockets.push(await harness.socket(e));}return {id:host.credentials.roomId,entries,sockets};},
  async publicLaboratory(n=4){const tickets=[];for(let i=0;i<n;i++){const g=await harness.api('/api/guests',{operationId:uid()});const ticketId=uid();await harness.api('/api/queue/americas/enter',{operationId:ticketId,mode:'fresh-session'},undefined,200,g);tickets.push({g,ticketId});}const status=async t=>{await sleep(500);return harness.api(`/api/queue/americas/status?ticketId=${t.ticketId}`,undefined,undefined,200,t.g);};const ready=(await status(tickets[0])).readyCheckId;for(const t of tickets)await harness.api('/api/queue/americas/ready',{ticketId:t.ticketId,readyCheckId:ready},undefined,200,t.g);const admitted=await Promise.all(tickets.map(t=>wait(()=>status(t),s=>s.state==='matched')));const entries=[],sockets=[];for(const s of admitted){const e=await harness.api(`/api/rooms/${s.admission.roomId}/admit`,{operationId:uid(),reservationId:s.admission.reservationId,admissionToken:s.admission.admissionToken});entries.push(e);sockets.push(await harness.socket(e));}return{id:entries[0].credentials.roomId,entries,sockets};},
  async restart(){for(const c of clients)c.close();await sleep(50);await mf.dispose();mf=new Miniflare(options);origin=await mf.ready;},
  async close(){for(const c of clients)c.close();await mf.dispose();await rm(persistence,{recursive:true,force:true});},
 };return harness;
}
