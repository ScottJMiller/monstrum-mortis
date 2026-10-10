import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, extname } from 'node:path';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { chromium } from 'playwright-core';
import { DNA_CATALOGUE } from '../src/server/catalogue/dna.ts';
const persistence=await mkdtemp(join(tmpdir(),'mm-dna-browser-'));const artifacts=resolve('dist/dna-checks');await mkdir(artifacts,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml'};
const mf=new Miniflare(convertV4MiniflareOptions({name:'monstrum-mortis',modules:true,scriptPath:resolve('dist/worker/worker.js'),compatibilityDate:'2026-10-05',resourcePersistencePath:persistence,unsafeInspectDurableObjects:true,
 durableObjects:Object.fromEntries(['LaboratoryRoom','MatchmakingPool','GuestLease'].map((className,i)=>[['ROOMS','MATCHMAKING','GUEST_LEASES'][i],{className,useSQLite:true}])),
 serviceBindings:{ASSETS:async request=>{const path=new URL(request.url).pathname;try{const file=path==='/'?'/index.html':path;return new Response(await readFile(resolve('dist/client')+file),{headers:{'Content-Type':mime[extname(file)]??'application/octet-stream'}});}catch{return new Response('Missing asset',{status:404});}}}}));
let browser,origin;const contexts=[];const errors=[];let passed=0;const pass=label=>console.log(`PASS ${++passed}: ${label}`);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function page(width=1280,reduced=false,fallback=false){const context=await browser.newContext({viewport:{width,height:900},reducedMotion:reduced?'reduce':'no-preference'});contexts.push(context);await context.addInitScript(({fallback})=>{
 const NativeSocket=window.WebSocket;window.__mmSockets=[];window.__mmFrames=[];window.__mmIntents=[];window.__dropAck=false;
 window.WebSocket=class extends NativeSocket{
  constructor(...args){super(...args);window.__mmSockets.push(this);this.addEventListener('message',event=>{if(event.data!=='pong')window.__mmFrames.push(JSON.parse(event.data));});}
  send(data){if(data!=='ping'){const action=JSON.parse(data);window.__mmIntents.push(action);if(action.kind==='inject')window.__lastInjection=action.actionId;}super.send(data);}
  set onmessage(handler){super.onmessage=event=>{const msg=event.data==='pong'?null:JSON.parse(event.data);if(window.__dropAck&&msg?.kind==='action-accepted'&&msg.actionId===window.__lastInjection){window.__dropAck=false;return;}handler(event);};}
 };
 if(fallback)HTMLCanvasElement.prototype.getContext=()=>null;
},{fallback});const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(origin);await p.waitForSelector('.chamber-canvas canvas, .static-creature');return p;}
async function credentials(p){return p.evaluate(()=>JSON.parse(sessionStorage.getItem('mm.room.v2')));}
async function view(p){const c=await credentials(p);return (await p.request.get(new URL(`/api/rooms/${c.roomId}/snapshot`,origin).href,{headers:{Authorization:`Bearer ${c.reconnectToken}`}})).json();}
async function record(p,edit){const c=await credentials(p);const bindings=await mf.getBindings();const stub=bindings.ROOMS.get(bindings.ROOMS.idFromName(`room:${c.roomId}`));const sql=await mf.unsafeGetDurableObjectStorage('monstrum-mortis','LaboratoryRoom',{id:stub.id.toString()});const r=JSON.parse((await sql.exec('SELECT record FROM room_state'))[0].record);if(edit){edit(r,c);r.revision++;await sql.exec('UPDATE room_state SET record=?',JSON.stringify(r));}return r;}
async function sync(p){const after=await p.evaluate(()=>{const after=window.__mmFrames.length;window.__mmSockets.at(-1).send(JSON.stringify({protocolVersion:4,actionId:crypto.randomUUID(),kind:'sync-request',afterRevision:0}));return after;});await p.waitForFunction(after=>window.__mmFrames.slice(after).some(m=>m.kind==='controller-snapshot'),after);}
async function connected(p){await p.waitForFunction(()=>document.querySelector('.connection-badge')?.textContent.includes('Connected') && !!document.querySelector('.room-panel'));}
async function create(p,name){await p.getByLabel('Player Name',{exact:true}).fill(name);await p.getByRole('button',{name:'Create Private Laboratory',exact:true}).click();await connected(p);return credentials(p);}
async function joinLaboratory(p,id,name,display=false){await p.getByLabel('Invitation code',{exact:true}).fill(id);if(display)await p.getByLabel('Join as a display without a player seat').check();else await p.getByLabel('Player Name',{exact:true}).fill(name);await p.getByRole('button',{name:'Join by Code',exact:true}).click();await connected(p);}
async function readyTray(p){await p.waitForFunction(()=>document.querySelectorAll('.specimen-button').length===4&&[...document.querySelectorAll('.specimen-button')].every(b=>!b.disabled));}
async function inject(p,expected='action-accepted'){
 const previous=await p.evaluate(()=>window.__lastInjection);
 await p.locator('.specimen-button').first().click();const button=p.getByRole('button',{name:'Inject selected specimen',exact:true});
 // A peer's room snapshot can disable this button between pointer down/up,
 // until our private controller catches up. Retry only a click that sent nothing.
 for(let attempt=0;attempt<3;attempt++){
  await button.click();
  try{await p.waitForFunction(previous=>window.__lastInjection!==previous,previous,{timeout:1500});break;}
  catch(error){if(await p.evaluate(previous=>window.__lastInjection!==previous,previous))break;if(attempt===2)throw error;}
 }
 // Cleared pending UI alone also permits rejection, or no newly sent action.
 // Wait for this click's action ID and its real server receipt before reading state.
 await p.waitForFunction(previous=>window.__lastInjection!==previous&&window.__mmFrames.some(m=>m.actionId===window.__lastInjection&&['action-accepted','action-rejected'].includes(m.kind)),previous);
 const receipt=await p.evaluate(()=>window.__mmFrames.find(m=>m.actionId===window.__lastInjection&&['action-accepted','action-rejected'].includes(m.kind)));
 assert.equal(receipt.kind,expected,JSON.stringify(receipt));
 await p.waitForFunction(()=>sessionStorage.getItem('mm.pending-intent.v4')===null);return receipt;
}
async function artMatches(p){const v=await view(p);await p.waitForFunction(ids=>{const e=document.querySelector('.chamber-canvas');return e?.style.visibility==='visible'&&e.dataset.parts?.split(',').sort().join(',')===ids;},v.snapshot.creature.parts.map(p=>p.assetId).sort().join(','));}
async function a11y(p){await p.addScriptTag({path:resolve('node_modules/axe-core/axe.min.js')});const violations=await p.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);}
try{
 origin=String(await mf.ready);browser=await chromium.launch({executablePath:process.env.MM_CHROME_PATH??'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const host=await page();const phone=await page(390,true);const display=await page(1920,false,true);const entry=await create(host,'Host Curator');await joinLaboratory(phone,entry.roomId,'Phone Curator');await joinLaboratory(display,entry.roomId,'Display',true);
 await host.getByRole('button',{name:'Start experiment',exact:true}).click();await Promise.all([readyTray(host),readyTray(phone)]);
 assert.equal(await host.getByRole('button',{name:'Inject selected specimen',exact:true}).isDisabled(),true);assert.equal(await host.getByRole('button',{name:'Unleash the Creature!',exact:true}).isDisabled(),true);
 const pre=await view(host);for(const d of DNA_CATALOGUE)assert.ok(!JSON.stringify(pre.controller).includes(d.autopsyName));
 assert.equal(await display.locator('.specimen-button').count(),0);assert.equal(await display.getByRole('button',{name:'Unleash the Creature!',exact:true}).count(),0);
 await a11y(host);await a11y(phone);await a11y(display);pass('real private briefing opens four accessible private specimens and six doses; selection is required and display controls remain isolated');
 let sockets=0;host.on('websocket',()=>sockets++);await host.evaluate(()=>window.__mmCanvas=document.querySelector('.chamber-canvas canvas'));
 await Promise.all([inject(host),inject(phone)]);await Promise.all([artMatches(host),artMatches(phone)]);
 const accepted=await view(host);assert.equal(accepted.controller.remainingDoses,5);assert.deepEqual(accepted.snapshot.creature,(await view(phone)).snapshot.creature);
 assert.equal(await host.evaluate(()=>document.activeElement?.id),'specimen-tray-heading');
 await display.waitForFunction(()=>document.querySelectorAll('.static-creature img').length>=3);
 assert.equal(await phone.locator('.chamber-still').count(),1);await host.screenshot({path:join(artifacts,'desktop-experiment.png'),fullPage:true});await phone.screenshot({path:join(artifacts,'phone-experiment.png'),fullPage:true});
 const cooldown=accepted.controller.nextInjectionAtMs-Date.now();if(cooldown>0)assert.equal(await host.getByRole('button',{name:'Unleash the Creature!',exact:true}).isDisabled(),true);
 await host.waitForFunction(()=>!document.querySelector('.unleash-switch').disabled);pass('independent simultaneous browser injections update doses, captions and identical rendered anatomy; focus and real cooldown work');
 await host.evaluate(()=>window.__dropAck=true);await host.locator('.specimen-button').first().click();await host.getByRole('button',{name:'Inject selected specimen',exact:true}).click();await host.waitForFunction(()=>!window.__dropAck);
 const pending=await host.evaluate(()=>JSON.parse(sessionStorage.getItem('mm.pending-intent.v4')).action);assert.equal((await view(host)).controller.remainingDoses,4);
 await host.reload();await connected(host);await host.waitForFunction(()=>sessionStorage.getItem('mm.pending-intent.v4')===null);
 assert.equal((await view(host)).controller.remainingDoses,4);assert.ok(await host.evaluate(id=>window.__mmIntents.some(a=>a.actionId===id&&a.kind==='inject'),pending.actionId));
 pass('a dropped accepted acknowledgment survives reload and retries the same action ID without reroll or double spending');
 const late=await page(320);await joinLaboratory(late,entry.roomId,'Waiting Scientist');assert.equal(await late.locator('.specimen-button').count(),0);assert.equal(await late.getByRole('button',{name:'Unleash the Creature!',exact:true}).isDisabled(),true);
 assert.equal((await view(late)).controller.remainingDoses,0);assert.equal(await late.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);pass('a real late private admission receives viewing-only state and cannot inject or pull a switch');
 // Isolated art fixture extends only its test deadline, never the production 75-second rule.
 await record(host,r=>{r.phaseDeadlineMs=Date.now()+120000;});await sync(host);
 const socketsBeforeMutations=sockets; let sequence=0; await sleep(10010);
 for(const definition of DNA_CATALOGUE){if(sequence && sequence%10===0)await sleep(10010);await record(host,(r,c)=>{const s=r.seats.find(s=>s.id===c.sessionId);s.nextInjectionAtMs=0;s.remainingDoses=6;s.drawCursor=0;s.tray[0].dnaId=definition.id;});await sync(host);await readyTray(host);await inject(host);await artMatches(host);const v=await view(host);assert.equal(v.snapshot.mutations.at(-1).name,definition.autopsyName);sequence++;}
 assert.equal(sequence,30);assert.equal(await host.locator('.mutation-log li').count(),33);assert.ok((await host.locator('.mutation-log').innerText()).includes('replaced;')); assert.equal(sockets,socketsBeforeMutations);assert.equal(await host.evaluate(()=>window.__mmCanvas===document.querySelector('.chamber-canvas canvas')),false,'reload legitimately created a new scene');
 // Establish a current canvas reference, then two rapid replacements with the first image delayed.
 await host.evaluate(()=>window.__mmCanvas=document.querySelector('.chamber-canvas canvas'));
 let delayedLoads=0; await host.route('**/mutation.titan-fibers.webp',async route=>{delayedLoads++;await sleep(1500);await route.continue();});
 for(const [p,id] of [[host,'titan-fibers'],[phone,'auxiliary-heart']]){await record(p,(r,c)=>{const s=r.seats.find(s=>s.id===c.sessionId);s.nextInjectionAtMs=0;s.remainingDoses=6;s.drawCursor=0;s.tray[0].dnaId=id;});await sync(p);await readyTray(p);await inject(p);}
 await artMatches(host);await sleep(1600);await artMatches(host);assert.ok(delayedLoads>0);assert.equal(await host.evaluate(()=>window.__mmCanvas===document.querySelector('.chamber-canvas canvas')),true);
 assert.ok(Number(await host.locator('.chamber-canvas').getAttribute('data-texture-count'))<=16);await host.unroute('**/mutation.titan-fibers.webp');await a11y(host);
 pass('all 30 authoritative mutations render through real browser selection/injection; rapid replacement keeps one renderer and bounded textures without an animation backlog');
 // A validated rate-limit rejection must resolve the actual pending UI intent.
 await record(host,(r,c)=>{r.seats.find(s=>s.id===c.sessionId).nextInjectionAtMs=0;});await sync(host);await readyTray(host);
 const rateBudget=(await view(host)).controller.remainingDoses;
 await host.evaluate(()=>{for(let i=0;i<35;i++)window.__mmSockets.at(-1).send(JSON.stringify({protocolVersion:4,actionId:crypto.randomUUID(),kind:'sync-request',afterRevision:0}));});
 const rateReceipt=await inject(host,'action-rejected');assert.equal(rateReceipt.code,'rate-limited');assert.equal((await view(host)).controller.remainingDoses,rateBudget);assert.ok((await host.locator('.service-status').innerText()).includes('rate-limited'));await sleep(10010);
 pass('a rate-limited injection resolves pending feedback and preserves the authoritative dose budget');
 // Leave/recreate to test an ordinary fresh budget with no fixture-refilled dose count.
 await host.getByRole('button',{name:'Leave laboratory',exact:true}).click();await host.getByRole('button',{name:'Create Private Laboratory',exact:true}).waitFor();const budget=await create(host,'Budget Curator');
 await phone.getByRole('button',{name:'Leave laboratory',exact:true}).click();await phone.getByRole('button',{name:'Join by Code',exact:true}).waitFor();await joinLaboratory(phone,budget.roomId,'Phone Curator');
 await host.getByRole('button',{name:'Start experiment',exact:true}).click();await Promise.all([readyTray(host),readyTray(phone)]);
 for(let i=0;i<6;i++){if(i){await record(host,(r,c)=>{r.seats.find(s=>s.id===c.sessionId).nextInjectionAtMs=0;});await sync(host);await readyTray(host);}await inject(host);assert.equal((await view(host)).controller.remainingDoses,5-i);}
 assert.equal((await view(host)).controller.switchPulled,false);assert.equal((await view(host)).snapshot.phase,'experiment');
 await host.waitForFunction(()=>!document.querySelector('.unleash-switch').disabled);await inject(phone);
 await host.getByRole('button',{name:'Unleash the Creature!',exact:true}).click();await phone.waitForFunction(()=>!document.querySelector('.unleash-switch').disabled);await phone.getByRole('button',{name:'Unleash the Creature!',exact:true}).click();
 await host.getByRole('heading',{name:'Creature released. Prepare for combat!',exact:true}).waitFor();await phone.getByRole('heading',{name:'Creature released. Prepare for combat!',exact:true}).waitFor();
 const frozen=(await record(host)).experiment.frozen;assert.equal(frozen.history.length,7);assert.equal((await view(host)).snapshot.teamScore,0);await a11y(host);await host.screenshot({path:join(artifacts,'frozen-boundary.png'),fullPage:true});
 pass('six browser injections never auto-switch; explicit switches reach one frozen release and the approved Prepare for combat headline with an honest unavailable-combat explanation');
 const publicPages=await Promise.all([page(),page(390),page(768),page()]);
 for(const p of publicPages){const skip=p.getByRole('button',{name:'Skip rehearsal',exact:true});if(await skip.count())await skip.click();await p.getByLabel('Regional pool').selectOption('americas');await p.getByRole('button',{name:'Enter Quick Play',exact:true}).click();}
 await Promise.all(publicPages.map(async p=>{const b=p.getByRole('button',{name:'Ready',exact:true});await b.waitFor();await b.click();}));await Promise.all(publicPages.map(readyTray));
 // Deterministic browser-only lost activation: no intention reaches the app.
 // The helper must recover without ever repeating a submitted injection.
 await publicPages[0].evaluate(()=>document.addEventListener('click',function missOnce(event){if(event.target.closest('.primary-injection')){event.stopImmediatePropagation();document.removeEventListener('click',missOnce,true);window.__mmMissedClick=true;}},true));
 const publicReceipts=await Promise.all(publicPages.map(p=>inject(p)));
 const publicRevision=Math.max(...publicReceipts.map(r=>r.revision));
 await Promise.all(publicPages.map(p=>p.waitForFunction(revision=>window.__mmFrames.some(m=>m.kind==='room-snapshot'&&m.snapshot.revision>=revision&&m.snapshot.players.length===4&&m.snapshot.players.every(p=>p.injectionsThisRound===1)),publicRevision)));
 const publicViews=await Promise.all(publicPages.map(view));assert.equal(new Set(publicViews.map(v=>v.snapshot.roomId)).size,1);
 const publicEvidence=await Promise.all(publicPages.map(p=>p.evaluate(()=>({intents:window.__mmIntents.filter(a=>a.kind==='inject'),receipts:window.__mmFrames.filter(m=>['action-accepted','action-rejected'].includes(m.kind)),status:document.querySelector('.service-status')?.textContent}))));
 assert.equal(await publicPages[0].evaluate(()=>window.__mmMissedClick),true);assert.ok(publicEvidence.every(c=>c.intents.length===1),'each browser must submit exactly one injection, including the missed-click recovery');
 assert.equal(publicViews[0].snapshot.players.length,4);assert.ok(publicViews[0].snapshot.players.every(p=>p.injectionsThisRound===1),JSON.stringify({players:publicViews[0].snapshot.players,controllers:publicViews.map(v=>({playerId:v.controller.playerId,remainingDoses:v.controller.remainingDoses})),clients:publicEvidence}));for(const v of publicViews){assert.equal(v.controller.remainingDoses,5);assert.deepEqual(v.snapshot.creature,publicViews[0].snapshot.creature);}
 await Promise.all(publicPages.map(artMatches));await a11y(publicPages[0]);pass('four real Quick Play browser guests receive private trays and synchronize concurrent public-room injections');
 assert.deepEqual(errors,[]);console.log(`Completed ${passed} DNA browser scenarios and all 30 actual mutation appearances. Screenshots: ${artifacts}. Headless viewport checks do not establish physical-device performance.`);
}finally{await browser?.close();await mf.dispose();await rm(persistence,{recursive:true,force:true});}
