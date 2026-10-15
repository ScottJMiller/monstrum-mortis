import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright-core';
import {createServer} from 'vite';
const out=resolve(process.env.MM_BATTLE_V2_REFINEMENT_DIR??'docs/battle-v2-phase-b-review/refinement-2026-10-14/timeout-winner');await mkdir(out,{recursive:true});
let browser,server;const evidence={physicalDevices:false,scope:'Local Chrome actual decode/render/playback; no subjective listening claim'},errors=[];
async function select(page,label,value){await page.getByLabel(label,{exact:true}).selectOption(String(value));await page.waitForTimeout(40);}
async function seek(page,time){await page.getByLabel('Recording time',{exact:true}).evaluate((e,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,String(v));e.dispatchEvent(new Event('input',{bubbles:true}));},time);await page.waitForTimeout(40);}
try{
 server=await createServer({server:{host:'127.0.0.1',port:0}});await server.listen();const url=new URL('/battle-v2',server.resolvedUrls.local[0]).href;
 browser=await chromium.launch({executablePath:process.env.MM_CHROME_PATH??'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],ignoreDefaultArgs:['--mute-audio']});const page=await browser.newPage({viewport:{width:1280,height:1000}});page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.getByRole('heading',{name:'The integration theatre'}).waitFor();await page.getByLabel('Decorative motion',{exact:true}).uncheck();
 // Actual decoded alpha must contain one body, not an adjacent-sheet fragment.
 evidence.rivalComponents=await page.evaluate(async()=>{const {BODY_ART,RIVAL_BODIES}=await import('/src/client/battle-v2/art.ts');const results=[];for(const body of RIVAL_BODIES)for(const [pose,a]of Object.entries(BODY_ART[body])){const i=new Image();i.src=a.url;await i.decode();const canvas=document.createElement('canvas');canvas.width=a.width;canvas.height=a.height;const ctx=canvas.getContext('2d');ctx.drawImage(i,0,0);const p=ctx.getImageData(0,0,a.width,a.height).data,seen=new Uint8Array(a.width*a.height),areas=[];for(let at=0;at<seen.length;at++)if(!seen[at]&&p[at*4+3]>5){let count=0,stack=[at];seen[at]=1;while(stack.length){const q=stack.pop(),x=q%a.width,y=Math.floor(q/a.width);count++;for(const n of [x>0?q-1:-1,x<a.width-1?q+1:-1,y>0?q-a.width:-1,y<a.height-1?q+a.width:-1,x>0&&y>0?q-a.width-1:-1,x<a.width-1&&y>0?q-a.width+1:-1,x>0&&y<a.height-1?q+a.width-1:-1,x<a.width-1&&y<a.height-1?q+a.width+1:-1])if(n>=0&&!seen[n]&&p[n*4+3]>5){seen[n]=1;stack.push(n);}}if(count>100)areas.push(count);}results.push({body,pose,areas});}return results;});
 for(const r of evidence.rivalComponents)assert.equal(r.areas.length,1,`${r.body}.${r.pose}: detached neighboring artwork`);
 console.log('PASS 1: actual decoded alpha verifies all 30 rival poses contain one coherent figure');
 await select(page,'Study','poses');await select(page,'Player art','family-3');await select(page,'Rival art','carrion-duke');await select(page,'Modifier fixture',0);await page.locator('.v2-pose-study').screenshot({path:join(out,'opponent-after.png')});await page.getByLabel('Mirror anatomy (words stay readable)',{exact:true}).check();await page.locator('.v2-pose-study').screenshot({path:join(out,'opponent-mirrored.png')});await page.getByLabel('Mirror anatomy (words stay readable)',{exact:true}).uncheck();
 await select(page,'Study','battle');await select(page,'Player art','selected');await select(page,'Rival art','timeline');await page.getByRole('button',{name:'Enable sound',exact:true}).click();await page.waitForFunction(()=>window.__battleV2Audio.buffers.size===24);
 const fixtures=JSON.parse(await readFile('src/assets/battle-v2/phase-b-fixtures.json','utf8')).fixtures;
 const candidate=fixtures.findIndex(f=>f.timeline.events.some((e,i,es)=>e.kind==='regeneration'&&es.some(v=>v.kind==='regeneration'&&v.target===e.target&&v.offsetMs===e.offsetMs+1000)));
 assert.ok(candidate>=0);const f=fixtures[candidate],first=f.timeline.events.find(e=>e.kind==='regeneration');await select(page,'Timeline fixture',11+candidate);
 await page.evaluate(()=>{const a=window.__battleV2Audio,original=a.play.bind(a);window.__heard=[];a.play=name=>{window.__heard.push(name);original(name);};});await seek(page,5000+first.offsetMs-100);await page.getByRole('button',{name:'Play recording',exact:true}).click();await page.waitForTimeout(1550);await page.getByRole('button',{name:'Pause recording',exact:true}).click();evidence.onsetPlayback=await page.evaluate(()=>window.__heard);assert.equal(evidence.onsetPlayback.filter(n=>n==='regeneration').length,1,'Consecutive healing ticks must produce only the onset cue');
 await seek(page,5000+first.offsetMs+950);await page.evaluate(()=>window.__heard=[]);await page.getByRole('button',{name:'Play recording',exact:true}).click();await page.waitForTimeout(300);await page.getByRole('button',{name:'Pause recording',exact:true}).click();assert.equal(await page.evaluate(()=>window.__heard.filter(n=>n==='regeneration').length),0,'Seeking into an active healing episode must not replay it');
 console.log('PASS 2: real producer healing plays once at onset and stays silent through ticks/seeking');
 await select(page,'Timeline fixture',57);await seek(page,23000);await page.locator('.v2-battle').screenshot({path:join(out,'damage-text-after.png')});await seek(page,5000+fixtures[46].timeline.durationMs);assert.equal(await page.locator('.v2-impact,.v2-word:not(.v2-final-word),.v2-compact span').count(),0);assert.equal(await page.locator('[data-fighter="team"] .v2-sprite [data-jaw-wound]').count(),0);await page.locator('.v2-battle').screenshot({path:join(out,'battle-ended.png')});
 console.log('PASS 3: terminal cleanup keeps health and text damage with intact artwork');

 const core=JSON.parse(await readFile('src/assets/battle-v2/fixtures.json','utf8')).fixtures;
 evidence.terminalViews=[];
 for(const [name,width,height,reduce]of [['desktop',1280,1000,false],['phone',390,844,false],['landscape',844,390,false],['reduced',390,844,true]]){
  await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:reduce?'reduce':'no-preference'});await select(page,'Timeline fixture',0);const end=core[0].timeline.durationMs;
  await seek(page,5000+end-3010);assert.equal(await page.locator('.v2-countdown').count(),0);
  for(const [offset,number]of [[3000,3],[2000,2],[1000,1]]){await seek(page,5000+end-offset);assert.equal(await page.locator('.v2-countdown').count(),1);assert.equal(await page.locator('.v2-countdown').textContent(),String(number));const counter=await page.locator('.v2-countdown').boundingBox(),arena=await page.locator('.v2-arena').boundingBox();assert.ok(Math.abs(counter.x+counter.width/2-arena.x-arena.width/2)<1);assert.ok(counter.y>=arena.y&&counter.y+counter.height<arena.y+arena.height/2);await page.locator('.v2-battle').screenshot({path:join(out,`countdown-${name}-${number}.png`)});}
  await seek(page,5000+end);assert.equal(await page.locator('.v2-countdown,.v2-impact,.v2-compact span').count(),0);assert.equal(await page.locator('.v2-word').count(),1);const final=page.locator('.v2-final-word');const text=await page.locator('.v2-final-title').textContent(),box=await final.boundingBox(),arena=await page.locator('.v2-arena').boundingBox();const style=await final.evaluate(e=>({matrix:getComputedStyle(e).transform,font:getComputedStyle(e).fontFamily,size:parseFloat(getComputedStyle(e).fontSize)}));assert.match(style.matrix,/^matrix\(1, 0, 0, 1,/);assert.match(style.font,/New Rocker/);assert.ok(Math.abs(box.x+box.width/2-arena.x-arena.width/2)<1);assert.ok(Math.abs(box.y+box.height/2-arena.y-arena.height/2)<1);assert.ok(box.x>=arena.x&&box.x+box.width<=arena.x+arena.width);assert.ok(box.y>=arena.y&&box.y+box.height<=arena.y+arena.height);assert.ok(['CEASED!','DEFEAT!'].includes(text));await page.locator('.v2-battle').screenshot({path:join(out,`final-${name}.png`)});
  await seek(page,5000+end-500);await seek(page,5000+end);assert.equal(await page.locator('.v2-final-title').textContent(),text);evidence.terminalViews.push({name,text,fontSize:style.size});
 }
 await select(page,'Timeline fixture',10);await seek(page,5000+core[10].timeline.durationMs);assert.ok(['ROUND OVER','YOUR TIME IS UP'].includes(await page.locator('.v2-final-title').textContent()));await page.locator('.v2-battle').screenshot({path:join(out,'final-timeout-phone.png')});
 console.log('PASS 4: exact 3/2/1 boundaries, centered top counter and larger stable unrotated terminal lettering on desktop/phone/landscape/reduced');
 await page.setViewportSize({width:1280,height:1000});await page.emulateMedia({reducedMotion:'no-preference'});evidence.shieldPresentations=0;
 const playerBodies=['family-1','family-2','family-3','family-4','family-5','blob'],rivalBodies=['iron-widow','gutter-seraph','carrion-duke','coil-saint','maw-engine','the-unfinished'];
 for(let i=0;i<6;i++){
  await select(page,'Player art',playerBodies[i]);await select(page,'Rival art',rivalBodies[i]);
  for(const [fixtureIndex,time,id]of [[2,6200,'block'],[9,13400,'retaliation'],[9,14300,'retaliation']]){
   await select(page,'Timeline fixture',fixtureIndex);await seek(page,time);
   for(const shield of await page.locator(`[data-effect="${id}"]`).all()){
    const side=await shield.getAttribute('data-side'),dir=await shield.getAttribute('data-direction'),edge=Number(await shield.getAttribute('data-shield-edge')),transform=await shield.getAttribute('transform'),x=Number(transform.match(/translate\(([^ ]+)/)[1]);assert.equal(dir,side==='team'?'1':'-1');assert.ok(side==='team'?x>edge:x<edge);const artWidth=await page.evaluate(async id=>(await import('/src/client/battle-v2/effects.ts')).EFFECTS[id].art.width,id);assert.ok(Math.abs(Math.abs(x-edge)-artWidth/2-12)<.001);evidence.shieldPresentations++;
   }
   await page.locator('.v2-battle').screenshot({path:join(out,`shield-${i}-${id}-${time}.png`)});
  }
 }
 const gains=await page.evaluate(()=>{const a=window.__battleV2Audio,c=a.context,original=c.createGain.bind(c),nodes=[];c.createGain=()=>{const g=original();nodes.push(g);return g;};try{a.silence();a.play('recoil');return nodes.at(-1).gain.value;}finally{c.createGain=original;a.silence();}});assert.ok(Math.abs(gains-.18*1.15*.9)<1e-6);evidence.recoilGain=gains;
 console.log('PASS 5: defender-facing shields across all twelve bodies retain actor orientation and close gaps; actual recoil voice amplitude reduced 10%');
 // Test the real Stage with isolated public timeline snapshots; these are labeled
 // choreography fixtures, not new server outcomes or production debug routes.
 evidence.timeoutWinners=[];evidence.blockedStrikes=[];
 async function renderStage(options){await page.evaluate(async({core,options})=>{
  const React=(await import('/node_modules/.vite/deps/react.js')).default;
  const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
  const {Stage}=await import('/src/client/battle-v2/Stage.tsx');
  if(!window.__refinementRoot){const host=document.createElement('div');host.id='refinement-stage';document.body.prepend(host);window.__refinementRoot=createRoot(host);}
  const source=core[10],base=source.timeline.events[0];
  const timeline={...source.timeline,battleId:'isolated-refinement-study',durationMs:5000,events:options.events??[{...base,kind:options.kind??'timeout',offsetMs:5000,teamHealth:options.teamHealth,rivalHealth:options.rivalHealth}]};
  window.__refinementRoot.render(React.createElement(Stage,{timeline,form:source.form,time:options.time??5000,motion:options.motion??true}));
 },{core,options});await page.waitForTimeout(100);}
 const sample=page.locator('#refinement-stage');
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:1000});
  for(const [teamHealth,rivalHealth,label]of [[60,20,'Our specimen wins'],[20,60,`${core[10].timeline.rival.name} wins`],[50,50,'Draw']]){
   await renderStage({teamHealth,rivalHealth,motion:width!==390});
   const winner=sample.locator('.v2-timeout-winner');assert.equal(await winner.textContent(),label);
   const metrics=await winner.evaluate(e=>{const s=getComputedStyle(e),title=getComputedStyle(e.previousElementSibling);return {font:s.fontFamily,size:parseFloat(s.fontSize),titleSize:parseFloat(title.fontSize)};});
   assert.match(metrics.font,/New Rocker/);assert.ok(metrics.size>=18&&metrics.size<metrics.titleSize);
   const box=await winner.boundingBox(),arena=await sample.locator('.v2-arena').boundingBox(),title=await sample.locator('.v2-final-title').boundingBox();
   assert.ok(box.y>=title.y+title.height);assert.ok(Math.abs(box.x+box.width/2-arena.x-arena.width/2)<1);assert.ok(box.y+box.height<=arena.y+arena.height);
   await sample.screenshot({path:join(out,`timeout-${width}-${teamHealth}-${rivalHealth}.png`)});evidence.timeoutWinners.push({width,label,...metrics});
  }
 }
 await renderStage({teamHealth:0,rivalHealth:50,kind:'knockout'});assert.equal(await sample.locator('.v2-timeout-winner').count(),0);
 await renderStage({teamHealth:60,rivalHealth:20,time:4999});assert.equal(await sample.locator('.v2-timeout-winner').count(),0);
 await page.setViewportSize({width:1280,height:1000});
 const base=core[9].timeline.events.find(e=>e.kind==='attack'&&/strike/i.test(e.caption))??core[9].timeline.events[0];
 for(const actor of ['team','rival'])for(const blocked of [false,true]){
  const target=actor==='team'?'rival':'team',strike={...base,kind:'attack',caption:'An ordinary strike connects.',sequence:1,offsetMs:1200,actor,target,mutationId:null,magnitude:5,teamHealth:90,rivalHealth:80};
  const events=[strike,...(blocked?[{...strike,sequence:2,kind:'block',actor:target,target,magnitude:2,caption:'Armor absorbs part of the blow.'}]:[])];
  await renderStage({events,time:1200});assert.equal(await sample.locator('[data-effect="strike"]').count(),blocked?0:1);assert.equal(await sample.locator('[data-effect="block"]').count(),blocked?1:0);
  assert.equal(await sample.locator(`[data-fighter="${actor}"]`).getAttribute('data-pose'),'attack');assert.match(await sample.locator('.v2-captions').textContent(),/strike connects/);
  await sample.screenshot({path:join(out,`strike-${actor}-${blocked?'blocked':'unblocked'}.png`)});evidence.blockedStrikes.push({actor,blocked});
 }
 console.log('PASS 6: timeout-only winner/draw line fits desktop and reduced-motion phone in New Rocker; both blocked directions suppress strike SVG and preserve shields, attack poses and captions');
 await page.evaluate(()=>{window.__refinementRoot.unmount();document.getElementById('refinement-stage').remove();});
 assert.deepEqual(errors,[]);evidence.scenarios=6;await writeFile(join(out,'refinement-evidence.json'),JSON.stringify(evidence,null,2)+'\n');
}finally{await browser?.close();await server?.close();}
