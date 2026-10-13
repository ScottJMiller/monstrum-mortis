import { useEffect, useMemo, useRef, useState } from 'react';
import type { BattleTimeline, CreatureView } from '../../shared/types.ts';
import type { IntegratedForm } from '../../shared/integrated-form.ts';
import data from '../../assets/battle-v2/fixtures.json';
import artwork from '../../assets/battle-v2/art.json';
import sounds from '../../assets/battle-v2/audio.json';
import { CreaturePortrait } from '../BattleStage.tsx';
import { Stage } from './Stage.tsx';
import { POSES, Sprite } from './Sprite.tsx';
import type { Pose } from './animation.ts';
import { acceptedAccent, integrationFrame, timelyCues } from './animation.ts';
import { EFFECTS, effectFor } from './effects.ts';
import { SampleAudio } from './audio.ts';
import { preloadSample } from './loading.ts';
import './preview.css';
const fixtures=data.fixtures as unknown as {name:string;label:string;ids:string[];form:IntegratedForm;sequence:BattleTimeline['initialCreature'][];timeline:BattleTimeline}[];
const samplers=data.samplers as unknown as {name:string;label:string;form:IntegratedForm}[];
const starter:CreatureView={compositionSeed:'preview-starter',revealedMutationIds:[],parts:[{instanceId:'b',slot:'body',assetId:'creature.blob',scale:1,variant:0,contributorIds:[]},{instanceId:'e',slot:'eyes',assetId:'creature.eyes',scale:1,variant:0,contributorIds:[]},{instanceId:'m',slot:'mouth',assetId:'creature.mouth',scale:1,variant:0,contributorIds:[]}]};
export function Preview(){
 const [loading,setLoading]=useState<'loading'|'ready'|'error'>('loading');
 useEffect(()=>{let live=true;void preloadSample().then(ok=>{if(live)setLoading(ok?'ready':'error');});return()=>{live=false;};},[]);
 const [mode,setMode]=useState('battle'),[index,setIndex]=useState(2),[sampler,setSampler]=useState(0),[pose,setPose]=useState<Pose>('idle'),[mirror,setMirror]=useState(false);
 const [attackStyle,setAttackStyle]=useState<'generic'|'bite'>('generic'),[soundCue,setSoundCue]=useState('strike');
 const [time,setTime]=useState(0),[playing,setPlaying]=useState(false),[motion,setMotion]=useState(true),[reduced,setReduced]=useState(matchMedia('(prefers-reduced-motion: reduce)').matches),[hidden,setHidden]=useState(document.hidden);
 const [sound,setSound]=useState('Sound locked · enable on this device'),audio=useMemo(()=>new SampleAudio(),[]),[muted,setMuted]=useState(audio.muted),[volume,setVolume]=useState(audio.volume);
 const [accent,setAccent]=useState<ReturnType<typeof acceptedAccent>>(null),[injected,setInjected]=useState(0),[acceptMessage,setAcceptMessage]=useState('No accepted injections yet.');
 const liveTime=useRef(time);liveTime.current=time;
 const clock=useRef({time:0,started:0});
 const lastAudio=useRef(0),lastIntegration=useRef(-1),current=fixtures[index]!,length=mode==='injection'?6000:current.timeline.durationMs+5000;
 const animate=motion&&!reduced&&!hidden,frame=integrationFrame(current.form,time,animate),study=samplers[sampler]!;
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)'),onMedia=()=>setReduced(media.matches),onVisibility=()=>{setHidden(document.hidden);lastAudio.current=liveTime.current-5000;audio.silence();};media.addEventListener('change',onMedia);document.addEventListener('visibilitychange',onVisibility);return()=>{media.removeEventListener('change',onMedia);document.removeEventListener('visibilitychange',onVisibility);};},[audio]);
 useEffect(()=>()=>audio.close(),[audio]);
 useEffect(()=>{if(playing)clock.current={time:liveTime.current,started:performance.now()};},[playing]);
 useEffect(()=>{if(!playing||hidden)return;let id=0;const tick=(now:number)=>{setTime(Math.min(length,clock.current.time+now-clock.current.started));id=requestAnimationFrame(tick);};id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);},[playing,hidden,length]);
 useEffect(()=>{if(time>=length)setPlaying(false);},[time,length]);
 useEffect(()=>{
  const elapsed=time-5000,prior=lastAudio.current;lastAudio.current=elapsed;
  if(playing&&mode==='battle')for(const e of timelyCues(current.timeline.events,prior,elapsed,hidden)){audio.play(EFFECTS[effectFor(e)].sound!);if(e.magnitude>0&&e.target!==e.actor)audio.play('recoil');}
  if(playing&&mode==='battle'&&time-lastIntegration.current>=0&&time-lastIntegration.current<=250){if(lastIntegration.current<2000&&time>=2000)audio.play('integration');if(lastIntegration.current<3500&&time>=3500)audio.play('unleash');}
  lastIntegration.current=time;
 },[time,playing,mode,current,audio,hidden]);
 const seek=(value:number)=>{audio.silence();lastAudio.current=value-5000;lastIntegration.current=value;setTime(value);};
 const restart=()=>{setTime(0);lastAudio.current=-5000;lastIntegration.current=0;setPlaying(true);if(mode==='battle')audio.play('integration');};
 const accept=(count=1)=>{const latest=Math.min(current.sequence.length,injected+count);if(latest===injected){setAcceptMessage('Fixture sequence complete. Reset to repeat.');return;}setInjected(latest);setAccent(previous=>acceptedAccent(previous,latest,performance.now(),true));setAcceptMessage(`${latest} accepted injections · newest anatomy shown immediately`);audio.play('injection');};
 const [wall,setWall]=useState(performance.now());
 useEffect(()=>{if(hidden||(mode==='injection'?!accent:mode!=='poses'||!animate))return;let id=0;const tick=()=>{setWall(performance.now());if(mode==='poses'||performance.now()<(accent?.ends??0))id=requestAnimationFrame(tick);};id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);},[mode,accent,animate,hidden]);
 const pulse=mode==='injection'&&!!accent&&wall<accent.ends;
 // Private diagnostic reference exists only in this DEV-only module, for output capture/bounds evidence.
 useEffect(()=>{Object.assign(window,{__battleV2Audio:audio});return()=>{delete (window as unknown as Record<string,unknown>).__battleV2Audio;};},[audio]);
 return <main className="v2-preview" data-motion={animate}>
  <header className="v2-heading"><p className="v2-eyebrow">MONSTRUM MORTIS · DEVELOPMENT STUDY</p><h1>The integration theatre</h1><p>Phase A animation &amp; sound review. Production play is unchanged.</p></header>
  <section className="v2-panel" style={{backgroundImage:`url(${artwork.panel})`}} aria-label="Preview instrument panel">
   <div className="v2-control-grid">
    <label>Study<select aria-label="Study" value={mode} onChange={e=>{setMode(e.target.value);setPlaying(false);seek(0);}}><option value="battle">Integration and battle</option><option value="injection">Accepted injection feedback</option><option value="poses">Pose and modifier registration</option></select></label>
    <label>Timeline fixture<select aria-label="Timeline fixture" value={index} onChange={e=>{setIndex(Number(e.target.value));setPlaying(false);seek(0);setInjected(0);setAccent(null);}}>{fixtures.map((f,i)=><option key={f.name} value={i}>{f.name}</option>)}</select></label>
    <div className="v2-toggle"><label><input type="checkbox" checked={motion} onChange={e=>setMotion(e.target.checked)}/> Decorative motion</label><span>{reduced?'Device reduced motion active':motion?'Motion enabled':'Static presentation'}</span></div>
    <div className="v2-audio"><button onClick={()=>{void audio.unlock().then(()=>setSound(audio.status));}}>Enable sound</button><label><input type="checkbox" checked={muted} onChange={e=>{setMuted(e.target.checked);audio.set(e.target.checked,volume);}}/> Mute on this device</label><label>Volume<input type="range" min="0" max="1" step=".05" value={volume} onChange={e=>{setVolume(Number(e.target.value));audio.set(muted,Number(e.target.value));}}/></label></div>
   </div>
   <p className="v2-sound-state" role="status">{sound}</p>
   <div className="v2-audition"><label>Preview sound<select aria-label="Preview sound" value={soundCue} onChange={e=>setSoundCue(e.target.value)}>{Object.keys(sounds).filter(name=>name!=="ambient").map(name=><option key={name}>{name}</option>)}</select></label><button onClick={()=>audio.play(soundCue)}>Play selected sound</button><span>Development sound audition · ambient loops after unlock</span></div>
   <p className="v2-fixture-label">{mode==='poses'?study.label:current.label}</p>
   {mode==='battle'&&<div className="v2-transport"><button onClick={()=>{if(playing){setPlaying(false);audio.silence();}else if(time>=length)restart();else{lastAudio.current=time-5000;lastIntegration.current=time;setPlaying(true);if(time===0)audio.play('integration');}}}>{playing?'Pause recording':'Play recording'}</button><button onClick={restart}>Restart study</button><label>Recording time<input aria-label="Recording time" type="range" min="0" max={length} step="10" value={time} onChange={e=>{setPlaying(false);seek(Number(e.target.value));}}/><output>{(time/1000).toFixed(2)}s / {(length/1000).toFixed(1)}s</output></label></div>}
   {mode==='poses'&&<div className="v2-control-grid"><label>Modifier fixture<select aria-label="Modifier fixture" value={sampler} onChange={e=>setSampler(Number(e.target.value))}>{samplers.map((s,i)=><option key={s.name} value={i}>{s.name}</option>)}</select></label><label>Pose role<select aria-label="Pose role" value={pose} onChange={e=>setPose(e.target.value as Pose)}>{POSES.map(p=><option key={p}>{p}</option>)}</select></label><label>Attack artwork<select aria-label="Attack artwork" value={attackStyle} onChange={e=>setAttackStyle(e.target.value as 'generic'|'bite')}><option value="generic">Strike / slash</option><option value="bite">Forward bite lunge</option></select></label><label><input type="checkbox" checked={mirror} onChange={e=>setMirror(e.target.checked)}/> Mirror anatomy (words stay readable)</label></div>}
  </section>
  {loading!=='ready'&&<div className="v2-failure" role="status">{loading==='loading'?'Preparing sample artwork. The recording clock continues.':'Some sample artwork is unavailable. Text, health and controls remain available.'}{loading==='error'&&<button onClick={()=>{setLoading('loading');void preloadSample(true).then(ok=>setLoading(ok?'ready':'error'));}}>Retry preload</button>}</div>}
  {mode==='battle'&&(time<5000?<section className={`v2-integration ${animate?'':'v2-still'}`} data-phase={frame.phase} data-fluid-pulse="false" aria-label="Five-second DNA integration">
   <div className="v2-integration-machinery" aria-hidden="true" style={{opacity:animate?.10+.025*Math.sin(time*.006):.10}}/><div className="v2-integration-copy"><h2>{frame.phase==='unleash'?'Creature released. Prepare for combat!':'Integrating DNA…'}</h2><p>{(5-time/1000).toFixed(1)}s to battle · release clock continues</p></div>
   <div className="v2-integrating-old" style={{opacity:1-frame.reveal,transform:animate?`rotate(${Math.sin(time*.016)*.7*(1-frame.reveal)}deg) scale(${1+Math.sin(time*.013)*.012*(1-frame.reveal)})`:undefined}}><CreaturePortrait creature={current.timeline.initialCreature}/></div>
   <svg className="v2-integrating-new" viewBox="0 0 800 720" style={{opacity:frame.reveal}} aria-label="Integrated family 1 revealed"><g transform="translate(400 680)"><Sprite body="family-1" pose="idle" modifiers={current.form.modifiers} motion={animate} time={time}/></g></svg>
  </section>:<Stage timeline={current.timeline} form={current.form} time={time-5000} motion={animate}/>)}
  {mode==='injection'&&<section className="v2-injection-study" data-accent-sequence={accent?.sequence??0} data-pulse={pulse&&animate} aria-label="Accepted injection study"><div className="v2-injection-chamber"><div className="v2-tubes" aria-hidden="true"><span/><span/></div><div className={`v2-injection-creature ${pulse&&animate?'v2-quiver':''}`}><CreaturePortrait creature={injected?current.sequence[injected-1]!:starter}/></div></div><div className="v2-injection-controls"><h2>A promising number of limbs</h2><p>Accepted server projections from this fixture. This study sends no gameplay actions.</p><p role="status">{acceptMessage}</p><button onClick={()=>accept()}>Accept next fixture injection</button><button onClick={()=>accept(3)}>Accept three together</button><button onClick={()=>setAcceptMessage('Specimen selected. No accepted response; no pulse.')}>Select only</button><button onClick={()=>setAcceptMessage('Rejected fixture request. No pulse or dose consumed.')}>Reject request</button><button onClick={()=>{setInjected(0);setAccent(null);setAcceptMessage('No accepted injections yet.');}}>Reset injection study</button></div></section>}
  {mode==='poses'&&<section className="v2-pose-study" aria-label="Pose registration study"><h2>{study.name} · {pose}</h2><p>{study.form.family==='blob'?'No family votes: animated starter. Its full battle pose set is planned for Phase B.':'A new shape, the same powers. Surviving DNA still determines what the creature can do.'}</p><svg viewBox="0 0 1600 760" role="img" aria-label={`${study.name} in ${pose} pose. ${study.label}`}><g transform="translate(420 700)">{study.form.family==='blob'?<foreignObject x="-240" y="-570" width="480" height="570"><div className={animate?'v2-blob-breath':''}><CreaturePortrait creature={starter}/></div></foreignObject>:<Sprite body="family-1" pose={pose} attackStyle={attackStyle} modifiers={study.form.modifiers} mirrored={mirror} motion={animate} time={wall}/>}</g><g transform="translate(1220 700)"><Sprite body="iron-widow" pose={pose} mirrored={mirror} motion={animate} time={wall}/></g></svg></section>}
  <details className="v2-scope"><summary>Sample scope and remaining production</summary><p>Five pose roles each for family 1 and Iron Widow; strike, slash, bite, corrosion and retaliation with sound. Dodge, guard and defeat reactions are demonstrated. Other effect families receive captions and are planned: {Object.entries(EFFECTS).filter(([,e])=>e.status==='planned').map(([id])=>id).join(', ')}.</p><p>Remaining families/rivals, damage masks, production persistence, Americas-only new entries and entry simplification belong to Phases B/C after sample acceptance. Physical devices and human sound/balance review remain outstanding. This is a recording preview, not a multiplayer game or new server endpoint.</p></details>
 </main>;
}
