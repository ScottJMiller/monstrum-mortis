import { useState } from 'react';
import { BattleStage } from './BattleStage.tsx';
import fixtures from '../assets/combat-fixtures.json' with { type: 'json' };
import { PROTOCOL_VERSION } from '../shared/protocol.ts';
import type { BattleTimeline, RoomSnapshot } from '../shared/types.ts';
/** Vite development route only; no Worker debug endpoint or live room mutation. */
export function CombatGallery(){
 const [index,setIndex]=useState(0),[time,setTime]=useState(8000),[motion,setMotion]=useState(false);
 const timeline=fixtures[index]!.timeline as BattleTimeline;
 const room:RoomSnapshot={protocolVersion:PROTOCOL_VERSION,rulesVersion:'0.3.0',revision:0,serverTimeMs:time,roomId:'gallery',visibility:'private',presentation:'remote',phase:'battle',round:2,phaseDeadlineMs:timeline.durationMs,hostPlayerId:null,players:[],creature:timeline.initialCreature,teamScore:0,battle:timeline};
 return <main className="combat-gallery" style={{maxWidth:1100,margin:'auto',padding:'1rem'}}><h1>Combat artwork study</h1><p>Development fixtures from the authoritative producer. No live room or gameplay controls.</p><label htmlFor="rival-study">Rival study</label><select id="rival-study" value={index} onChange={e=>setIndex(Number(e.target.value))}>{fixtures.map((f,i)=><option key={f.name} value={i}>{f.name}</option>)}</select><label>Battle time<input type="range" min={0} max={timeline.durationMs} step={100} value={time} onChange={e=>setTime(Number(e.target.value))} /></label><label className="checkbox"><input type="checkbox" checked={motion} onChange={e=>setMotion(e.target.checked)} /> Event motion</label><BattleStage room={room} now={time} motion={motion} connected /></main>;
}
