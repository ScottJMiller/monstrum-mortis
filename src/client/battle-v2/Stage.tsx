import { useState } from 'react';
import type { BattleTimeline } from '../../shared/types.ts';
import type { IntegratedForm } from '../../shared/integrated-form.ts';
import artwork from '../../assets/battle-v2/art.json';
import { Sprite, poseArt } from './Sprite.tsx';
import { fighterPlacement,shieldPosition } from './layout.ts';
import { sceneFrame } from './animation.ts';
import { EFFECTS, effectPlacement, letteringFor, graphicFor } from './effects.ts';
import { EffectGraphic } from './EffectGraphic.tsx';
import { ARENAS, familyBody } from './art.ts';
import type {PlayerBody,RivalBody} from './art.ts';
import {damageFrame,damageLabels} from './damage.ts';
import type {DamageFrame} from './damage.ts';
export function Stage({timeline,form,time,motion,playerBody=familyBody(form.family),rivalBody=timeline.rival.id as RivalBody,arena='laboratory',damageOverride}:{timeline:BattleTimeline;form:IntegratedForm;time:number;motion:boolean;playerBody?:PlayerBody;rivalBody?:RivalBody;arena?:string;damageOverride?:DamageFrame|undefined}){
 const frame=sceneFrame(timeline,time,motion),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 const teamDamage=damageOverride??damageFrame(timeline,time,'team'),rivalDamage=damageFrame(timeline,time,'rival');
 return <section className="v2-battle" aria-label="Battle v2 animation sample" data-time={Math.round(time)} data-effects={frame.effects.length}>
  <div className="v2-health"><label>Our specimen <meter min="0" max="100" value={frame.state.teamHealth}/><output>{frame.state.teamHealth.toFixed(1)}%</output><span className="v2-damage-status" data-damage-side="team">{damageLabels(teamDamage).join(' · ')}</span></label><label>{timeline.rival.name} <meter min="0" max="100" value={frame.state.rivalHealth}/><output>{frame.state.rivalHealth.toFixed(1)}%</output><span className="v2-damage-status" data-damage-side="rival">{damageLabels(rivalDamage).join(' · ')}</span></label></div>
  <div className="v2-arena" key={retry} data-motion={motion}>
   <img src={ARENAS[arena]} alt="" className="v2-background" onError={()=>setFailed(true)}/>
   <svg viewBox="0 0 1200 660" role="img" aria-label={`Our specimen ${frame.team.pose}; ${timeline.rival.name} ${frame.rival.pose}. ${frame.captions.at(-1)?.caption??'Awaiting contact.'}`}>
    {(['team','rival'] as const).map(side=>{const fighter=frame[side],placement=fighterPlacement(side,fighter);return <g key={side} data-fighter={side} data-pose={fighter.pose} data-reaction={fighter.reaction} data-contact={fighter.contact} transform={`translate(${placement.x} ${placement.y}) rotate(${placement.rotation}) scale(${placement.scale})`}><Sprite body={side==='team'?playerBody:rivalBody} pose={fighter.pose} attackStyle={fighter.attackStyle} {...(side==='team'?{modifiers:form.modifiers}:{})} time={time} motion={motion} onError={()=>setFailed(true)}/></g>;})}
    {frame.effects.filter(e=>graphicFor(e.event,timeline.events)).map(({event,id,age})=>{const {side,direction}=effectPlacement(event),bodyDirection=side==='team'?1:-1,defensive=id==='block'||id==='retaliation',fighter=frame[side],art=poseArt(side==='team'?playerBody:rivalBody,fighter.pose,fighter.attackStyle),position=defensive?shieldPosition(art,side,fighter,EFFECTS[id].art!.width,side==='team'?form.modifiers.scale:1):{x:(side==='team'?390:840)+fighter.x*bodyDirection*3,y:370,edgeX:undefined},progress=age/EFFECTS[id].duration;return <g key={event.sequence} className="v2-impact" data-effect={id} data-sequence={event.sequence} data-side={side} data-direction={direction} data-shield-edge={position.edgeX} transform={`translate(${position.x} ${position.y}) scale(${direction} 1)`} opacity={motion?1-progress*.85:1}>
     <EffectGraphic id={id} age={age} motion={motion} onError={()=>setFailed(true)}/>
    </g>;})}
   </svg>
   {frame.countdown!==null&&<div className="v2-countdown" role="timer" aria-live="off" aria-label={`${frame.countdown} seconds remaining`}>{frame.countdown}</div>}
   {frame.finalLetter?<div className="v2-word v2-final-word" data-word="final" role="status"><span className="v2-final-title">{frame.finalLetter}</span>{frame.timeoutWinner&&<span className="v2-timeout-winner">{frame.timeoutWinner}</span>}</div>:frame.letter&&<div className={`v2-word word-${frame.letter.id}`} data-word={frame.letter.id} aria-hidden="true">{letteringFor(timeline.battleId,frame.letter.event)}</div>}
   <div className="v2-compact" aria-hidden="true">{frame.compact.map(e=><span key={e.event.sequence}>{letteringFor(timeline.battleId,e.event)}{EFFECTS[e.id].status==='planned'?' · caption study':''}</span>)}</div>
  </div>
  {failed&&<div role="status" className="v2-failure">Artwork unavailable. Health and captions remain available. <button onClick={()=>{setFailed(false);setRetry(n=>n+1);}}>Retry sample artwork</button></div>}
  <ol className="v2-captions" aria-label="Current battle captions">{frame.captions.map(e=><li key={e.sequence}>{e.caption}</li>)}</ol>
 </section>;
}
