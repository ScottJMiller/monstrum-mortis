import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {EFFECTS,effectFor,soundFor,effectPlacement} from '../src/client/battle-v2/effects.ts';
import {damageFrame} from '../src/client/battle-v2/damage.ts';
import type {BattleTimeline,BattleEvent} from '../src/shared/types.ts';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8')),sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
const art=read('src/assets/battle-v2/phase-b-art.json'),derivatives=read('assets/battle-v2/phase-b-derivatives.json').records;
test('Phase B has ten distinct five-role sets with untouched masters, uniform within-set scale and actual registration',()=>{
 const hashes=new Set<string>();assert.equal(Object.keys(art.bodies).length,10);
 for(const [body,poses]of Object.entries(art.bodies) as [string,Record<string,any>][]){
  const scales=new Set();for(const role of ['idle','attack','recoil','defense','defeat']){const a=poses[role],r=derivatives.find((x:any)=>x.id===body+'.'+role);assert.equal(sha(r.source),r.sourceSha256);assert.equal(sha(r.runtime),r.sha256);hashes.add(r.sha256);scales.add(r.uniformSetScale);assert.ok(a.width<=720&&a.height<900);for(const key of ['eye','shoulder','pivot'])assert.ok(a[key][0]>=0&&a[key][0]<=a.width&&a[key][1]>=0&&a[key][1]<=a.height);assert.ok(r.crop[2]>50&&r.crop[3]>50);}
  assert.equal(scales.size,1,'Defeat must not scale up to idle height');assert.notDeepEqual(poses.attack.torso,poses.idle.torso,'Torso registration follows actual pose');
 }assert.equal(hashes.size,50,'Do not rename a single static pose as animation');assert.equal(Object.keys(art.arenas).length,2);assert.equal(Object.keys(art.grafts).length,8);for(const r of derivatives){assert.equal(sha(r.runtime),r.sha256);assert.equal(sha(r.source),r.sourceSha256);}
});
test('recorded production prompts/references are present and all selected masters are accounted for',()=>{
 const ledger=read('assets/battle-v2/phase-b-generation.json');const refined=read('assets/battle-v2/family-refinement-generation.json');const serialized=JSON.stringify([ledger,refined]);for(const r of derivatives)assert.ok(serialized.includes(r.source),`${r.source}: provenance`);
 for(const r of [...ledger.sources,...refined.sources]){assert.ok(r.prompt.length>100);assert.equal(sha(r.path),r.sha256);}
});
test('47 Phase B fixtures cover every family/rival with public real timelines and actual timed detachments',()=>{
 const fixtures=read('src/assets/battle-v2/phase-b-fixtures.json').fixtures;assert.equal(fixtures.length,47);assert.equal(new Set(fixtures.slice(0,36).map((f:any)=>f.body+':'+f.timeline.rival.id)).size,36);
 for(const f of fixtures){assert.match(f.label,/Legal server fixture/);assert.ok(!JSON.stringify(f.timeline).includes('"seed"'));assert.ok(f.timeline.events.length>1);assert.ok(f.timeline.durationMs<=30000);assert.equal(f.body,f.form.family==='blob'?'blob':`family-${f.form.family}`);for(let i=1;i<f.timeline.events.length;i++)assert.ok(f.timeline.events[i].offsetMs>=f.timeline.events[i-1].offsetMs);}
 const t=fixtures.at(-1).timeline as BattleTimeline;
 assert.equal(t.events.find(e=>e.kind==='detach'&&e.mutationId==='candle-flesh')?.offsetMs,12000);assert.equal(t.events.find(e=>e.kind==='detach'&&e.mutationId==='porcelain-teeth')?.offsetMs,18000);
 assert.equal(damageFrame(t,11999,'team').limbLost,false);assert.equal(damageFrame(t,12000,'team').limbLost,true);assert.equal(damageFrame(t,18000,'team').teethLost,true);assert.equal(damageFrame(t,29999,'team').teethLost,true);
});
test('every current producer event has a finished bounded effect/cue; shard retaliation is source-aware and directional',()=>{
 const sounds=read('src/assets/battle-v2/audio.json');assert.equal(Object.keys(sounds).length,24);const fixtures=read('src/assets/battle-v2/phase-b-fixtures.json').fixtures;
 for(const f of fixtures)for(const e of f.timeline.events as BattleEvent[]){const id=effectFor(e),fx=EFFECTS[id];assert.equal(fx.status,'ready');assert.ok(fx.duration<=900);assert.ok(soundFor(e)===null||soundFor(e) in sounds);assert.equal(effectPlacement(e).direction,e.actor==='team'?1:-1);}
 const e={...fixtures[0].timeline.events[0],kind:'attack',mutationId:'porcelain-teeth',caption:'The porcelain shards punish contact.',actor:'team',target:'rival'} as BattleEvent;
 assert.equal(effectFor(e),'retaliation');assert.equal(soundFor(e),null);assert.equal(effectPlacement(e).side,'team');assert.equal(soundFor({...e,mutationId:'barbed-hide'}),'retaliation');for(const id of ['poison','bleed','crawling']as const)assert.equal(EFFECTS[id].major,false);
});
test('supplied Phase B audio retains originals and bounded AAC derivatives with decoded headroom',()=>{
 const p=read('assets/battle-v2/phase-b-audio-provenance.json');assert.equal(p.records.length,10);assert.equal(sha(p.productionScript),p.scriptSha256);let total=0,original=0;
 for(const r of p.records){assert.equal(sha(r.source),r.sourceSha256);assert.equal(sha(r.path),r.sha256);assert.equal(sha(r.submittedSource.replace('docs/battle-v2-phase-b-review/','docs/archive/battle-v2/battle-v2-phase-b-review/')),r.sourceSha256);assert.equal(readFileSync(r.path).subarray(4,8).toString(),'ftyp');assert.ok(r.durationSeconds<10);assert.ok(r.encodedLevels.peakDbFS<-3);total+=r.bytes;original+=r.sourceBytes;}
 assert.ok(total<300000);assert.ok(total<original*.15);
});
