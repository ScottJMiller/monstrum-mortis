import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {runtime} from './support/combat-runtime.mjs';
const out='docs/battle-v2-phase-d-review/lan-http',h=await runtime(),errors=[];let browser;
const evidence={scope:'Real production build and local SQLite/network clients on an insecure HTTP hostname mapped to loopback. Native browser crypto availability is not mocked. Chromium phone viewport, NOT physical iPhone or Safari.',physicalDevices:false,scenarios:[]};
try{
 await mkdir(out,{recursive:true});
 browser=await chromium.launch({executablePath:process.env.MM_CHROME_PATH??'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--no-proxy-server','--host-resolver-rules=MAP mm-lan.test 127.0.0.1']});
 const origin=new URL(h.origin);origin.hostname='mm-lan.test';
 async function page(url=origin.href){const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await p.getByRole('heading',{name:'Monstrum Mortis',exact:true}).first().waitFor();if(await p.locator('dialog[open]').count())await p.getByRole('button',{name:'Enter laboratory',exact:true}).click();await p.getByRole('button',{name:'Enter Quick Play',exact:true}).waitFor();return p;}
 const host=await page(),cryptoState=await host.evaluate(()=>({secure:isSecureContext,randomUUID:typeof crypto.randomUUID,getRandomValues:typeof crypto.getRandomValues}));
 assert.deepEqual(cryptoState,{secure:false,randomUUID:'undefined',getRandomValues:'function'});evidence.crypto=cryptoState;
 await host.getByLabel('Player Name',{exact:true}).fill('LAN Host');await host.getByRole('button',{name:'Create Private Laboratory',exact:true}).click();await host.locator('.room-panel').waitFor();
 const roomId=await host.evaluate(()=>JSON.parse(sessionStorage.getItem('mm.room.v2')).roomId),peer=await page();await peer.getByLabel('Player Name',{exact:true}).fill('LAN Peer');await peer.getByLabel('Invitation code',{exact:true}).fill(roomId);await peer.getByRole('button',{name:'Join by Code',exact:true}).click();await peer.locator('.connection-badge.online').waitFor();
 await host.getByRole('button',{name:'Copy player invitation link',exact:true}).click();await host.getByText('Select the link below to copy it manually.',{exact:true}).waitFor();
 await host.reload();await host.locator('.connection-badge.online').waitFor();assert.equal(await host.evaluate(()=>JSON.parse(sessionStorage.getItem('mm.room.v2')).roomId),roomId);
 await host.screenshot({path:`${out}/private-phone.png`,fullPage:true});
 for(const p of [peer,host]){await p.getByRole('button',{name:'Leave laboratory',exact:true}).click();await p.locator('.room-panel').waitFor({state:'detached'});}
 await host.getByLabel('Player Name',{exact:true}).fill('LAN Host Again');await host.getByRole('button',{name:'Create Private Laboratory',exact:true}).click();await host.locator('.room-panel').waitFor();await host.getByRole('button',{name:'Leave laboratory',exact:true}).click();await host.locator('.room-panel').waitFor({state:'detached'});
 evidence.scenarios.push('HTTP startup, private create/join, synchronized sockets, clipboard fallback, credential reload and leave/create with fresh replay keys');console.log(`PASS 1: ${evidence.scenarios.at(-1)}`);
 const queued=await Promise.all(Array.from({length:4},()=>page()));
 await Promise.all(queued.map(p=>p.getByRole('button',{name:'Enter Quick Play',exact:true}).click()));
 await Promise.all(queued.map(async p=>{const ready=p.getByRole('button',{name:'Ready',exact:true});await ready.waitFor({timeout:15000});await ready.click();await p.locator('.room-panel').waitFor({timeout:15000});}));
 const rooms=await Promise.all(queued.map(p=>p.evaluate(()=>JSON.parse(sessionStorage.getItem('mm.room.v2')).roomId)));assert.equal(new Set(rooms).size,1);
 await queued[0].screenshot({path:`${out}/public-phone.png`,fullPage:true});evidence.scenarios.push('Four independent HTTP Quick Play clients issue guests/tickets, confirm readiness and receive one public room');console.log(`PASS 2: ${evidence.scenarios.at(-1)}`);
 const native=await page(String(h.origin));assert.equal(await native.evaluate(()=>typeof crypto.randomUUID),'function');await native.getByLabel('Player Name',{exact:true}).fill('Native UUID');await native.getByRole('button',{name:'Create Private Laboratory',exact:true}).click();await native.locator('.room-panel').waitFor();evidence.scenarios.push('Trusted loopback native-randomUUID path still creates a room');console.log(`PASS 3: ${evidence.scenarios.at(-1)}`);
 assert.deepEqual(errors,[]);evidence.status='passed';await writeFile(`${out}/browser-evidence.json`,JSON.stringify(evidence,null,2)+'\n');console.log('All three LAN/browser regressions passed. No physical-device or HTTPS/deployment claim.');
}finally{await browser?.close();await h.close();}
