import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
import {createServer} from 'vite';
const out='docs/battle-v2-phase-d-review/audio-lettering-fix';
const evidence={checkedAt:new Date().toISOString(),physicalDevices:false,scope:'Local Chromium trusted touch/mouse input, native AAC decode/audio graph and actual React Stage. Strict activation emulation is not Safari hardware.',audio:[],lettering:[]};
let server,browser;const errors=[];
try{
 await mkdir(out,{recursive:true});server=await createServer({server:{host:'127.0.0.1',port:0}});await server.listen();
 browser=await chromium.launch({executablePath:process.env.MM_CHROME_PATH??'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=user-gesture-required'],ignoreDefaultArgs:['--mute-audio']});
 for(const [device,width,height,touch]of [['phone',390,844,true],['tablet',768,1024,true],['desktop',1280,900,false]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.__gesture=null;window.__attempts=[];window.__starts=0;window.__decodes=0;window.__sessionTypes=[];
   for(const type of ['pointerdown','pointerup','touchend','keydown','click'])window.addEventListener(type,event=>{window.__gesture={type,trusted:event.isTrusted};setTimeout(()=>{if(window.__gesture?.type===type)window.__gesture=null;},0);},true);
   Object.defineProperty(navigator,'audioSession',{configurable:true,value:{set type(value){window.__sessionTypes.push(value);}}});
   const NativeAudio=AudioContext;window.AudioContext=class extends NativeAudio{
    get state(){return this.__unlocked?super.state:'suspended';}
    constructor(...args){super(...args);window.__context=this;}
    resume(){const e=window.__gesture,allowed=e?.trusted&&['touchend','click','keydown'].includes(e.type);window.__attempts.push({type:e?.type??'none',allowed});if(!allowed)return new Promise(()=>{});this.__unlocked=true;return super.resume();}
    decodeAudioData(...args){window.__decodes++;return super.decodeAudioData(...args);}
    createBufferSource(){const source=super.createBufferSource(),start=source.start.bind(source);source.start=(...args)=>{window.__starts++;return start(...args);};return source;}
    createMediaStreamDestination(){const node=super.createMediaStreamDestination();window.__capture=node;return node;}
   };
  });
  await page.goto(new URL('/battle-v2',server.resolvedUrls.local[0]).href);await page.getByRole('heading',{name:'The integration theatre'}).waitFor();
  await page.evaluate(async()=>{
   const React=(await import('/node_modules/.vite/deps/react.js')).default,client=await import('/node_modules/.vite/deps/react-dom_client.js'),{createRoot}=client.default??client,{Presentation}=await import('/src/client/Presentation.tsx');
   document.getElementById('root').style.display='none';const host=document.createElement('div');document.body.append(host);window.__testRoot=createRoot(host);
   window.__testRoot.render(React.createElement(Presentation,{room:null,connected:false,displayOnly:false,children:React.createElement('button',{id:'gesture-test'},'Enter laboratory')}));
  });
  const button=page.locator('#gesture-test');await button.waitFor();assert.equal(await page.evaluate(()=>typeof window.__context),'undefined');
  if(touch)await button.tap();else await button.click();
  await page.waitForFunction(()=>window.__starts===1&&window.__decodes===24);
  const metric=await page.evaluate(async()=>{
   const c=window.__context,source=c.createMediaStreamSource(window.__capture.stream),analyser=c.createAnalyser();source.connect(analyser);
   const samples=new Float32Array(analyser.fftSize);let peak=0;for(let i=0;i<15;i++){await new Promise(r=>setTimeout(r,50));analyser.getFloatTimeDomainData(samples);peak=Math.max(peak,...samples.map(Math.abs));}source.disconnect();analyser.disconnect();
   return {attempts:window.__attempts,decodes:window.__decodes,starts:window.__starts,sessionTypes:window.__sessionTypes,peak,state:c.state};
  });
  assert.equal(metric.state,'running');assert.equal(metric.attempts.filter(e=>!e.allowed).length,0);assert.ok(metric.sessionTypes.includes('playback'));assert.ok(metric.peak>.00001,JSON.stringify(metric));
  await page.locator('.sound-toggle').click();assert.equal(await page.locator('.sound-toggle').textContent(),'Sound muted');await page.locator('.sound-toggle').click();assert.equal(await page.locator('.sound-toggle').textContent(),'Sound on');assert.equal(await page.evaluate(()=>window.__decodes),24);
  evidence.audio.push({device,...metric});console.log(`PASS audio ${device}: real ${touch?'touch':'mouse'} unlock, 24 AAC samples, audible PCM energy and independent mute`);
  await page.evaluate(()=>window.__testRoot.unmount());assert.equal(await page.evaluate(()=>window.__context.__unlocked&&window.__context.state),'closed');await context.close();
 }
 const page=await browser.newPage({viewport:{width:1920,height:1080}});page.on('pageerror',e=>errors.push(e.message));await page.goto(new URL('/battle-v2',server.resolvedUrls.local[0]).href);await page.locator('.v2-preview').waitFor();
 const core=JSON.parse(await readFile('src/assets/battle-v2/fixtures.json','utf8')).fixtures;
 await page.evaluate(async core=>{
  const React=(await import('/node_modules/.vite/deps/react.js')).default,client=await import('/node_modules/.vite/deps/react-dom_client.js'),{createRoot}=client.default??client,{Stage}=await import('/src/client/battle-v2/Stage.tsx'),{letteringFor}=await import('/src/client/battle-v2/effects.ts');
  document.getElementById('root').style.display='none';const host=document.createElement('div');host.id='layout-test';host.style.margin='auto';document.body.append(host);window.__layoutRoot=createRoot(host);
  window.__renderLayout=(phrase,width,height,kind='timeout',winner=true)=>{
   host.style.width=`${width}px`;const source=core[10],event={...source.timeline.events[0],sequence:1,kind,offsetMs:5000,teamHealth:60,rivalHealth:20};
   let battleId='';for(let i=0;i<1000;i++){battleId=`layout-${i}`;if(letteringFor(battleId,event)===phrase)break;}
   const timeline={...source.timeline,battleId,durationMs:5000,events:[event]};
   // Isolated public terminal snapshots test typography, not new server outcomes.
   document.getElementById('layout-size')?.remove();const style=document.createElement('style');style.id='layout-size';style.textContent=`#layout-test .v2-arena{height:${height}px;min-height:0;max-height:none}#layout-test .v2-arena>svg{position:absolute;inset:0;height:100%}`;document.head.append(style);
   window.__layoutRoot.render(React.createElement(Stage,{key:phrase+width+height+kind+winner,timeline,form:source.form,time:5000,motion:false,outcome:winner?'victory':null,creatureName:'Professor Quiverworth the Unreasonably Persistent'}));
  };
 },core);
 for(const [label,viewport,width,height]of [['wide-desktop',1920,1550,680],['desktop-panel',1920,640,352],['desktop-short',1280,800,200],['phone',390,360,480],['landscape',844,800,195],['tablet',768,710,620],['compact-results',390,350,200],['large-text',1280,560,260]]){
  await page.setViewportSize({width:viewport,height:1000});await page.emulateMedia({reducedMotion:label==='phone'?'reduce':'no-preference'});
  for(const phrase of ['ROUND OVER','YOUR TIME IS UP','CEASED!','DEFEAT!']){
   await page.evaluate(({phrase,width,height})=>window.__renderLayout(phrase,width,height,phrase.includes('!')?'knockout':'timeout'),{phrase,width,height});await page.locator('#layout-test .v2-final-word').waitFor();await page.evaluate(()=>document.fonts.ready);
   if(label==='desktop-panel'&&phrase==='YOUR TIME IS UP'){
    // Reproduce the old viewport-based CSS on the same real Stage for comparison.
    await page.addStyleTag({content:'#layout-test .v2-final-word{font-size:144px!important;white-space:normal!important}#layout-test .v2-final-title{width:auto!important;white-space:normal!important}#layout-test .v2-timeout-winner{font-size:38px!important;width:auto!important;white-space:normal!important}'});
    await page.locator('#layout-test').screenshot({path:`${out}/before-long-timeout.png`});
    await page.evaluate(()=>{for(const style of document.querySelectorAll('style'))if(style.textContent.includes('font-size:144px!important'))style.remove();});
   }
   await page.waitForTimeout(80);
   const measured=await page.locator('#layout-test .v2-final-word').evaluate(node=>{
    const a=node.parentElement.getBoundingClientRect(),b=node.getBoundingClientRect();return {arena:{width:a.width,height:a.height},font:parseFloat(getComputedStyle(node).fontSize),centered:Math.abs((b.left+b.right-a.left-a.right)/2)<1&&Math.abs((b.top+b.bottom-a.top-a.bottom)/2)<1,children:Array.from(node.children,e=>{const r=e.getBoundingClientRect();return {text:e.textContent,font:parseFloat(getComputedStyle(e).fontSize),width:r.width,height:r.height,inside:r.left>=a.left+4&&r.right<=a.right-4&&r.top>=a.top&&r.bottom<=a.bottom};})};
   });
   assert.ok(measured.centered);assert.ok(measured.children.every(c=>c.inside),JSON.stringify({label,phrase,...measured}));assert.equal(measured.children[0].text,phrase);if(measured.children[1])assert.ok(measured.children[1].font>=18);if(phrase.includes('!'))assert.equal(measured.children.length,1);
   evidence.lettering.push({label,phrase,...measured});if(phrase==='YOUR TIME IS UP')await page.locator('#layout-test').screenshot({path:`${out}/after-${label}.png`});
  }
 }
 // Resize an already-mounted terminal frame; font readiness and resize observers
 // must fit it without remounting playback or selecting another word.
 await page.evaluate(()=>window.__renderLayout('YOUR TIME IS UP',1000,500));await page.waitForTimeout(50);await page.locator('#layout-test').evaluate(e=>e.style.width='330px');await page.waitForTimeout(100);
 const resized=await page.locator('#layout-test .v2-final-title').evaluate(e=>({width:e.getBoundingClientRect().width,arena:e.closest('.v2-arena').clientWidth}));assert.ok(resized.width<resized.arena);assert.deepEqual(errors,[]);
 console.log(`PASS lettering: ${evidence.lettering.length} phrase/layout cases plus live resize; actual glyph bounds, centering and timeout-only winner`);
 await writeFile(`${out}/browser-evidence.json`,JSON.stringify(evidence,null,2)+'\n');
}finally{await browser?.close();await server?.close();}
