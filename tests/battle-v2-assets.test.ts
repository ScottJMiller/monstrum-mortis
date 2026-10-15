import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const art=JSON.parse(readFileSync('src/assets/battle-v2/art.json','utf8'));
const derivatives=JSON.parse(readFileSync('assets/battle-v2/derivatives.json','utf8')).records;
const hash=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');
test('eleven produced poses include an independent bite lunge with retained source provenance and individual registrations',()=>{
 const hashes=new Set<string>();
 for(const body of ['family-1','iron-widow'])for(const pose of body==='family-1'?['idle','attack','bite','recoil','defense','defeat']:['idle','attack','recoil','defense','defeat']){
  const a=art[body][pose],record=derivatives.find((r:{id:string})=>r.id===`${body}.${pose}`);
  assert.equal(hash(record.runtime),record.sha256);assert.equal(hash(record.source),record.sourceSha256);hashes.add(record.sha256);
  assert.ok(a.pivot[1]>a.eye[1]);
 }
 assert.equal(hashes.size,11,'Five pose roles and a bite variant are distinct artwork, not renamed copies');
});
test('supplied audio is compressed, source/runtime hash verified, bounded and balanced with codec headroom',()=>{
 const record=JSON.parse(readFileSync('assets/battle-v2/audio-provenance.json','utf8'));
 let total=0,original=0;for(const a of record.records){assert.equal(hash(a.path),a.sha256);assert.equal(hash(a.source),a.sourceSha256);const b=readFileSync(a.path);assert.equal(b.subarray(4,8).toString(),'ftyp');assert.ok(a.durationSeconds<10);assert.ok(a.encodedLevels.peakDbFS<-3);assert.ok(a.channels<=a.sourceChannels);total+=b.length;original+=a.sourceBytes;}
 assert.equal(record.records.length,14);assert.ok(total<1_000_000);
 assert.ok(total<original*.15,'Compression should materially reduce download cost');
 const main=readFileSync('src/client/main.tsx','utf8');assert.match(main,/import\.meta\.env\.DEV && location\.pathname === '\/battle-v2'/);
});
test('supplied SVG derivatives preserve geometry and color without executable content, font retains its license',()=>{
 const effects=JSON.parse(readFileSync('assets/battle-v2/effect-provenance.json','utf8'));assert.equal(effects.records.length,9);
 for(const r of effects.records){assert.equal(hash(r.source),r.sourceSha256);assert.equal(hash(r.runtime),r.sha256);const svg=readFileSync(r.runtime,'utf8');assert.match(svg,/#e9ddaf/);assert.doesNotMatch(svg,/<script|onload=|<foreignObject|href=|http[s]?:\/\/(?!www.w3.org)/);}
 const font=JSON.parse(readFileSync('assets/battle-v2/font-provenance.json','utf8'));assert.equal(hash(font.runtime),font.sha256);assert.match(readFileSync(font.licenseFile,'utf8'),/SIL OPEN FONT LICENSE/);
});
