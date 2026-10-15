import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sceneFrame, integrationFrame, acceptedAccent, timelyCues, biteJawOffset, initiationEvents } from '../src/client/battle-v2/animation.ts';
import { EFFECTS, effectFor, effectPlacement, letteringFor, soundFor, graphicFor } from '../src/client/battle-v2/effects.ts';
import type { BattleTimeline, BattleEvent } from '../src/shared/types.ts';
import type { IntegratedForm } from '../src/shared/integrated-form.ts';
import { fighterPlacement,shieldPosition } from '../src/client/battle-v2/layout.ts';
const BODY_ART=JSON.parse(readFileSync('src/assets/battle-v2/art.json','utf8'));
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
test('retaliation is reactive; semantic registry keeps bounded repeated-tick feedback without repeated-tick giant lettering',()=>{
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

test('battle-end clears transient effects while preserving terminal health, final lettering and defeat on forward/reverse seeking',()=>{
 const {timeline}=fixture('Defeat preempts recovery'),end=1200,t={...timeline,durationMs:end};
 assert.ok(sceneFrame(t,end-1).team.pose);for(const now of [end,end+1,end+1000,end]){const f=sceneFrame(t,now);assert.deepEqual(f.effects,[]);assert.equal(f.letter,null);assert.equal(f.finalLetter,letteringFor(t.battleId,t.events.at(-1)!));assert.equal(f.countdown,null);assert.deepEqual(f.compact,[]);assert.equal(f.rival.pose,'defeat');assert.equal(f.state.rivalHealth,0);}
 assert.ok(sceneFrame(t,1100).team.pose!=='defeat');
});
test('status onsets play once across ticks and refreshes, with independent targets, expired reapplication and no seek backlog',()=>{
 const base=fixture('Bite').timeline.events[0]!;
 const e=(sequence:number,time:number,kind:BattleEvent['kind'],magnitude=0,target:BattleEvent['target']='rival'):BattleEvent=>({...base,sequence,offsetMs:time,kind,magnitude,target,mutationId:null,durationMs:4000});
 const events=[e(1,1000,'poison'),e(2,1000,'bleed'),e(3,2000,'poison',2),e(4,2000,'bleed',1),e(5,2000,'regeneration',1,'team'),e(6,3000,'poison'),e(7,3000,'regeneration',1,'team'),e(8,4000,'regeneration',1,'team'),e(9,6000,'regeneration',1,'team'),e(10,8000,'poison'),e(11,8000,'poison',0,'team')];
 assert.deepEqual(initiationEvents(events).map(e=>e.sequence),[1,2,5,9,10,11]);
 assert.deepEqual(timelyCues(events,2990,3000),[]);assert.deepEqual(timelyCues(events,1990,2000).map(e=>e.sequence),[5]);assert.deepEqual(timelyCues(events,7990,8000).map(e=>e.sequence).sort((a,b)=>a-b),[10,11]);assert.deepEqual(timelyCues(events,1000,8000),[]);
});
test('sound-only specials never expose graphics; recovery and porcelain shard feedback are silent',()=>{
 const base=fixture('Bite').timeline.events[0]!;
 for(const kind of ['poison','bleed','restraint','regeneration','slowing','malfunction','detach','recover'] as const)assert.equal(graphicFor({...base,kind}),undefined);
 const shards={...base,kind:'attack' as const,mutationId:'porcelain-teeth',caption:'Loose porcelain shards punish contact.'};assert.equal(soundFor(shards),null);assert.equal(graphicFor(shards),undefined);assert.equal(soundFor({...base,kind:'recover'}),null);
 assert.ok(graphicFor({...base,kind:'electric'}));assert.ok(soundFor({...base,kind:'electric'}));
});

test('countdown shows only the final three seconds of the actual battle interval, seeks exactly and yields to stable final text',()=>{
 const {timeline}=fixture('Round timeout lettering');
 for(const [time,number]of [[-1,null],[1999,null],[2000,3],[2999,3],[3000,2],[3999,2],[4000,1],[4999,1],[5000,null],[7000,null]] as const){const f=sceneFrame(timeline,time);assert.equal(f.countdown,number);assert.equal(f.finalLetter!==null,time>=5000);assert.equal(sceneFrame(timeline,time,false).countdown,number);}
 assert.equal(sceneFrame(timeline,5000).finalLetter,letteringFor(timeline.battleId,timeline.events.at(-1)!));
 assert.equal(sceneFrame(timeline,8000).finalLetter,sceneFrame(timeline,5000).finalLetter);assert.equal(sceneFrame(timeline,4000).countdown,1);
 const short={...timeline,durationMs:2500};assert.equal(sceneFrame(short,0).countdown,3);assert.equal(sceneFrame(short,1500).countdown,1);
});
test('defensive shields follow the inward anatomy on either side, keep their gap across re-cropping, motion and Titan scaling',()=>{
 for(const side of ['team','rival'] as const){
  const art=BODY_ART[side==='team'?'family-1':'iron-widow'].defense,movement={x:0,rotation:0},width=90;
  const anchor=shieldPosition(art,side,movement,width),fighter=fighterPlacement(side,movement);
  assert.ok(side==='team'?anchor.x>fighter.x:anchor.x<fighter.x);
  const shifted=shieldPosition({...art,torso:art.torso.map(([x,y])=>[x!+100,y!+50]),eye:[art.eye[0]!+100,art.eye[1]!+50],pivot:[art.pivot[0]!+100,art.pivot[1]!+50]},side,movement,width);
  for(const key of ['x','y','edgeX'] as const)assert.ok(Math.abs(shifted[key]-anchor[key])<1e-9,'Changing a source crop must not move the registered attachment');
  const moving=shieldPosition(art,side,{x:10,rotation:0},width);assert.ok(Math.abs((moving.x-anchor.x)-(side==='team'?30:-30))<1e-9);assert.equal(moving.y,anchor.y);
  const titan=shieldPosition(art,side,movement,width,1.1);assert.notEqual(titan.edgeX,anchor.edgeX);assert.ok(Math.abs(Math.abs(titan.x-titan.edgeX)-Math.abs(anchor.x-anchor.edgeX))<1e-9,'Shield does not drift away when body grows');
  const tilted=shieldPosition(art,side,{x:0,rotation:3},width);assert.notEqual(tilted.y,anchor.y);
 }
});


test('timeout winner uses the authoritative terminal percentages; knockout and unfinished playback have no winner line',()=>{
 const {timeline}=fixture('Round timeout lettering'),base=timeline.events.at(-1)!;
 for(const [teamHealth,rivalHealth,label]of [[60,20,'Our specimen wins'],[20,60,`${timeline.rival.name} wins`],[50,50,'Draw']] as const){
  const t={...timeline,events:[{...base,kind:'timeout' as const,offsetMs:timeline.durationMs,teamHealth,rivalHealth}]};
  assert.equal(sceneFrame(t,t.durationMs-1).timeoutWinner,null);
  for(const time of [t.durationMs,t.durationMs+10000,t.durationMs]){
   assert.equal(sceneFrame(t,time).timeoutWinner,label);assert.equal(sceneFrame(t,time,false).timeoutWinner,label);
  }
  assert.equal(sceneFrame({...t,events:[{...t.events[0]!,kind:'knockout'}]},t.durationMs).timeoutWinner,null);
 }
 assert.equal(sceneFrame({...timeline,events:[]},timeline.durationMs).timeoutWinner,null);
});
test('blocked strikes suppress only the graphic at the same defender/contact, including partial blocks and capped exchanges',()=>{
 const {timeline}=fixture('Mirrored effect directions'),base=timeline.events.find(e=>effectFor(e)==='strike')!;
 for(const actor of ['team','rival'] as const){
  const target=actor==='team'?'rival':'team',strike={...base,sequence:1,actor,target,offsetMs:1200,magnitude:5};
  const block={...strike,sequence:2,kind:'block' as const,actor:target,target,magnitude:2};
  assert.equal(graphicFor(strike,[block,strike]),undefined);
  assert.ok(graphicFor(strike,[{...block,offsetMs:1199},strike]));
  assert.ok(graphicFor(strike,[{...block,actor,target:actor},strike]),'An unrelated simultaneous defense must not suppress this attack');
  assert.ok(graphicFor({...strike,caption:'A slash tears through.'},[block]));
  assert.ok(graphicFor({...strike,caption:'The maw closes in a bite.'},[block]));
  const crowded=[strike,block,{...strike,sequence:3,kind:'corrosion' as const},{...strike,sequence:4,mutationId:'barbed-hide',caption:'Barbs punish contact.'}];
  const frame=sceneFrame({...timeline,events:crowded},1200);
  assert.equal(frame.effects.some(e=>e.id==='block'),false,'Fixture must put the block outside the display cap');
  assert.equal(graphicFor(frame.effects.find(e=>e.id==='strike')!.event,crowded),undefined);
  assert.equal(frame[actor].pose,'attack');assert.equal(soundFor(strike),'strike');
  assert.deepEqual(crowded.map(e=>e.sequence),[1,2,3,4]);
 }
});
