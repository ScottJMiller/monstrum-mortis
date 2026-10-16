import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import clues from '../src/assets/specimen-clues.json' with {type:'json'};
const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');

test('thirty optimized opaque specimen illustrations retain original clue descriptions and real source/runtime hashes',()=>{
 const ledger=JSON.parse(readFileSync('assets/specimens/provenance.json','utf8'));
 const original=JSON.parse(readFileSync('assets/specimen-provenance.json','utf8'));
 const names=clues.filter(c=>/^clue\.c\d+$/.test(c.id)).map(c=>c.name);assert.equal(new Set(names).size,30);assert.ok(names.every(n=>n.length<=12));
 assert.equal(ledger.records.length,30);assert.equal(new Set(ledger.records.map((r:{sha256:string})=>r.sha256)).size,30);
 for(const r of ledger.records){
  assert.equal(sha(r.source),r.sourceSha256);assert.equal(sha(r.runtime),r.sha256);
  assert.equal(readFileSync(r.runtime).subarray(8,12).toString(),'WEBP');
  assert.equal(r.description,original.find((p:{id:string})=>p.id===r.id).description);
  assert.equal(clues.find(c=>c.id===r.id)?.url,'/'+r.runtime.replace('public/',''));
  assert.ok(readFileSync(r.fallback).toString().startsWith('<svg'));
  assert.match(r.runtime,/\/c\d{2}\.webp$/);
 }
 assert.ok(ledger.records.reduce((n:number,r:{bytes:number})=>n+r.bytes,0)<200_000);
});

test('locally bundled interface fonts match official source hashes and ship their OFL licenses',()=>{
 const fonts=JSON.parse(readFileSync('assets/interface-fonts/provenance.json','utf8'));
 for(const r of fonts.records){assert.equal(sha(r.runtime),r.sha256);assert.equal(readFileSync(r.runtime).subarray(0,4).toString(),'wOF2');assert.match(r.url,/^https:\/\/fonts.gstatic.com\//);}
 for(const name of ['Cabin','PTSerif'])assert.match(readFileSync(`public/assets/fonts/${name}-OFL.txt`,'utf8'),/SIL OPEN FONT LICENSE/);
 assert.equal(/url\(https?:/.test(readFileSync('src/client/fonts.css','utf8')),false);
});
