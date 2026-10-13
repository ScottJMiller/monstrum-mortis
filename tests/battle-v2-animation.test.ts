import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sceneFrame, integrationFrame, acceptedAccent, timelyCues, biteJawOffset } from '../src/client/battle-v2/animation.ts';
import { EFFECTS, effectFor, effectPlacement, letteringFor } from '../src/client/battle-v2/effects.ts';
import type { BattleTimeline, BattleEvent } from '../src/shared/types.ts';
import type { IntegratedForm } from '../src/shared/integrated-form.ts';
const data=JSON.parse(readFileSync('src/assets/battle-v2/fixtures.json','utf8'));
const fixture=(name:string)=>data.fixtures.find((f:{name:string})=>f.name===name) as {timeline:BattleTimeline;form:IntegratedForm};
test('attack contact, effect and defender reaction share the exact authoritative timestamp',()=>{
 const {timeline}=fixture('Slash'),event=timeline.events.find(e=>e.actor==='team'&&effectFor(e)==='slash')!;
 const before=sceneFrame(timeline,event.offsetMs-1),contact=sceneFrame(timeline,event.offsetMs);
 assert.equal(before.team.pose,'attack');assert.equal(before.effects.some(e=>e.event.sequence===event.sequence),false);
 assert.equal(contact.team.contact,true);assert.ok(['recoil','attack'].includes(contact.rival.pose));
 assert.equal(contact.effects.some(e=>e.event.sequence===event.sequence),true);
 assert.equal(contact.state.elapsed,event.offsetMs);
 assert.equal(sceneFrame(timeline,event.offsetMs+44).team.x,contact.team.x);
 assert.ok(sceneFrame(timeline,event.offsetMs+200).team.x<contact.team.x);
});
test('simultaneous exchange shows both attacks and reactions without serializing cosmetics',()=>{
 const {timeline}=fixture('Simultaneous contacts'),frame=sceneFrame(timeline,1200);
 assert.equal(frame.team.pose,'attack');assert.equal(frame.rival.pose,'attack');
 assert.equal(frame.team.reaction,'strike');assert.equal(frame.rival.reaction,'slash');
 assert.equal(frame.effects.length,2);assert.ok(frame.letter);assert.equal(frame.state.teamHealth,90);
});
test('miss has defense/dodge without false damage, guard is distinct, support never lunges; defeat overrides attack',()=>{
 const miss=sceneFrame(fixture('Miss and defense').timeline,1200);
 assert.equal(miss.rival.pose,'defense');assert.equal(miss.effects[0]!.id,'dodge');assert.equal(miss.letter!.id,'dodge');assert.equal(miss.state.teamHealth,100);assert.equal(miss.state.rivalHealth,100);
 const guard=sceneFrame(fixture('Miss and defense').timeline,2600);assert.equal(guard.rival.pose,'defense');
 const support=sceneFrame(fixture('Support without lunge').timeline,1200);assert.equal(support.team.pose,'idle');assert.equal(support.team.x,0);
 assert.equal(sceneFrame(fixture('Defeat preempts recovery').timeline,1200).rival.pose,'defeat');
 assert.equal(sceneFrame(fixture('Defeat preempts recovery').timeline,4000).rival.pose,'defeat');
});
test('retaliation is reactive; semantic registry retains planned families without repeated-tick giant lettering',()=>{
 const {timeline}=fixture('Retaliation'),event=timeline.events.find(e=>effectFor(e)==='retaliation')!;
 assert.ok(event);assert.equal(EFFECTS.retaliation.direct,false);
 const isolated={...timeline,events:[event]};assert.notEqual(sceneFrame(isolated,event.offsetMs).team.pose,'attack');
 for(const kind of ['poison','bleed','regeneration'] as const){const e={...event,kind,mutationId:null};const frame=sceneFrame({...timeline,events:[e]},e.offsetMs);assert.equal(frame.letter,null);}
 assert.deepEqual(Object.values(EFFECTS).filter(e=>e.major&&e.status==='ready').length,9);
});
test('seek has no stored animation state; effects/lettering stay bounded and reduced motion retains semantic poses',()=>{
 const {timeline}=fixture('Bite');let max=0;for(let time=0;time<=timeline.durationMs;time+=20){const frame=sceneFrame(timeline,time);max=Math.max(max,frame.effects.length);assert.ok(frame.effects.length<=3);assert.ok(frame.captions.length<=3);}
 assert.ok(max>0);assert.deepEqual(sceneFrame(timeline,6200),sceneFrame(timeline,6200));
 const event=timeline.events.find(e=>EFFECTS[effectFor(e)].direct)!;const still=sceneFrame(timeline,event.offsetMs,false);
 assert.equal(still.team.x,0);assert.equal(still.team.rotation,0);assert.equal(still.team.pose,'attack');
});
test('injections coalesce, do not animate rejected/selected/replayed actions, resolve within 800ms',()=>{
 const first=acceptedAccent(null,1,100,true)!;const latest=acceptedAccent(first,4,150,true)!;
 assert.equal(latest.sequence,4);assert.equal(latest.ends,950);assert.equal(latest.started,150);
 assert.equal(acceptedAccent(latest,5,160,false),latest);assert.equal(acceptedAccent(latest,4,160,true),latest);
});
test('integration seeks within exactly the existing five-second interval with no fluid pulse',()=>{
 const form=fixture('Bite').form;assert.equal(form.integration.endsAtMs-form.integration.startsAtMs,5000);
 assert.equal(integrationFrame(form,1999).phase,'integrating');assert.equal(integrationFrame(form,2750).reveal,.5);
 assert.equal(integrationFrame(form,3500).phase,'unleash');assert.equal(integrationFrame(form,5000).done,true);
 assert.equal(integrationFrame(form,9000).phase,'battle');assert.equal(integrationFrame(form,2750).fluidPulse,false);
 assert.equal(integrationFrame(form,2750,false).reveal,1);
});
test('sound cues never backlog on seek, hide, reconnect or reverse; timely simultaneous cues are capped',()=>{
 const event=fixture('Bite').timeline.events.find(e=>EFFECTS[effectFor(e)].sound)!;
 const events=Array.from({length:20},(_,i)=>({...event,sequence:i+1}));
 assert.equal(timelyCues(events,event.offsetMs-10,event.offsetMs).length,3);
 assert.deepEqual(timelyCues(events,0,event.offsetMs+1000),[]);assert.deepEqual(timelyCues(events,event.offsetMs,event.offsetMs-1),[]);
 assert.deepEqual(timelyCues(events,event.offsetMs-10,event.offsetMs,true),[]);
});

