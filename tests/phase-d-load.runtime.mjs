/** Local-only Phase D baseline. No target URL or deployed-load mode is supported. */
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime,action,uid,sleep,wait} from './support/combat-runtime.mjs';
import {QUEUE_SOCKET_PROTOCOL} from '../src/shared/protocol.ts';
const out='docs/battle-v2-phase-d-review',h=await runtime(),queues=[],labs=[],samples={http:[],action:[]};
const start=performance.now(),api=h.api.bind(h);h.api=async(...args)=>{const t=performance.now();try{return await api(...args);}finally{samples.http.push(performance.now()-t);}};
const measure=async(c,a)=>{const t=performance.now(),r=await c.send(a);samples.action.push(performance.now()-t);assert.equal(r.kind,'action-accepted');return r;};
const distribution=values=>{const v=values.toSorted((a,b)=>a-b);return {samples:v.length,medianMs:+v[Math.floor(v.length*.5)].toFixed(2),p95Ms:+v[Math.min(v.length-1,Math.floor(v.length*.95))].toFixed(2),maxMs:+v.at(-1).toFixed(2)};};
let status='failed';
try{
 // Fill-existing tickets stay waiting when no public vacancies exist. No fake readiness or storage edits.
 for(let i=0;i<100;i++){
  const guest=await h.api('/api/guests',{operationId:uid()}),ticketId=uid();
  const s=await h.api('/api/queue/americas/enter',{operationId:ticketId,mode:'fill-existing-laboratory'},undefined,200,guest);assert.equal(s.state,'waiting');
  const url=new URL(`/api/queue/americas/socket?ticketId=${ticketId}`,h.origin);url.protocol='ws:';
  const ws=new WebSocket(url,[QUEUE_SOCKET_PROTOCOL,`guest.${guest.guestId}`,`token.${guest.accessToken}`]);
  await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  const timer=setInterval(()=>{if(ws.readyState===WebSocket.OPEN)ws.send('ping');},10000);queues.push({guest,ticketId,ws,timer});
 }
 console.log('PASS 1: 100 real owner-authenticated waiting fill-existing tickets and queue sockets, no public vacancies');
 for(let i=0;i<10;i++){
  const lab=await h.laboratory(8);const display=await h.api(`/api/rooms/${lab.id}/join`,{operationId:uid(),alias:'Legacy display',role:'display'});lab.display=display;lab.displaySocket=await h.socket(display);labs.push(lab);
 }
 assert.equal(labs.flatMap(l=>[...l.sockets,l.displaySocket]).every(c=>c.ws.readyState===WebSocket.OPEN),true);
 await Promise.all(labs.map(l=>measure(l.sockets[0],action('start-private-session'))));
 await Promise.all(labs.map(l=>wait(()=>h.view(l.entries[0]),v=>v.snapshot.phase==='experiment',15000)));
 const attempts=await Promise.all(labs.map(async lab=>{
  const views=await Promise.all(lab.entries.map(e=>h.view(e))),attemptId=views[0].snapshot.attemptId;
  const intentions=views.map(v=>action('inject',{attemptId,specimenId:v.controller.tray[0].specimenId}));
  await Promise.all(lab.sockets.map((c,i)=>measure(c,intentions[i])));
  await measure(lab.sockets[0],intentions[0]); // Replay-safe duplicate under the same load.
  const after=await Promise.all(lab.entries.map(e=>h.view(e)));
  assert.ok(after.every(v=>v.controller.remainingDoses===5));assert.equal(after[0].snapshot.mutations.length,8);
  for(const v of after)assert.deepEqual(v.snapshot.creature,after[0].snapshot.creature);
  await Promise.all([...lab.sockets,lab.displaySocket].map(c=>wait(()=>c.messages.filter(m=>m.kind==='room-snapshot').at(-1)?.snapshot,s=>s?.mutations?.length===8)));
  assert.equal((await h.view(lab.display)).controller,null);
  return {attemptId,ready:Math.max(...after.map(v=>v.controller.switchReadyAtMs))};
 }));
 console.log('PASS 2: ten rooms / 80 player sockets / ten legacy display sockets accept 80 simultaneous injections; ten duplicate retries spend no extra doses and all 90 viewers synchronize');
 await sleep(Math.max(0,Math.max(...attempts.map(a=>a.ready))-Date.now()+40));
 await Promise.all(labs.flatMap((l,i)=>l.sockets.map(c=>measure(c,action('pull-switch',{attemptId:attempts[i].attemptId})))));
 const battles=await Promise.all(labs.map(l=>wait(()=>h.view(l.entries[0]),v=>v.snapshot.phase==='battle',9000)));
 await h.evict(labs[0].id);assert.deepEqual((await h.view(labs[0].entries[1])).snapshot.battle,battles[0].snapshot.battle);
 console.log('PASS 3: actual one-second switch/five-second release boundaries reach ten battles; local hibernating eviction preserves one accepted timeline');
 const results=await Promise.all(labs.map(l=>wait(()=>h.view(l.entries[0]),v=>v.snapshot.phase==='autopsy',40000)));
 for(let i=0;i<labs.length;i++){
  const views=await Promise.all([...labs[i].entries,labs[i].display].map(e=>h.view(e)));
  for(const v of views){assert.deepEqual(v.snapshot.result,results[i].snapshot.result);assert.equal(v.snapshot.session.completed.length,1);}
 }
 const waiting=await Promise.all(queues.map(q=>h.api(`/api/queue/americas/status?ticketId=${q.ticketId}`,undefined,undefined,200,q.guest)));
 assert.ok(waiting.every(s=>s.state==='waiting'));assert.ok(queues.every(q=>q.ws.readyState===WebSocket.OPEN));
 console.log('PASS 4: ten actual completion alarms publish one identical result per room; all 100 owner queue sockets remain connected/waiting');
 status='passed';
}finally{
 await mkdir(out,{recursive:true});
 const report={recordedAt:new Date().toISOString(),status,scope:'Isolated local Miniflare/SQLite with native network clients; NO deployment, physical browser, real WAN latency or Cloudflare quota/CPU measurement',workerSha256:createHash('sha256').update(await readFile('dist/worker/worker.js')).digest('hex'),load:{privateLaboratories:labs.length,players:labs.length*8,legacyDisplays:labs.length,queueGuests:queues.length,queueMode:'fill-existing-laboratory; no public vacancies',intendedConcurrentSockets:190,roundsPerRoom:1,injectionsPerPlayer:1,duplicatesPerRoom:1,storageOrDeadlineEdits:false},elapsedSeconds:+((performance.now()-start)/1000).toFixed(2),latency:{http: samples.http.length?distribution(samples.http):null,actionAcknowledgement:samples.action.length?distribution(samples.action):null},limitations:['Local loopback timings include test polling (25ms minimum cadence); not WAN measurements or production SLA.','Queue cohort tests idle fill-existing tickets, not fresh-session readiness/allocation bursts.','One accepted injection and one round per player; not full-dose or three-round sustained soak.','Legacy viewers use the retained compatibility join API in an isolated runtime; no production display entry is added.','Harness rotates test CF-Connecting-IP headers; does not establish shared-NAT production rate-limit behavior.','No CPU, billed request/GB-second, SQL row-operation, device/GPU or account-budget inference.']};
 await writeFile(`${out}/local-load.json`,JSON.stringify(report,null,2)+'\n');
 for(const q of queues){clearInterval(q.timer);q.ws.close();}await h.close();
}
