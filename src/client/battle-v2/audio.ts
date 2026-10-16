import sounds from '../../assets/battle-v2/audio.json' with {type:'json'};
import { SOUND_GAINS } from './effects.ts';
/** Bundled balanced supplied samples, gesture unlock, bounded timely playback, device-local settings. */
export class SampleAudio {
 context:AudioContext|null=null; buffers=new Map<string,AudioBuffer>(); voices=new Set<AudioBufferSourceNode>();
 master:GainNode|null=null; limiter:DynamicsCompressorNode|null=null; ambienceGain:GainNode|null=null; ambient:AudioBufferSourceNode|null=null;
 capture:MediaStreamAudioDestinationNode|null=null; muted=false; volume=.5; status='Sound locked · enable on this device';
 unlocking=false; foregroundPlayed=0; dropped=0; peakVoices=0; generation=0; visibility=()=>{};
 constructor(){try{const stored=JSON.parse(localStorage.getItem('mm.battle-v2.audio')??'null');if(stored){this.muted=!!stored.muted;this.volume=Math.max(0,Math.min(1,Number(stored.volume)||0));}}catch{/* storage failure never gates preview */}}
 private preparing:Promise<void>|null=null;
 private attempt=0;
 get ready(){return this.context?.state==='running'&&this.buffers.size===Object.keys(sounds).length&&this.ambient!==null;}
 /** Must be called synchronously from a real gesture. A pending resume must not
  * prevent a later tap from resuming the same context (notably on iOS). */
 async unlock(){
  const generation=this.generation,attempt=++this.attempt;
  try{
   // WebKit's default ambient session follows the ringer switch. Playback uses
   // media volume, while our explicit mute/hidden-page gain still takes priority.
   try{const session=(navigator as Navigator&{audioSession?:{type:string}}).audioSession;if(session)session.type='playback';}catch{/* optional browser API */}
   const context=this.context??=new AudioContext();
   if(context.state!=='running')await context.resume();
   if(generation!==this.generation||context!==this.context)return;
   if(context.state!=='running'){this.status='Sound paused · tap Enable sound';return;}
   // Only fetching/decoding/graph setup is deduplicated, never the gesture resume.
   if(!this.preparing&&!this.ready){
    this.unlocking=true;
    this.preparing=this.prepare(context,generation).finally(()=>{if(generation===this.generation){this.preparing=null;this.unlocking=false;}});
   }
   await this.preparing;
   if(generation===this.generation)this.status=this.ready?'Sound enabled · local device':'Sound paused · tap Enable sound';
  }catch{if(generation===this.generation&&attempt===this.attempt)this.status='Sound unavailable · retry Enable sound; captions remain available';}
 }
 private async prepare(context:AudioContext,generation:number){
  if(!this.master){
   this.master=context.createGain();this.limiter=context.createDynamicsCompressor();this.limiter.threshold.value=-6;this.limiter.knee.value=3;this.limiter.ratio.value=16;this.limiter.attack.value=.003;this.limiter.release.value=.10;this.limiter.connect(this.master);this.master.connect(context.destination);
   // Capture is a review convenience, not a prerequisite for audible playback.
   try{this.capture=context.createMediaStreamDestination();this.master.connect(this.capture);}catch{/* unavailable on some browsers */}
   const t=context.currentTime;this.master.gain.setValueAtTime(0,t);
   this.master.gain.linearRampToValueAtTime(this.muted||document.hidden?0:this.volume,t+.5);
  }else this.apply();
  const decoded=await Promise.allSettled(Object.keys(sounds).map(async name=>{
   if(this.buffers.has(name))return;
   const response=await fetch(sounds[name as keyof typeof sounds]);if(!response.ok)throw new Error('Sound asset unavailable');
   const buffer=await context.decodeAudioData(await response.arrayBuffer());
   if(generation===this.generation)this.buffers.set(name,buffer);
  }));
  const failure=decoded.find(result=>result.status==='rejected');if(failure?.status==='rejected')throw failure.reason;
  if(generation!==this.generation)return;
  if(!this.ambient){this.ambient=context.createBufferSource();this.ambient.buffer=this.buffers.get('ambient')!;this.ambient.loop=true;this.ambienceGain=context.createGain();this.ambienceGain.gain.value=.18;this.ambient.connect(this.ambienceGain);this.ambienceGain.connect(this.limiter??this.master);this.ambient.start();}
  document.removeEventListener('visibilitychange',this.visibility);
  this.visibility=()=>{if(document.hidden)this.silence();this.apply();};document.addEventListener('visibilitychange',this.visibility);
 }
 set(muted:boolean,volume:number){this.muted=muted;this.volume=Math.max(0,Math.min(1,volume));this.apply();try{localStorage.setItem('mm.battle-v2.audio',JSON.stringify({muted,volume:this.volume}));}catch{}}
 apply(){if(this.master&&this.context){this.master.gain.cancelScheduledValues(this.context.currentTime);this.master.gain.setValueAtTime(this.muted||document.hidden?0:this.volume,this.context.currentTime);}}
 play(name:string){
  if(!this.context||this.context.state!=='running'||!this.master||this.muted||document.hidden)return;
  const buffer=this.buffers.get(name);if(!buffer)return;
  if(this.voices.size>=8){this.dropped++;return;}
  const voice=this.context.createBufferSource();voice.buffer=buffer;const level=this.context.createGain();level.gain.value=.18*(SOUND_GAINS[name]??1);voice.connect(level);level.connect(this.limiter??this.master);this.voices.add(voice);this.peakVoices=Math.max(this.peakVoices,this.voices.size);this.foregroundPlayed++;
  voice.onended=()=>{this.voices.delete(voice);voice.disconnect();level.disconnect();};voice.start();
  if(this.ambienceGain){const g=this.ambienceGain.gain,t=this.context.currentTime;g.cancelScheduledValues(t);g.setValueAtTime(.045,t);g.linearRampToValueAtTime(.18,t+buffer.duration+.15);}
 }
 silence(){for(const voice of this.voices){try{voice.stop();}catch{}}this.voices.clear();}
 close(){this.generation++;this.preparing=null;this.unlocking=false;document.removeEventListener('visibilitychange',this.visibility);this.silence();this.ambient?.stop();this.ambient=null;this.buffers.clear();void this.context?.close();this.context=null;this.master=null;this.limiter=null;this.capture=null;}
}

/** Touch-down is not user activation. Use completed taps/clicks (and keyboard)
 * so Safari receives resume() inside the gesture, including after interruption. */
export function bindAudioGestures(audio:SampleAudio,onStatus:(status:string)=>void,target:Window=window){
 let active=true;
 const unlock=(event:Event)=>{
  if(!event.isTrusted||audio.ready)return;
  if(event instanceof KeyboardEvent&&(event.key==='Escape'||event.metaKey||event.ctrlKey||event.altKey))return;
  void audio.unlock().then(()=>{if(active)onStatus(audio.status);});
 };
 target.addEventListener('click',unlock);
 target.addEventListener('touchend',unlock,{passive:true});
 target.addEventListener('keydown',unlock);
 return()=>{active=false;target.removeEventListener('click',unlock);target.removeEventListener('touchend',unlock);target.removeEventListener('keydown',unlock);};
}