test('every completed attack effect is usable in both directions without body-based attack inference',()=>{
 const {timeline}=fixture('Mirrored effect directions');
 for(const id of ['strike','slash','bite','corrosion','retaliation']){const events=timeline.events.filter(e=>effectFor(e)===id);assert.deepEqual(events.map(e=>e.actor),['team','rival']);for(const e of events)assert.ok(sceneFrame(timeline,e.offsetMs).effects.some(v=>v.id===id));}
});
test('bite artwork follows the event, tooth rows meet at contact and seek/reduced motion never invent another hit',()=>{
 const bite=fixture('Bite').timeline,event=bite.events.find(e=>e.actor==='team'&&effectFor(e)==='bite')!;
 assert.equal(sceneFrame(bite,event.offsetMs).team.attackStyle,'bite');
 const slash=fixture('Slash').timeline,cut=slash.events.find(e=>e.actor==='team'&&effectFor(e)==='slash')!;
 assert.equal(sceneFrame(slash,cut.offsetMs).team.attackStyle,'generic');
 assert.equal(biteJawOffset(0,true),0);assert.equal(biteJawOffset(150,true),16);assert.equal(biteJawOffset(300,true),0);assert.equal(biteJawOffset(150,false),0);
 assert.equal(EFFECTS.dodge.art,undefined);assert.ok(EFFECTS.block.art);
});
test('offensive graphics follow the attacked body; defensive graphics follow the defender; orientation independently follows the acting side',()=>{
 const {timeline}=fixture('Mirrored effect directions');
 for(const e of timeline.events){
  const defensive=effectFor(e)==='retaliation',side=defensive?e.actor:e.target;
  assert.deepEqual(effectPlacement(e),{side,direction:e.actor==='team'?1:-1});
  if(defensive)assert.notEqual(effectPlacement(e).side,e.target,'Retaliation art must stay on its defender, despite damage targeting the attacker');
 }
 for(const side of ['team','rival'] as const){
  const guard={...timeline.events[0]!,kind:'block' as const,actor:side,target:side};
  assert.deepEqual(effectPlacement(guard),{side,direction:side==='team'?1:-1});
 }
});

test('all approved lettering lists are reachable, event-stable, and independent of health or replay order',()=>{
 const expected={strike:['THUD!','BAM!','POW!','WHAM!'],slash:['RIP!','SLASH!','SLICE!'],bite:['CHOMP!','CRUNCH!'],corrosion:['CORROSION!','ACID ATTACK!'],retaliation:['RETRIBUTION!','THORN DAMAGE!'],knockout:['CEASED!','DEFEAT!'],block:['BLOCKED!','DENIED!'],dodge:['WHIFF!','MISSED!'],timeout:['ROUND OVER','YOUR TIME IS UP']};
 const source=fixture('Mirrored effect directions').timeline;
 for(const [id,words]of Object.entries(expected)){
  const example= id==='strike'||id==='slash'||id==='bite'||id==='corrosion'||id==='retaliation'?source.events.find(e=>effectFor(e)===id)!:{...source.events[0]!,kind:id as BattleEvent['kind']};
  assert.deepEqual(EFFECTS[effectFor(example)].words,words);
  const choices=Array.from({length:512},(_,i)=>letteringFor('lettering-study',{...example,sequence:i+1}));
  assert.deepEqual([...new Set(choices)].sort(),[...words].sort());
  assert.equal(letteringFor('lettering-study',example),letteringFor('lettering-study',{...example,teamHealth:1,rivalHealth:2}));
  assert.equal(letteringFor('lettering-study',example),letteringFor('lettering-study',structuredClone(example)));
  assert.ok(Array.from({length:20},(_,i)=>letteringFor(`other-battle-${i}`,example)).some(word=>word!==letteringFor('lettering-study',example)));
 }
 for(const name of ['Miss and defense','Defeat preempts recovery','Round timeout lettering']){const timeline=fixture(name).timeline;const event=timeline.events.at(-1)!;const frame=sceneFrame(timeline,event.offsetMs);assert.ok(frame.letter);assert.ok(EFFECTS[frame.letter.id].words.includes(letteringFor(timeline.battleId,frame.letter.event)));}
});
