import { useEffect, useId, useState } from 'react';
import type { CreatureView, RoomSnapshot } from '../shared/types.ts';
import { ART, axes, colorMatrix, creatureLayers, describeCreature, layerBounds } from './creature-render.ts';
import rivals from '../assets/rivals.json' with { type: 'json' };
import { battleFrame } from './battle-playback.ts';

/** The same anatomical layout, pivots and color matrices as both chamber renderers. */
export function CreaturePortrait({creature}:{creature:CreatureView}){
 const id=useId().replaceAll(':','');const [failed,setFailed]=useState<string[]>([]),[retry,setRetry]=useState(0);const layers=creatureLayers(creature);
 return <><svg className="battle-creature" preserveAspectRatio="xMidYMax meet" viewBox={`-48 12 696 ${Math.max(384,...layers.layers.map(l=>{const b=layerBounds(l);return b.top+b.height;}))-12}`} role="img" aria-label={describeCreature(creature)}>
  <defs>{ART.filter(a=>a.color||a.colorGrade).map(a=><filter key={a.id} id={`${id}-${a.id}`} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values={colorMatrix(a).join(' ')} /></filter>)}</defs>
  {layers.layers.map(l=>{const [a,b,c,d]=axes(l.rotation,l.skew),sign=l.mirror?-1:1;return <g key={l.key} opacity={l.opacity} transform={`translate(${l.x} ${l.y}) matrix(${a*sign} ${b*sign} ${c} ${d} 0 0)`}><image onError={()=>setFailed(previous=>previous.includes(l.asset.url)?previous:[...previous,l.asset.url])} href={retry?`${l.asset.url}?retry=${retry}`:l.asset.url} x={-l.width/2} y={-l.height/2} width={l.width} height={l.height} filter={l.asset.color||l.asset.colorGrade?`url(#${id}-${l.asset.id})`:undefined} /></g>;})}
 </svg>{(layers.missing.length>0||layers.layers.some(l=>failed.includes(l.asset.url)))&&<div className="battle-art-notice" role="status">Some creature artwork is unavailable. Health and the event record remain available.<button onClick={()=>{setRetry(n=>n+1);setFailed([]);}}>Retry creature artwork</button></div>}</>;
}
export function RivalPortrait({assetId, name, silhouette=false}:{assetId:string;name:string;silhouette?:boolean}){
 const [failed,setFailed]=useState(false),[retry,setRetry]=useState(0);useEffect(()=>{setFailed(false);setRetry(0);},[assetId]);const asset=rivals.find(a=>a.id===assetId);
 return failed||!asset?<p className="rival-art-fallback" role="status">{name} · artwork unavailable <button onClick={()=>{setRetry(n=>n+1);setFailed(false);}}>Retry rival artwork</button></p>:<img className={`rival-portrait${silhouette?' rival-silhouette':''}`} src={retry?`${asset.url}?retry=${retry}`:asset.url} alt={name} onError={()=>setFailed(true)} />;
}
export function BattleStage({room,now,motion,connected}:{room:RoomSnapshot;now:number;motion:boolean;connected:boolean}){
 const timeline=room.battle!;const frame=battleFrame(timeline,now);
 const pose=(side:'team'|'rival')=>{
  const e=frame.recent.findLast(e=>e.actor===side&&['attack','electric','malfunction','regeneration','detach'].includes(e.kind));
  const restraint=frame.visible.findLast(e=>e.target===side&&e.kind==='restraint'&&e.offsetMs+(e.durationMs??0)>frame.elapsed);
  const hit=frame.recent.findLast(e=>e.target===side&&e.magnitude>0&&['attack','poison','electric','bleed'].includes(e.kind));
  return frame[side==='team'?'teamHealth':'rivalHealth']<=0?'knockout':restraint?'restraint':hit&&(!e||hit.sequence>e.sequence)?'recoil':e?.kind??'idle';
 };
 return <section className={`battle-stage${motion?'':' battle-still'}`} aria-label="Automatic battle" data-battle-id={timeline.battleId} data-elapsed={frame.elapsed}>
  <header><p className="eyebrow">Rival laboratory / round {room.round}</p><h2>Trial by terrible science</h2><p>{connected?'Automatic combat · no actions required':'Connection lost · recorded battle playback; results await synchronization'}</p></header>
  <div className="battle-health"><label>Shared creature <meter min={0} max={100} value={frame.teamHealth} /> <span>{frame.teamHealth.toFixed(1)}%</span></label><label>{timeline.rival.name} <meter min={0} max={100} value={frame.rivalHealth} /><span>{frame.rivalHealth.toFixed(1)}%</span></label></div>
  <div className="battle-arena" data-camera={motion&&frame.recent.some(e=>['attack','electric'].includes(e.kind)&&e.magnitude>=10)?'impact':'wide'}>
   <div className="battle-camera">
   <div className="combatant team-combatant" data-pose={pose('team')}><CreaturePortrait creature={frame.creature} /></div>
   <div className="combatant rival-combatant" data-pose={pose('rival')}><RivalPortrait assetId={timeline.rival.assetId} name={timeline.rival.name} /></div>
   <span className="battle-versus" aria-hidden="true">VS</span>
   {frame.recent.some(e=>e.kind==='electric')&&<span className="battle-electric" aria-hidden="true">ϟ</span>}
   </div>
   <div className="battle-statuses" role="group" aria-label="Active battle conditions">{frame.visible.filter(e=>['poison','bleed','slowing','corrosion','restraint'].includes(e.kind)&&e.durationMs&&e.offsetMs+e.durationMs>frame.elapsed).filter((e,i,all)=>all.findLastIndex(other=>other.target===e.target&&other.kind===e.kind)===i).map(e=><span key={e.sequence} data-condition={e.kind}>{e.target==='team'?'Shared creature':timeline.rival.name}: {e.kind}</span>)}</div>
  </div>
  <ol className="battle-captions" aria-label="Recent battle events">{frame.captions.map(e=><li key={e.sequence}>{e.actor==='team'?'Our specimen':timeline.rival.name}: {e.caption}{e.magnitude>0?` (${e.magnitude.toFixed(1)})`:''}</li>)}</ol>
  <p className="sr-only" role="status">{frame.captions.at(-1)?.caption}</p>
  {frame.elapsed===timeline.durationMs&&<p role="status">Battle playback complete. Awaiting authoritative results.</p>}
  <details><summary>Battle record ({frame.visible.length} events)</summary><ol className="battle-record" tabIndex={0} aria-label="Chronological battle record">{frame.visible.map(e=><li key={e.sequence}>{(e.offsetMs/1000).toFixed(1)}s · {e.actor==='team'?'Shared creature':timeline.rival.name} · {e.caption}</li>)}</ol></details>
 </section>;
}
