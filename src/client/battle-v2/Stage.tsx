import { useState } from 'react';
import type { BattleTimeline } from '../../shared/types.ts';
import type { IntegratedForm } from '../../shared/integrated-form.ts';
import artwork from '../../assets/battle-v2/art.json';
import { Sprite } from './Sprite.tsx';
import { sceneFrame } from './animation.ts';
import { EFFECTS, effectPlacement, letteringFor } from './effects.ts';
import { EffectGraphic } from './EffectGraphic.tsx';
export function Stage({timeline,form,time,motion}:{timeline:BattleTimeline;form:IntegratedForm;time:number;motion:boolean}){
 const frame=sceneFrame(timeline,time,motion),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 return <section className="v2-battle" aria-label="Battle v2 animation sample" data-time={Math.round(time)} data-effects={frame.effects.length}>
  <div className="v2-health"><label>Our specimen <meter min="0" max="100" value={frame.state.teamHealth}/><output>{frame.state.teamHealth.toFixed(1)}%</output></label><label>Iron Widow <meter min="0" max="100" value={frame.state.rivalHealth}/><output>{frame.state.rivalHealth.toFixed(1)}%</output></label></div>
  <div className="v2-arena" key={retry} data-motion={motion}>
   <img src={artwork.arena} alt="" className="v2-background" onError={()=>setFailed(true)}/>
   <svg viewBox="0 0 1200 660" role="img" aria-label={`Our specimen ${frame.team.pose}; Iron Widow ${frame.rival.pose}. ${frame.captions.at(-1)?.caption??'Awaiting contact.'}`}>
    {(['team','rival'] as const).map(side=>{const fighter=frame[side],direction=side==='team'?1:-1;return <g key={side} data-fighter={side} data-pose={fighter.pose} data-reaction={fighter.reaction} data-contact={fighter.contact} transform={`translate(${(side==='team'?355:890)+fighter.x*direction*3} 592) rotate(${fighter.rotation*direction}) scale(.80)`}><Sprite body={side==='team'?'family-1':'iron-widow'} pose={fighter.pose} attackStyle={fighter.attackStyle} {...(side==='team'?{modifiers:form.modifiers}:{})} time={time} motion={motion} onError={()=>setFailed(true)}/></g>;})}
    {frame.effects.filter(e=>EFFECTS[e.id].art).map(({event,id,age})=>{const {side,direction}=effectPlacement(event),bodyDirection=side==='team'?1:-1,atX=(side==='team'?390:840)+frame[side].x*bodyDirection*3,progress=age/EFFECTS[id].duration;return <g key={event.sequence} className="v2-impact" data-effect={id} data-sequence={event.sequence} data-side={side} data-direction={direction} transform={`translate(${atX} 370) scale(${direction} 1)`} opacity={motion?1-progress*.85:1}>
     <EffectGraphic id={id} age={age} motion={motion} onError={()=>setFailed(true)}/>
    </g>;})}
   </svg>
   {frame.letter&&<div className={`v2-word word-${frame.letter.id}`} data-word={frame.letter.id} aria-hidden="true">{letteringFor(timeline.battleId,frame.letter.event)}</div>}
   <div className="v2-compact" aria-hidden="true">{frame.compact.map(e=><span key={e.event.sequence}>{letteringFor(timeline.battleId,e.event)}{EFFECTS[e.id].status==='planned'?' · caption study':''}</span>)}</div>
  </div>
  {failed&&<div role="status" className="v2-failure">Artwork unavailable. Health and captions remain available. <button onClick={()=>{setFailed(false);setRetry(n=>n+1);}}>Retry sample artwork</button></div>}
  <ol className="v2-captions" aria-label="Current battle captions">{frame.captions.map(e=><li key={e.sequence}>{e.caption}</li>)}</ol>
 </section>;
}
