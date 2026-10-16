import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {newRoom,snapshot} from '../src/server/room-model.ts';
const out='docs/battle-v2-phase-d-review/viewport-scroll-fix';
const fixtures=JSON.parse(await readFile('src/assets/battle-v2/fixtures.json','utf8')).fixtures;
const base=snapshot(newRoom('l-layout-study','public','remote','review','key','fingerprint',Date.now()),Date.now());
const evidence={checkedAt:new Date().toISOString(),physicalDevices:false,scope:'Real React Presentation/Chamber/Stage and native Chromium touch scrolling. Isolated public layout fixtures use existing producer timelines; not physical Safari or multiplayer evidence.',touch:[],desktop:[]};
let browser,server;const errors=[];
async function mount(page){
 await page.goto(new URL('/battle-v2',server.resolvedUrls.local[0]).href);await page.locator('.v2-preview').waitFor();
 await page.evaluate(async({base,fixture})=>{
  const React=(await import('/node_modules/.vite/deps/react.js')).default,client=await import('/node_modules/.vite/deps/react-dom_client.js'),{createRoot}=client.default??client,{Presentation}=await import('/src/client/Presentation.tsx');
  document.getElementById('root').style.display='none';const host=document.createElement('div');host.id='viewport-study';document.body.append(host);window.__studyRoot=createRoot(host);
  localStorage.setItem('mm.motion.v1','reduced');
  window.__show=(phase='entry',overflow=false)=>{
   const now=Date.now(),form={...fixture.form,integration:{startsAtMs:now-4200,endsAtMs:now+800}};
   const room=phase==='entry'?null:{...base,phase,creatureName:'Doctor Wobble',battlePresentationVersion:'battle-v2-b2',battlePresentation:{version:'battle-v2-b2',form,arena:'laboratory'},rival:fixture.timeline.rival,battle:phase==='release'?null:{...fixture.timeline,startsAtMs:now-1200},result:null};
   window.__studyRoot.render(React.createElement(React.Fragment,null,React.createElement(Presentation,{now,room,connected:true,displayOnly:false,children:React.createElement('section',{className:'room-panel'},React.createElement('button',{className:'leave-lab',onClick:()=>{window.__leaveClicks=(window.__leaveClicks??0)+1;}},'Leave laboratory'))}),overflow&&React.createElement('div',{'data-scroll-fixture':true,style:{height:'1200px'}},'Test-only overflow to exercise native page panning')));
  };window.__show();
 },{base,fixture:fixtures[0]});
 await page.locator('#viewport-study .chamber-canvas canvas').waitFor();await page.waitForFunction(()=>document.querySelector('#viewport-study .chamber-canvas')?.style.visibility==='visible');
}
async function swipe(page,selector,direction){
 const target=page.locator(`#viewport-study ${selector}`);const bounds=await target.boundingBox(),viewport=page.viewportSize();
 const low=Math.max(35,bounds.y+10),high=Math.min(viewport.height-50,bounds.y+bounds.height-10);assert.ok(high-low>25,JSON.stringify({selector,bounds,viewport}));
 const x=Math.min(viewport.width-25,Math.max(25,bounds.x+bounds.width*.5)),start=direction==='up'?high-5:low+5,end=direction==='up'?Math.max(20,start-150):Math.min(viewport.height-25,start+150),cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:start}]});
 for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:start+(end-start)*i/12}]});await page.waitForTimeout(20);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(300);await cdp.detach();
}
try{
 await mkdir(out,{recursive:true});server=await createServer({server:{host:'127.0.0.1',port:0}});await server.listen();
 browser=await chromium.launch({executablePath:process.env.MM_CHROME_PATH??'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 for(const [label,width,height]of [['phone',390,844],['phone-landscape',844,390],['tablet',768,1024],['tablet-landscape',1366,1024]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await mount(page);
  const canvas=await page.locator('#viewport-study canvas').elementHandle();
  const touchAction=await canvas.evaluate(e=>getComputedStyle(e).touchAction);assert.notEqual(touchAction,'none');
  await page.evaluate(()=>window.__show('entry',true));await page.locator('#viewport-study .chamber-stage').evaluate(e=>window.scrollTo(0,Math.max(60,e.getBoundingClientRect().top+scrollY+e.clientHeight*.35-innerHeight*.45)));await page.waitForTimeout(80);
  const before=await page.evaluate(()=>scrollY);await swipe(page,'.chamber-stage','up');const after=await page.evaluate(()=>scrollY);assert.ok(after>before+50,`${label} chamber swipe up: ${before} -> ${after}`);
  await swipe(page,'.chamber-stage','down');const back=await page.evaluate(()=>scrollY);assert.ok(back<after-50,`${label} chamber swipe down: ${after} -> ${back}`);
  assert.equal(await canvas.evaluate(e=>e===document.querySelector('#viewport-study canvas')),true);assert.equal(await page.locator('#viewport-study canvas').count(),1);await page.screenshot({path:`${out}/${label}-chamber.png`});
  for(const phase of ['release','battle']){
   await page.evaluate(phase=>{window.__show(phase,true);window.scrollTo(0,0);},phase);await page.locator(phase==='release'?'#viewport-study .v2-integration':'#viewport-study .v2-arena').waitFor();await page.waitForTimeout(80);
   const selector=phase==='release'?'.v2-integration':'.v2-arena';const start=await page.evaluate(()=>scrollY);await swipe(page,selector,'up');const scrolled=await page.evaluate(()=>scrollY);assert.ok(scrolled>start+50,`${label} ${phase} up: ${start} -> ${scrolled}`);
   await swipe(page,selector,'down');const reversed=await page.evaluate(()=>scrollY);assert.ok(reversed<scrolled-50,`${label} ${phase} down: ${scrolled} -> ${reversed}`);evidence.touch.push({label,phase,start,scrolled,reversed});
  }
  evidence.touch.push({label,phase:'chamber',touchAction,before,after,back});await page.evaluate(()=>{window.__show('battle');window.scrollTo(0,0);});await page.waitForTimeout(100);await page.screenshot({path:`${out}/${label}-battle.png`});await context.close();
 }
 // Static fallback uses the same pass-through camera; gestures cannot depend on WebGL.
 const fallback=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),staticPage=await fallback.newPage();await staticPage.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=()=>null;});
 await staticPage.goto(new URL('/battle-v2',server.resolvedUrls.local[0]).href);await staticPage.locator('.v2-preview').waitFor();
 // Mount helper expects a canvas, so reuse only its public component setup here.
 await staticPage.evaluate(async()=>{
  const React=(await import('/node_modules/.vite/deps/react.js')).default,client=await import('/node_modules/.vite/deps/react-dom_client.js'),{createRoot}=client.default??client,{Chamber}=await import('/src/client/Chamber.tsx');document.getElementById('root').style.display='none';const host=document.createElement('div');document.body.append(host);host.id='viewport-study';host.className='accepted-injection';host.style.width='340px';createRoot(host).render(React.createElement(Chamber,{creature:null,motion:false}));const extra=document.createElement('div');extra.style.height='1400px';document.body.append(extra);
 });await staticPage.getByText('static graphics fallback',{exact:false}).waitFor();await staticPage.evaluate(()=>window.scrollTo(0,100));await swipe(staticPage,'.chamber-stage','up');assert.ok(await staticPage.evaluate(()=>scrollY)>150);evidence.touch.push({label:'phone-static',scrolled:await staticPage.evaluate(()=>scrollY)});await fallback.close();
 console.log('PASS touch: phone/tablet native swipes in both directions over real chamber, integration and arena, plus static fallback; canvas stays mounted');
 const page=await browser.newPage({viewport:{width:1920,height:1080}});page.on('pageerror',e=>errors.push(e.message));await mount(page);
 for(const [width,height]of [[1920,1080],[2560,720],[1440,900],[1366,768],[1280,600],[1920,480]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>window.__show('entry'));await page.waitForTimeout(50);
  for(const phase of ['release','battle']){
   // Enter at an unchanged viewport; no resize is used to repair the phase transition.
   await page.evaluate(phase=>window.__show(phase),phase);await page.locator('#viewport-study .arena-fullscreen').waitFor();await page.waitForTimeout(100);await page.evaluate(()=>document.fonts.ready);
   const metrics=await page.evaluate(()=>{
    const bound=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};
    const root=document.getElementById('viewport-study'),shell=root.querySelector('.arena-fullscreen'),scene=root.querySelector('.v2-arena,.v2-integration'),svg=root.querySelector('.v2-arena>svg'),matrix=svg?.getScreenCTM(),bottom=svg?new DOMPoint(1200,660).matrixTransform(matrix):null,top=svg?new DOMPoint(0,0).matrixTransform(matrix):null;
    return {shell:bound(shell),scene:bound(scene),controls:[...root.querySelectorAll('.sound-toggle,.leave-lab,.settings summary')].map(bound),health:[...root.querySelectorAll('.v2-health')].map(bound),captions:[...root.querySelectorAll('.v2-captions')].map(bound),world:matrix?{top:{x:top.x,y:top.y},bottom:{x:bottom.x,y:bottom.y},scaleX:matrix.a,scaleY:matrix.d}:null,overflow:document.documentElement.scrollWidth>innerWidth+1};
   });
   assert.ok(!metrics.overflow);assert.ok(metrics.scene.y>=0&&metrics.scene.bottom<=height-1,JSON.stringify({width,height,phase,...metrics}));assert.ok(metrics.scene.width>width*.95);
   for(const b of [...metrics.controls,...metrics.health,...metrics.captions])assert.ok(b.y>=0&&b.bottom<=height+1&&b.right<=width+1,JSON.stringify({width,height,phase,b}));
   if(metrics.world){const w=metrics.world,a=metrics.scene;assert.ok(Math.abs(w.scaleX-w.scaleY)<.00001);assert.ok(w.top.y>=a.y&&w.bottom.y<=a.bottom&&w.top.x>=a.x&&w.bottom.x<=a.right,JSON.stringify({width,height,w,a}));}
   evidence.desktop.push({width,height,phase,...metrics});await page.screenshot({path:`${out}/desktop-${width}x${height}-${phase}.png`});
  }
 }
 await page.getByText('Sound & motion settings',{exact:true}).click();await page.getByRole('button',{name:'Enable sound',exact:true}).waitFor();const settings=await page.locator('#viewport-study .settings[open]').boundingBox();assert.ok(settings.y>=0&&settings.y+settings.height<=480);await page.locator('.leave-lab').click();assert.equal(await page.evaluate(()=>window.__leaveClicks),1);
 await page.setViewportSize({width:1280,height:720});await page.waitForTimeout(100);const resized=await page.locator('#viewport-study .v2-arena').boundingBox();assert.ok(resized.y>=0&&resized.y+resized.height<720);assert.deepEqual(errors,[]);
 console.log('PASS desktop: release/battle immediately fit six wide/short viewports, full SVG world remains uncropped and uniformly scaled, controls/settings work and live resizing stays bounded');
 await writeFile(`${out}/browser-evidence.json`,JSON.stringify(evidence,null,2)+'\n');
}finally{await browser?.close();await server?.close();}
