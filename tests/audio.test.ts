import test from 'node:test';
import assert from 'node:assert/strict';
import {SampleAudio} from '../src/client/battle-v2/audio.ts';

// Model suspended/interrupted iOS resumes explicitly. Browser tests separately
// exercise real trusted touch input, AAC decoding and native AudioContext nodes.
function environment({pending=false,captureFails=false,muted=false,sessionThrows=false}={}){
 const originals=new Map<string,PropertyDescriptor|undefined>();
 const document=Object.assign(new EventTarget(),{hidden:false});
 let fetches=0,decodes=0,starts=0,sessionType='ambient',resumeCalls=0;
 const param=()=>({value:0,cancelScheduledValues(){},setValueAtTime(value:number){this.value=value;},linearRampToValueAtTime(value:number){this.value=value;}});
 const node=()=>({gain:param(),connect(){},disconnect(){},start(){starts++;},stop(){},buffer:null,loop:false,onended:null});
 class Context {
  state='suspended';currentTime=0;destination={};
  resume(){resumeCalls++;if(pending&&resumeCalls===1)return new Promise<void>(()=>{});this.state='running';return Promise.resolve();}
  createGain(){return node();}
  createDynamicsCompressor(){return {...node(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()};}
  createMediaStreamDestination(){if(captureFails)throw Error('Unsupported capture');return node();}
  createBufferSource(){return node();}
  decodeAudioData(){decodes++;return Promise.resolve({duration:.5});}
  close(){this.state='closed';return Promise.resolve();}
 }
 const audioSession={get type(){return sessionType;},set type(value){if(sessionThrows)throw Error('Unsupported session');sessionType=value;}};
 for(const [key,value]of Object.entries({document,navigator:{audioSession},AudioContext:Context,localStorage:{getItem:()=>muted?JSON.stringify({muted:true,volume:.7}):null,setItem(){}},fetch:async()=>{fetches++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};}})){
  originals.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
 }
 return {document,metrics:()=>({fetches,decodes,starts,sessionType,resumeCalls}),restore(){for(const[key,descriptor]of originals)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}};
}

test('a never-settling early resume cannot lock out a later real gesture',async()=>{
 const env=environment({pending:true}),audio=new SampleAudio();
 try{
  void audio.unlock();assert.equal(audio.context?.state,'suspended');
  await audio.unlock();assert.equal(audio.ready,true);assert.equal(env.metrics().resumeCalls,2);
  assert.equal(env.metrics().fetches,24);assert.equal(env.metrics().decodes,24);assert.equal(env.metrics().starts,1);
  assert.equal(audio.status,'Sound enabled · local device');assert.equal(env.metrics().sessionType,'playback');
 }finally{audio.close();env.restore();}
});
test('simultaneous gesture/manual retries share decode and one ambient graph',async()=>{
 const env=environment(),audio=new SampleAudio();try{
  await Promise.all([audio.unlock(),audio.unlock(),audio.unlock()]);
  assert.equal(env.metrics().fetches,24);assert.equal(env.metrics().starts,1);
  assert.equal(audio.unlocking,false);audio.play('strike');assert.equal(audio.foregroundPlayed,1);
 }finally{audio.close();env.restore();}
});
test('interrupted context resumes without refetching; saved mute and hidden-page silence win',async()=>{
 const env=environment({muted:true}),audio=new SampleAudio();try{
  await audio.unlock();assert.equal(audio.muted,true);assert.equal(audio.master?.gain.value,0);
  audio.play('strike');assert.equal(audio.foregroundPlayed,0);
  (audio.context as unknown as {state:string}).state='interrupted';await audio.unlock();assert.equal(audio.ready,true);
  assert.equal(env.metrics().fetches,24);assert.equal(env.metrics().starts,1);
  audio.set(false,.7);assert.equal(audio.master?.gain.value,.7);env.document.hidden=true;env.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(audio.master?.gain.value,0);audio.play('strike');assert.equal(audio.foregroundPlayed,0);
  env.document.hidden=false;env.document.dispatchEvent(new Event('visibilitychange'));assert.equal(audio.master?.gain.value,.7);
 }finally{audio.close();env.restore();}
});
test('optional audio-session/capture APIs cannot prevent normal playback',async()=>{
 const env=environment({captureFails:true,sessionThrows:true}),audio=new SampleAudio();try{
  await audio.unlock();assert.equal(audio.ready,true);assert.equal(audio.capture,null);audio.play('bite');assert.equal(audio.foregroundPlayed,1);
 }finally{audio.close();env.restore();}
});
test('closing during unlock never starts late ambience or repopulates buffers',async()=>{
 const env=environment(),audio=new SampleAudio();try{
  const unlocking=audio.unlock();audio.close();await unlocking;
  assert.equal(audio.context,null);assert.equal(audio.buffers.size,0);assert.equal(env.metrics().starts,0);
 }finally{audio.close();env.restore();}
});

test('failed asset decode is retryable without reloading successful samples',async()=>{
 const env=environment(),audio=new SampleAudio();try{
  const realFetch=globalThis.fetch;let first=true;
  globalThis.fetch=(...args)=>{if(first){first=false;return Promise.resolve({ok:false} as Response);}return realFetch(...args);};
  await audio.unlock();assert.equal(audio.ready,false);assert.match(audio.status,/unavailable/);
  assert.equal(audio.buffers.size,23);await audio.unlock();assert.equal(audio.ready,true);
  assert.equal(env.metrics().decodes,24);assert.equal(env.metrics().starts,1);
 }finally{audio.close();env.restore();}
});
