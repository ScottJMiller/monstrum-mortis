import { writeFile } from 'node:fs/promises';
import { newExperiment, applyMutation, effectiveCreature, publicCreature } from '../src/server/dna-mechanics.ts';
import { produceBattle } from '../src/server/combat.ts';
import { selectIntegratedForm } from '../src/server/integrated-form.ts';
import { PRODUCER_CONSTRAINTS } from '../src/server/catalogue/mechanics.ts';
const sets={
 Strike:['spring-tendons','ossified-plates','auxiliary-heart','venom-glands'],
 Slash:['spring-tendons','razor-talons','ink-bloom','auxiliary-heart','venom-glands'],
 Bite:['spring-tendons','razor-talons','guillotine-teeth','reweaving-tissue','auxiliary-heart'],
 Corrosion:['spring-tendons','razor-talons','guillotine-teeth','acid-bladder','ink-bloom'],
 Retaliation:['spring-tendons','razor-talons','guillotine-teeth','barbed-hide','auxiliary-heart'],
};
function build(ids){const e=newExperiment();e.id='11111111-1111-4111-8111-111111111111';e.compositionSeed='22222222-2222-4222-8222-222222222222';const sequence=[];ids.forEach((id,i)=>{applyMutation(e,id,`00000000-0000-4000-8000-${String(1000+i%2).padStart(12,'0')}`,'Scientist',`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,-75000+i*12000,2);sequence.push(publicCreature(e));});const frozen={attemptId:e.id,rulesVersion:e.rulesVersion,catalogueVersion:e.catalogueVersion,playerCount:2,releasedAtMs:0,reason:'deadline',creature:publicCreature(e),...effectiveCreature(e),constraints:{...PRODUCER_CONSTRAINTS},active:structuredClone(e.active),history:structuredClone(e.history)};return {frozen,sequence,form:selectIntegratedForm(frozen,()=>0)};}
const fixtures=Object.entries(sets).map(([name,ids],i)=>{const {frozen,sequence,form}=build(ids);if(form.family!==1)throw Error('Sample must legally vote for family 1');const {timeline}=produceBattle(frozen,'iron-widow',2,5000,`battle-v2-${i}`,'33333333-3333-4333-8333-333333333333');return {name,label:'Legal server fixture · existing mutation and combat producer',ids,form,sequence,timeline};});
const base=fixtures[2];
const event=(sequence,offsetMs,kind,actor,target,caption,mutationId=null,magnitude=10)=>({sequence,offsetMs,kind,actor,target,caption,mutationId,magnitude,contributorWeights:[],teamHealth:90,rivalHealth:90});
const studies=[
 {name:'Simultaneous contacts',events:[event(1,1200,'attack','team','rival','Active talons slash.'),event(2,1200,'attack','rival','team','The rival strikes.')]},
 {name:'Miss and defense',events:[event(1,1200,'dodge','rival','team','The blow misses its intended department.',null,0),event(2,2600,'block','rival','rival','Armor stops the choreography study.',null,5)]},
 {name:'Defeat preempts recovery',events:[event(1,1200,'attack','team','rival','A guillotine bite lands.'),event(2,1200,'knockout','team','rival','The rival is no longer operational.',null,0)]},
 {name:'Support without lunge',events:[event(1,1200,'regeneration','team','team','Tissue reweaves itself.', 'reweaving-tissue',1.5)]},
];
studies.push({name:'Mirrored effect directions',events:[['strike','A body strike lands.',null],['slash','Active talons slash.',null],['bite','A guillotine bite lands.',null],['corrosion','Corrosion weakens the armor.','acid-bladder'],['retaliation','Barbs punish contact.','barbed-hide']].flatMap(([id,caption,mutation],i)=>['team','rival'].map((actor,j)=>event(i*2+j+1,1200+(i*2+j)*900,id==='corrosion'?'corrosion':'attack',actor,actor==='team'?'rival':'team',caption,mutation,id==='corrosion'?3:5)))});
studies.push({name:'Round timeout lettering',events:[event(1,1200,'timeout','team','rival','Time expires. Remaining health percentage decides the result.',null,0)]});
for(const study of studies){let team=100,rival=100;for(const e of study.events){if(e.kind==='attack'){if(e.target==='team')team-=e.magnitude;else rival-=e.magnitude;}if(e.kind==='knockout'){if(e.target==='team')team=0;else rival=0;}e.teamHealth=team;e.rivalHealth=rival;}fixtures.push({...base,name:study.name,label:'Isolated choreography study · not a generated battle outcome',timeline:{...base.timeline,durationMs:Math.max(5000,study.events.at(-1).offsetMs+1000),events:study.events}});}
const samplerSets=[['Unmodified',[]],['Titan',['titan-fibers']],['Red tint',['auxiliary-heart']],['Green tint',['reweaving-tissue']],['Combined tint',['auxiliary-heart','reweaving-tissue']],['Sparse barbs',['barbed-hide']],['Marbled veins',['ink-bloom']],['Surface mouths',['too-many-smiles']],['Shoulder eye',['existential-organ']],['Tremor',['tremor-ganglia']]];
const samplers=samplerSets.map(([name,mods])=>{const b=build(['spring-tendons','razor-talons','guillotine-teeth',...mods]);return {name,label:'Legal server fixture · active modifiers',form:b.form};});
samplers.push({name:'All treatments',label:'Art-only sampler · incompatible body/skin modifiers; no gameplay state',form:{...base.form,modifiers:{scale:1.1,tint:'combined',overlay:'mouths',growth:true,tremor:true}}});
const fallback=build(['venom-glands']);samplers.push({name:'No-vote blob',label:'Legal server fixture · animated no-vote fallback',form:fallback.form});
await writeFile('src/assets/battle-v2/fixtures.json',JSON.stringify({fixtures,samplers},null,2)+'\n');console.log(`Prepared ${fixtures.length} timelines (five real producer fixtures/six labeled studies) and ${samplers.length} modifier studies.`);
