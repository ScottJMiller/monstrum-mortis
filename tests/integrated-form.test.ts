import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DNA_CATALOGUE } from '../src/server/catalogue/dna.ts';
import { applyMutation, newExperiment, effectiveCreature } from '../src/server/dna-mechanics.ts';
import { selectIntegratedForm, uniformIndex } from '../src/server/integrated-form.ts';
import { INTEGRATED_RULES } from '../src/shared/integrated-form.ts';
const fixture = (ids: string[]) => {
 const e = newExperiment(); ids.forEach((id, i) => applyMutation(e, id, `p${i % 2}`, 'Scientist', `${i}`, i, 2));
 return { e, select: (entropy = () => 0) => selectIntegratedForm({active:e.active,attemptId:e.id,releasedAtMs:75_000}, entropy) };
};
const noEntropy = () => { throw new Error('Unexpected entropy'); };
for (const dna of DNA_CATALOGUE) test(`${dna.id}: canonical specification mapping and real logical targets`, () => {
 const row = readFileSync('docs/BATTLE-V2-SPEC.md','utf8').split('\n').find(l => l.startsWith(`| ${dna.autopsyName} |`));
 assert.ok(row, `Missing canonical row ${dna.autopsyName}`);
 const expected = row.split('|')[2]!.trim();
 const f = fixture([dna.id]), selected = f.select(noEntropy);
 assert.equal(selected.family, expected === 'None' ? 'blob' : Number(expected));
 assert.equal(Object.values(selected.votes).reduce((a,b)=>a+b,0), expected === 'None' ? 0 : 1);
 assert.deepEqual(Object.keys(INTEGRATED_RULES).sort(), DNA_CATALOGUE.map(d=>d.id).sort());
});
test('paired survival and reinforcement never inflate votes; full replacement does not vote from history', () => {
 const f=fixture(['razor-talons','razor-talons','razor-talons','wandering-limb']);
 assert.deepEqual(f.select().votes,{1:1,2:0,3:0,4:1,5:0});
 applyMutation(f.e,'kitten-paws','p0','Scientist','replace',10,2);
 assert.deepEqual(f.select(noEntropy).votes,{1:0,2:0,3:1,4:0,5:0});
});
test('only highest positive candidates receive uniform buckets, including rejection at UINT32 tail', () => {
 for(const count of [2,3,4,5]){
  for(let i=0;i<count;i++) assert.equal(uniformIndex(count,()=>i),i);
  const boundary=Math.floor(2**32/count)*count;
  if(boundary<2**32){let calls=0;assert.equal(uniformIndex(count,()=>calls++===0?boundary:count-1),count-1);assert.equal(calls,2);}
  assert.equal(uniformIndex(count,()=>boundary-1),count-1);
 }
 const f=fixture(['spring-tendons','hook-tentacles','lantern-eyes','funeral-mane']);
 assert.deepEqual([0,1,2,3].map(n=>f.select(()=>n).family),[1,2,3,5]);
 applyMutation(f.e,'guillotine-teeth','p0','Scientist','win',1,2);
 assert.equal(f.select(noEntropy).family,1);
 assert.throws(()=>uniformIndex(3,()=>.5),/uint32/);
 assert.throws(()=>uniformIndex(3,()=>0xffffffff),/accepted bucket/);
});
test('active-only modifiers respect body/skin competition and do not mutate stats, abilities or frozen input', () => {
 const f=fixture(['titan-fibers','titan-fibers','reweaving-tissue']);
 assert.equal(f.select().modifiers.scale,1.1);
 applyMutation(f.e,'auxiliary-heart','p1','Scientist','heart',4,2);
 const before=structuredClone(f.e), mechanics=effectiveCreature(f.e);
 assert.deepEqual(f.select().modifiers,{scale:1,tint:'combined',overlay:'none',growth:false,tremor:false});
 assert.deepEqual(f.e,before);assert.deepEqual(effectiveCreature(f.e),mechanics);
 applyMutation(f.e,'ink-bloom','p0','Scientist','ink',5,2);
 assert.equal(f.select().modifiers.tint,'red');assert.equal(f.select().modifiers.overlay,'veins');
 applyMutation(f.e,'existential-organ','p0','Scientist','growth',6,2);
 assert.equal(f.select().modifiers.tint,'none');assert.equal(f.select().modifiers.growth,true);
 applyMutation(f.e,'tremor-ganglia','p0','Scientist','tremor',7,2);
 assert.equal(f.select().modifiers.growth,false);assert.equal(f.select().modifiers.tremor,true);
 assert.deepEqual(f.select().integration,{startsAtMs:75000,endsAtMs:80000});
});
test('tint combination is order independent and fallback has no entropy; unknown DNA fails closed', () => {
 const a=fixture(['auxiliary-heart','reweaving-tissue']),b=fixture(['reweaving-tissue','auxiliary-heart']);
 assert.deepEqual(a.select(noEntropy).modifiers,b.select(noEntropy).modifiers);
 assert.equal(fixture([]).select(noEntropy).family,'blob');
 assert.throws(()=>selectIntegratedForm({active:{body:{dnaId:'unknown',contributions:[]}},attemptId:'x',releasedAtMs:0},noEntropy),/Unsupported/);
});
