import { useEffect, useMemo, useRef, useState } from 'react';
import type { RoomSnapshot } from '../../shared/types.ts';
import { integrationFrame, timelyCues } from './animation.ts';
import { effectFor, soundFor } from './effects.ts';
import { SampleAudio } from './audio.ts';
import { Sprite } from './Sprite.tsx';
import { Stage } from './Stage.tsx';
import { familyBody } from './art.ts';
import { RIVAL_BODIES } from './art.ts';
import type { RivalBody } from './art.ts';
import { preloadSample } from './loading.ts';
import { CreaturePortrait } from '../BattleStage.tsx';
import './battle.css';

/** One device sound engine and clock projection; neither owns transport nor gameplay. */
export function useLivePresentation(room:RoomSnapshot|null,serverNow:number,connected:boolean){
 const audio=useMemo(()=>new SampleAudio(),[]),[sound,setSound]=useState(audio.status);
 const [muted,setMuted]=useState(audio.muted),[volume,setVolume]=useState(audio.volume);
 const anchor=useRef({server:serverNow,local:Date.now()});if(anchor.current.server!==serverNow)anchor.current={server:serverNow,local:Date.now()};
 const [,setTick]=useState(serverNow),[hidden,setHidden]=useState(document.hidden),[accentEnd,setAccentEnd]=useState(0);
 const cueCursor=useRef({battleId:null as string|null,elapsed:0});
 const previous=useRef<{attempt:string|null;mutation:number;switches:string;phase:string;time:number;battleId:string|null;terminal:string|null}>({attempt:null,mutation:0,switches:'',phase:'',time:0,battleId:null,terminal:null});
 const now=anchor.current.server+Date.now()-anchor.current.local;
 useEffect(()=>{const visibility=()=>{setHidden(document.hidden);audio.silence();previous.current.time=anchor.current.server+Date.now()-anchor.current.local;};document.addEventListener('visibilitychange',visibility);return()=>document.removeEventListener('visibilitychange',visibility);},[audio]);
 useEffect(()=>()=>audio.close(),[audio]);
 useEffect(()=>{
  if(hidden||!room||!['experiment','release','battle'].includes(room.phase))return;
  let id=0;const draw=()=>{setTick(anchor.current.server+Date.now()-anchor.current.local);id=requestAnimationFrame(draw);};id=requestAnimationFrame(draw);return()=>cancelAnimationFrame(id);
 },[room?.phase,hidden]);
 useEffect(()=>{
  const prev=previous.current,attempt=room?.attemptId??null,mutation=room?.mutations?.at(-1),switches=room?.players.filter(p=>p.completionReason==='switch').map(p=>p.playerId).sort().join(',')??'';
  const initial=prev.attempt!==attempt,phase=room?.phase??'',timely=connected&&!hidden&&now>=prev.time&&now-prev.time<=250;
  if(!initial&&connected&&!hidden&&mutation&&mutation.sequence>prev.mutation&&Math.max(0,now-mutation.atMs)<=900){setAccentEnd(now+800);audio.play('injection');}
  if(!initial&&timely&&switches!==prev.switches&&switches&&phase==='experiment')audio.play('switch');
  const form=room?.battlePresentation?.form;
  if(form&&phase==='release'&&timely){for(const [offset,cue]of [[2000,'integration'],[3500,'unleash']] as const){const at=form.integration.startsAtMs+offset;if(prev.time<at&&now>=at)audio.play(cue);}}
  const timeline=room?.battle;
  if(timeline&&phase==='battle'){
   const elapsed=now-timeline.startsAtMs,cursor=cueCursor.current,prior=cursor.battleId===timeline.battleId?cursor.elapsed:elapsed;
   cueCursor.current={battleId:timeline.battleId,elapsed:Math.max(prior,elapsed)};
   for(const event of timelyCues(timeline.events,prior,elapsed,!timely)){
    audio.play(soundFor(event)!);
    if(['knockout','timeout'].includes(event.kind))prev.terminal=timeline.battleId;
    if(event.magnitude>0&&event.target!==event.actor&&['strike','slash','bite','electric','retaliation'].includes(effectFor(event)))audio.play('recoil');
   }
  }
  if(room?.result&&prev.phase==='battle'&&timely&&prev.terminal!==room.result.battleId){audio.play(room.result.finalTeamHealth===0||room.result.finalRivalHealth===0?'defeat':'result');prev.terminal=room.result.battleId;}
  previous.current={...prev,attempt,mutation:mutation?.sequence??0,switches,phase,time:now,battleId:timeline?.battleId??null};
 },[room,now,connected,hidden,audio]);
 return {now,hidden,accent:now<accentEnd,audio,sound,setSound,muted,setMuted,volume,setVolume};
}
export function SoundControls({state}:{state:ReturnType<typeof useLivePresentation>}){
 const {audio,sound,setSound,muted,setMuted,volume,setVolume}=state;
 return <div className="device-audio" aria-label="Device sound settings">
  <button onClick={()=>{setSound('Preparing sound…');void audio.unlock().then(()=>setSound(audio.status));}}>Enable sound</button>
  <label className="checkbox"><input type="checkbox" checked={muted} onChange={e=>{setMuted(e.target.checked);audio.set(e.target.checked,volume);}}/>Mute on this device</label>
  <label>Volume<input type="range" min="0" max="1" step=".05" value={volume} onChange={e=>{setVolume(Number(e.target.value));audio.set(muted,Number(e.target.value));}}/></label>
  <p className="note" role="status">{sound}</p>
 </div>;
}
export function IntegratedScene({room,now,motion,connected}:{room:RoomSnapshot;now:number;motion:boolean;connected:boolean}){
 const presentation=room.battlePresentation!,form=presentation.form;
 const [failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 const body=familyBody(form.family),rival=room.rival!.id as RivalBody;
 useEffect(()=>{let live=true;void preloadSample(retry>0,body,rival,presentation.arena).then(ok=>{if(live)setFailed(!ok);});return()=>{live=false;};},[body,rival,presentation.arena,retry]);
 if(room.phase==='release'){
  const frame=integrationFrame(form,now,motion);
  return <section className="v2-integration" aria-label="DNA integration" data-fluid-pulse="false" data-integration-phase={frame.phase}>
   <div className="v2-integration-copy"><h2>{frame.phase==='integrating'?'Integrating DNA…':'Creature released. Prepare for combat!'}</h2><p>A new shape, the same powers. Surviving DNA determines its abilities.</p>{!connected&&<p role="status">Reconnecting · the experiment continues</p>}</div>
   <div className="v2-integrating-old" style={{opacity:1-frame.reveal,transform:motion?`rotate(${Math.sin(frame.elapsed*.013)*.6*(1-frame.reveal)}deg)`:undefined}}>{room.creature&&<CreaturePortrait creature={room.creature}/>}</div>
   <svg className="v2-integrating-new" viewBox="0 0 800 720" style={{opacity:frame.reveal}} role="img" aria-label="Integrated specimen revealed"><g transform="translate(400 680)"><Sprite key={retry} onError={()=>setFailed(true)} body={body} pose="idle" modifiers={form.modifiers} time={now-form.integration.startsAtMs} motion={motion}/></g></svg>
   {failed&&<div role="status" className="integration-failure">Artwork unavailable. The release continues on time. <button onClick={()=>{setFailed(false);setRetry(n=>n+1);}}>Retry integration artwork</button></div>}
  </section>;
 }
 if(!room.battle)return null;
 return <><Stage creatureName={room.creatureName??'Our specimen'} outcome={room.result?.outcome??null} timeline={room.battle} form={form} arena={presentation.arena} time={Math.max(0,now-room.battle.startsAtMs)} motion={motion}/>{!connected&&<p role="status">Reconnecting · battle playback continues</p>}<p className="battle-clock">{Math.max(0,Math.ceil((room.battle.startsAtMs+room.battle.durationMs-now)/1000))}s · The laboratory records the outcome.</p><details><summary>Battle record</summary><ol tabIndex={0} className="battle-record" aria-label="Chronological battle record">{room.battle.events.filter(e=>e.offsetMs<=now-room.battle!.startsAtMs).map(e=><li key={e.sequence}>{(e.offsetMs/1000).toFixed(1)}s · {e.caption}</li>)}</ol></details></>;
}

export function IntegratedRivalPortrait({id,name}:{id:string;name:string}){
 const [failed,setFailed]=useState(false);
 if(!RIVAL_BODIES.includes(id as RivalBody))return <p>Rival artwork unavailable.</p>;
 return <><svg className="integrated-rival-portrait" viewBox="0 0 800 720" role="img" aria-label={`${name} silhouette`}><g transform="translate(400 680)"><Sprite body={id as RivalBody} pose="idle" motion={false} onError={()=>setFailed(true)}/></g></svg>{failed&&<span role="status">Rival artwork unavailable; its strength and weakness remain below.</span>}</>;
}
