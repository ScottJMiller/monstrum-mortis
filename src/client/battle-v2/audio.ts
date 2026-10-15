import sounds from '../../assets/battle-v2/audio.json';
import { SOUND_GAINS } from './effects.ts';
/** Bundled balanced supplied samples, gesture unlock, bounded timely playback, device-local settings. */
export class SampleAudio {
 context:AudioContext|null=null; buffers=new Map<string,AudioBuffer>(); voices=new Set<AudioBufferSourceNode>();
 master:GainNode|null=null; limiter:DynamicsCompressorNode|null=null; ambienceGain:GainNode|null=null; ambient:AudioBufferSourceNode|null=null;
 capture:MediaStreamAudioDestinationNode|null=null; muted=false; volume=.5; status='Sound locked · enable on this device';
 foregroundPlayed=0; dropped=0; peakVoices=0; generation=0; visibility=()=>{};
 constructor(){try{const stored=JSON.parse(localStorage.getItem('mm.battle-v2.audio')??'null');if(stored){this.muted=!!stored.muted;this.volume=Math.max(0,Math.min(1,Number(stored.volume)||0));}}catch{/* storage failure never gates preview */}}
 async unlock(){
  const generation=++this.generation;
  try{
   this.context??=new AudioContext();await this.context.resume();
   if(!this.master){this.master=this.context.createGain();this.limiter=this.context.createDynamicsCompressor();this.limiter.threshold.value=-6;this.limiter.knee.value=3;this.limiter.ratio.value=16;this.limiter.attack.value=.003;this.limiter.release.value=.10;this.limiter.connect(this.master);this.master.connect(this.context.destination);this.capture=this.context.createMediaStreamDestination();this.master.connect(this.capture);}
   this.apply();
   const names=Object.keys(sounds);
   await Promise.all(names.map(async name=>{if(this.buffers.has(name))return;const response=await fetch(sounds[name as keyof typeof sounds]);if(!response.ok)throw new Error('Sound asset unavailable');const buffer=await this.context!.decodeAudioData(await response.arrayBuffer());if(generation===this.generation)this.buffers.set(name,buffer);}));
   if(generation!==this.generation)return;
   if(!this.ambient){this.ambient=this.context.createBufferSource();this.ambient.buffer=this.buffers.get('ambient')!;this.ambient.loop=true;this.ambienceGain=this.context.createGain();this.ambienceGain.gain.value=.18;this.ambient.connect(this.ambienceGain);this.ambienceGain.connect(this.limiter??this.master);this.ambient.start();}
   document.removeEventListener('visibilitychange',this.visibility);
   this.visibility=()=>{if(document.hidden)this.silence();this.apply();};document.addEventListener('visibilitychange',this.visibility);
   this.status='Sound enabled · local device';
  }catch{this.status='Sound unavailable · retry Enable sound; captions remain available';}
 }
 set(muted:boolean,volume:number){this.muted=muted;this.volume=Math.max(0,Math.min(1,volume));this.apply();try{localStorage.setItem('mm.battle-v2.audio',JSON.stringify({muted,volume:this.volume}));}catch{}}
 apply(){if(this.master&&this.context)this.master.gain.setValueAtTime(this.muted||document.hidden?0:this.volume,this.context.currentTime);}
 play(name:string){
  if(!this.context||this.context.state!=='running'||!this.master||this.muted||document.hidden)return;
  const buffer=this.buffers.get(name);if(!buffer)return;
  if(this.voices.size>=8){this.dropped++;return;}
  const voice=this.context.createBufferSource();voice.buffer=buffer;const level=this.context.createGain();level.gain.value=.18*(SOUND_GAINS[name]??1);voice.connect(level);level.connect(this.limiter??this.master);this.voices.add(voice);this.peakVoices=Math.max(this.peakVoices,this.voices.size);this.foregroundPlayed++;
  voice.onended=()=>{this.voices.delete(voice);voice.disconnect();level.disconnect();};voice.start();
  if(this.ambienceGain){const g=this.ambienceGain.gain,t=this.context.currentTime;g.cancelScheduledValues(t);g.setValueAtTime(.045,t);g.linearRampToValueAtTime(.18,t+buffer.duration+.15);}
 }
 silence(){for(const voice of this.voices){try{voice.stop();}catch{}}this.voices.clear();}
 close(){this.generation++;document.removeEventListener('visibilitychange',this.visibility);this.silence();this.ambient?.stop();this.ambient=null;this.buffers.clear();void this.context?.close();this.context=null;this.master=null;this.limiter=null;this.capture=null;}
}
