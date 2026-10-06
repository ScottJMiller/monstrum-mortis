import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import { transformSync } from 'esbuild';
import { GAME_RULES } from '../src/shared/rules.ts';
const require = createRequire(import.meta.url);
const compiled = transformSync(readFileSync(new URL('../src/client/QuickPlay.tsx', import.meta.url), 'utf8'), { loader: 'tsx', format: 'cjs', jsx: 'automatic' }).code;
function harness(local = new Map(), session = new Map()) {
  let cursor=0;const hooks=[];let effects=[];const calls=[];const entries=[];const sockets=[];let tree;let failure=null;let ticketStatus=null;
  const react={ useState(initial) {const i=cursor++;if(!(i in hooks)) hooks[i]=typeof initial==='function'?initial():initial;return [hooks[i],v=>{hooks[i]=typeof v==='function'?v(hooks[i]):v;}];}, useRef(initial){const i=cursor++;if(!(i in hooks))hooks[i]={current:initial};return hooks[i];},useEffect(cb,deps){const i=cursor++;const prev=hooks[i];if(!prev||deps.some((v,j)=>!Object.is(v,prev.deps[j]))){hooks[i]={deps,cleanup:prev?.cleanup};effects.push(()=>{hooks[i].cleanup?.();hooks[i].cleanup=cb();});}}};
  const storage=m=>({getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)});
  class Socket {static OPEN=1;readyState=1;constructor(){sockets.push(this);}send(){}close(){this.readyState=3;}}
  const module={exports:{}};
  const guest={guestId:crypto.randomUUID(),accessToken:'a'.repeat(43),alias:'Grim Curator',symbol:'*'};
  new Script(compiled).runInNewContext({module,exports:module.exports,require:n=>n==='react'?react:n==='../shared/rules.ts'?{GAME_RULES}:require(n),crypto,URL,Date,Error,performance,WebSocket:Socket,localStorage:storage(local),sessionStorage:storage(session),location:{href:'http://localhost/',protocol:'http:'},setInterval:()=>1,clearInterval:()=>{},fetch:async(path,opts)=>{
    const body=opts.body?JSON.parse(opts.body):null;calls.push({path,body});
    if(path.includes('/ping'))return Response.json({});
    if(path==='/api/guests')return Response.json(guest);
    if(path.endsWith('/enter')){ticketStatus={protocolVersion:3,serverTimeMs:Date.now(),region:'americas',ticketId:body.operationId,enteredAtMs:Date.now(),state:'waiting',waitingPlayers:1,readyConfirmed:false,readyDeadlineMs:null,readyCheckId:null,offer:null,admission:null};}
    if(path.includes('/admit')){if(failure){failure=null;throw new Error('Lost admission response');}return Response.json({credentials:{roomId:body.reservationId,sessionId:crypto.randomUUID(),role:'player',reconnectToken:'b'.repeat(43)},snapshot:{},controller:null});}
    if(path.endsWith('/cancel'))ticketStatus={...ticketStatus,state:'cancelled',admission:null};
    return ticketStatus?Response.json(ticketStatus):Response.json({code:'ticket-not-found'}, {status:404});
  }});
  function nodes(n){if(Array.isArray(n))return n.flatMap(nodes);if(!n||typeof n!=='object')return [];return [n,...nodes(n.props?.children)];}
  function text(n){if(Array.isArray(n))return n.map(text).join('');return n&&typeof n==='object'?text(n.props?.children):typeof n==='string'?n:'';}
  function render(){cursor=0;effects=[];tree=module.exports.QuickPlay({onEntry:e=>entries.push(e),onBusy:()=>{}});for(const e of effects)e();}
  async function flush(){await new Promise(r=>setImmediate(r));render();await new Promise(r=>setImmediate(r));render();}
  async function click(label){const b=nodes(tree).find(n=>n.type==='button'&&text(n)===label);assert.ok(b,`Missing ${label}`);assert.equal(b.props.disabled??false,false);await b.props.onClick();render();await flush();}
  render();
  return {calls,entries,local,session,flush,click,failAdmission(){failure=true;},async match(){const t=JSON.parse(session.get('mm.queue.v3'));ticketStatus={...ticketStatus,ticketId:t.id,state:'matched',admission:{roomId:'p-test',reservationId:crypto.randomUUID(),admissionToken:'c'.repeat(43)}};sockets.at(-1).onmessage({data:JSON.stringify({kind:'queue-status',status:ticketStatus})});render();await flush();},dispose(){for(const h of hooks)h?.cleanup?.();}};
}
test('rehearsal gates entry, skip is explicit, measurement never queues without consent', async()=>{
 const app=harness();await app.flush();assert.equal(app.calls.filter(c=>c.path.includes('/enter')).length,0);assert.equal(app.calls.filter(c=>c.path.includes('/ping')).length,3);
 await app.click('Skip rehearsal');await app.click('Enter Quick Play');assert.equal(app.calls.filter(c=>c.path.endsWith('/enter')).length,1);app.dispose();
});
test('lost admission response retries the same key; cancel then entry gets a fresh ticket and key',async()=>{
 const app=harness(new Map([['mm.tutorial.v1','done']]));await app.flush();await app.click('Enter Quick Play');const old=JSON.parse(app.session.get('mm.queue.v3'));app.failAdmission();await app.match();await app.click('Retry admission');
 const admissions=app.calls.filter(c=>c.path.includes('/admit'));assert.equal(admissions.length,2);assert.equal(admissions[0].body.operationId,admissions[1].body.operationId);assert.equal(admissions[0].body.operationId,old.admissionOperationId);assert.equal(app.entries.length,1);app.dispose();
 const next=harness(app.local);await next.flush();await next.click('Enter Quick Play');const pending=JSON.parse(next.session.get('mm.queue.v3'));await next.click('Cancel queue');await next.click('Enter Quick Play');const fresh=JSON.parse(next.session.get('mm.queue.v3'));assert.notEqual(fresh.id,pending.id);assert.notEqual(fresh.admissionOperationId,pending.admissionOperationId);next.dispose();
});
test('reloading an interrupted admission restores its operation key and explicit queue mode',async()=>{
 const local=new Map([['mm.tutorial.v1','done'],['mm.guest.v3',JSON.stringify({guestId:crypto.randomUUID(),accessToken:'a'.repeat(43),alias:'Hollow Scholar',symbol:'*'})]]);
 const ticket={id:crypto.randomUUID(),region:'americas',mode:'fill-existing-laboratory',admissionOperationId:crypto.randomUUID()};const session=new Map([['mm.queue.v3',JSON.stringify(ticket)]]);
 const app=harness(local,session);await app.flush();await app.match();assert.equal(app.calls.find(c=>c.path.includes('/admit')).body.operationId,ticket.admissionOperationId);app.dispose();
});
