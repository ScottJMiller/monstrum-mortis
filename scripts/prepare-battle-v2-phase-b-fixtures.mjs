import {writeFile} from 'node:fs/promises';
import {newExperiment,applyMutation,effectiveCreature,publicCreature} from '../src/server/dna-mechanics.ts';
import {produceBattle} from '../src/server/combat.ts';
import {RIVAL_CATALOGUE} from '../src/server/catalogue/rivals.ts';
import {PRODUCER_CONSTRAINTS} from '../src/server/catalogue/mechanics.ts';
import {selectIntegratedForm} from '../src/server/integrated-form.ts';
import {INTEGRATED_RULES,VOTED_FAMILIES} from '../src/shared/integrated-form.ts';
const families=Object.fromEntries(VOTED_FAMILIES.map(f=>[f==='blob'?'blob':`family-${f}`,Object.entries(INTEGRATED_RULES).filter(([,rule])=>rule.vote===f).map(([id])=>id)]));
function build(ids,n=2){const e=newExperiment();e.id='11111111-1111-4111-8111-111111111111';e.compositionSeed='22222222-2222-4222-8222-222222222222';const sequence=[];ids.forEach((id,i)=>{applyMutation(e,id,`00000000-0000-4000-8000-${String(i%n+1).padStart(12,'0')}`,'Scientist',`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,-75000+Math.floor(i/n)*6000,n);sequence.push(publicCreature(e));});const frozen={attemptId:e.id,rulesVersion:e.rulesVersion,catalogueVersion:e.catalogueVersion,playerCount:n,releasedAtMs:0,reason:'deadline',creature:publicCreature(e),...effectiveCreature(e),constraints:{...PRODUCER_CONSTRAINTS},active:structuredClone(e.active),history:structuredClone(e.history)};return {frozen,sequence,form:selectIntegratedForm(frozen,()=>0)};}
const fixtures=[];
for(const [body,ids]of Object.entries(families))for(const rival of RIVAL_CATALOGUE){
 const {frozen,sequence,form}=build(ids),expected=body==='blob'?'blob':Number(body.at(-1));if(form.family!==expected)throw Error(`${body} fixture selects ${form.family}`);
 const {timeline}=produceBattle(frozen,rival.id,2,5000,`phase-b-${body}-${rival.id}`,`phase-b-${body}-${rival.id}`);
 fixtures.push({name:`${body} / ${rival.name}`,label:'Legal server fixture · real mutation/selection/combat producers',body,ids,form,sequence,timeline});
}
for(const id of ['storm-organ','venom-glands','acid-bladder','bellows-lung','hook-tentacles','reweaving-tissue','barbed-hide','porcelain-teeth','tremor-ganglia','existential-organ']){
 const {frozen,sequence,form}=build(['spring-tendons','razor-talons',id]);const {timeline}=produceBattle(frozen,'the-unfinished',2,5000,`phase-b-effect-${id}`,`phase-b-effect-${id}`);fixtures.push({name:`Ability: ${id}`,label:'Legal server fixture · actual active ability',ids:[id],body:form.family==='blob'?'blob':`family-${form.family}`,form,sequence,timeline});
}
// Find a legal seeded attempt that survives through all unchanged timed detachment events.
let damaged;
for(let seed=0;seed<1000&&!damaged;seed++){
 const ids=['candle-flesh','wandering-limb','porcelain-teeth'],b=build(ids,8);const {timeline}=produceBattle(b.frozen,'iron-widow',1,5000,`phase-b-damage-${seed}`,'phase-b-real-detachment');
 if(['candle-flesh','wandering-limb','porcelain-teeth'].every(id=>timeline.events.some(e=>e.kind==='detach'&&e.mutationId===id)))damaged={name:'Timed melting / limb loss / tooth shatter',label:'Legal server fixture · unchanged 12s/18s accepted detachments, eight-player potency',ids,body:b.form.family==='blob'?'blob':`family-${b.form.family}`,form:b.form,sequence:b.sequence,timeline};
}
if(!damaged)throw Error('Unable to obtain complete actual detachment fixture');fixtures.push(damaged);
// Explicit art-only sampler for both directions, including rare recovery. It never replaces producer fixtures.
const events=[];
for(const [kind,mutationId,caption]of [['electric','storm-organ','Electrical discharge'],['poison','venom-glands','Venom pulse'],['bleed','razor-talons','Bleeding tick'],['restraint','hook-tentacles','Tentacles restrain'],['restraint','bellows-lung','Bellows roar'],['regeneration','reweaving-tissue','Tissue reweaves'],['slowing','candle-flesh','Wax slows'],['restraint','wandering-limb','The detached limb distracts'],['malfunction','tremor-ganglia','Ganglia misfire'],['detach','wandering-limb','Limb separates'],['recover',undefined,'Restraint recovery'],['attack','porcelain-teeth','Porcelain shards punish contact']])for(const actor of ['team','rival']){
 const self=['regeneration','malfunction','detach','recover'].includes(kind),target=self?actor:actor==='team'?'rival':'team';
 events.push({sequence:events.length+1,offsetMs:1200+events.length*1000,kind,actor,target,caption:`Art-only: ${caption}`,mutationId,magnitude:0,contributorWeights:[],teamHealth:100,rivalHealth:100});
}
const studies=[{...fixtures[0],name:'All compact effects / both directions',label:'Art-only choreography sampler · isolated event semantics, not an emitted producer battle',timeline:{...fixtures[0].timeline,battleId:'phase-b-compact-art-study',durationMs:26000,events}}];
await writeFile('src/assets/battle-v2/phase-b-fixtures.json',JSON.stringify({families,fixtures,studies},null,2)+'\n');console.log(`Prepared ${fixtures.length} legal Phase B timelines and one labeled directional art sampler.`);
