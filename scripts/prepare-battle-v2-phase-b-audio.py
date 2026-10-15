#!/usr/bin/env python3
"""Balance/encode Phase B supplied replacements; retain prior procedural history."""
import array, hashlib, json, math, subprocess, wave
from pathlib import Path
root=Path('assets/battle-v2'); source=root/'source/user-review/phase-b'; out=root/'runtime/phase-b/audio'; out.mkdir(parents=True,exist_ok=True)
names=['electric','poison','bleed','restraint','roar','regeneration','slowing','crawling','malfunction','detach']
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def measure(samples,rate,channels):
 values=[v/32768 for v in samples]; peak=max(map(abs,values)); rms=math.sqrt(sum(v*v for v in values)/len(values)); block=max(1,rate*channels//100)
 windows=[math.sqrt(sum(v*v for v in values[i:i+block])/len(values[i:i+block])) for i in range(0,len(values),block)]
 active=[v for v in windows if v>=max(windows)*.1]; active_rms=math.sqrt(sum(v*v for v in active)/len(active))
 db=lambda v:round(20*math.log10(max(1e-10,v)),3)
 return {'peakDbFS':db(peak),'rmsDbFS':db(rms),'activeRmsDbFS':db(active_rms)}
records=[]
for name in names:
 path=source/(name+'.wav')
 with wave.open(str(path)) as w:
  assert w.getsampwidth()==2 and w.getcomptype()=='NONE'; rate=w.getframerate(); channels=w.getnchannels(); frames=w.getnframes(); samples=array.array('h',w.readframes(frames))
 before=measure(samples,rate,channels); target=-32 if name=='ambient' else -20
 # Linear gain preserves dynamics. Cap gain/peaks instead of flattening quiet bubbles or ambience.
 gain=round(min(target-before['activeRmsDbFS'],-5-before['peakDbFS'],12),3)
 dual_mono=channels==2 and samples[::2]==samples[1::2]; output_channels=1 if dual_mono else channels
 # FFmpeg's default stereo-to-mono mix boosts duplicated channels; use one identical channel instead.
 pan='pan=mono|c0=c0,' if dual_mono else ''
 fade=.02 if name=='ambient' else .002; tail=.02 if name=='ambient' else .005
 processing=lambda g:f'{pan}volume={g}dB,afade=t=in:d={fade},afade=t=out:st={frames/rate-tail}:d={tail}'
 dest=out/(name+'.m4a'); subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(path),'-map_metadata','-1','-af',processing(gain),'-ar',str(rate),'-ac',str(output_channels),'-c:a','aac','-profile:a','aac_low','-b:a','48k' if output_channels==1 else '64k','-movflags','+faststart',str(dest)],check=True)
 decoded=array.array('h',subprocess.check_output(['ffmpeg','-hide_banner','-loglevel','error','-i',str(dest),'-f','s16le','-acodec','pcm_s16le','-']))
 after=measure(decoded,rate,output_channels)
 # AAC can overshoot transient peaks. Re-encode from the untouched master with additional headroom.
 if after['peakDbFS']>-4:
  gain=round(gain- (after['peakDbFS']+4.5),3)
  subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(path),'-map_metadata','-1','-af',processing(gain),'-ar',str(rate),'-ac',str(output_channels),'-c:a','aac','-profile:a','aac_low','-b:a','48k' if output_channels==1 else '64k','-movflags','+faststart',str(dest)],check=True)
  decoded=array.array('h',subprocess.check_output(['ffmpeg','-hide_banner','-loglevel','error','-i',str(dest),'-f','s16le','-acodec','pcm_s16le','-']))
  after=measure(decoded,rate,output_channels)
 assert after['peakDbFS']<-3, f'{name} loses codec headroom'
 records.append({'id':name,'source':str(path),'submittedSource':f'docs/battle-v2-phase-b-review/SJM_change-files/{name}.wav','sourceSha256':sha(path),'sourceBytes':path.stat().st_size,'sourceLevels':before,'gainDb':gain,'edgeFadeSeconds':{'in':fade,'out':tail},'targetActiveRmsDbFS':target,'peakCeilingBeforeEncodingDbFS':-5,'path':str(dest),'url':'/'+str(dest),'bytes':dest.stat().st_size,'sha256':sha(dest),'durationSeconds':frames/rate,'sampleRate':rate,'channels':output_channels,'sourceChannels':channels,'dualMonoCollapsed':dual_mono,'codec':'AAC-LC','encodedLevels':after})
ledger={'origin':'User-supplied sound replacements received 14 October 2026; no creation tool/prompts supplied','license':'Original authorship/licensing unspecified by supplier; retained for development review, no third-party license invented','tool':'FFmpeg: linear gain, AAC-LC, original 22050 Hz; mono only for identical source channels','normalization':'10ms RMS windows above -20dB relative to loudest window; target -20dBFS foreground/-32dBFS ambience, gain capped +12dB and pre-encode peak -5dBFS; measure decoded output','playbackAdjustments':{'source':'src/client/battle-v2/effects.ts SOUND_GAINS','amplitudeMultipliers':{'strike':1.15,'guard':1.15,'recoil':1.035,'defeat':1.15},'applied':'Web Audio voice gain before the existing limiter/device master; encoded files remain normalized'},'productionScript':'scripts/prepare-battle-v2-phase-b-audio.py','scriptSha256':sha(Path('scripts/prepare-battle-v2-phase-b-audio.py')),'ffmpegVersion':subprocess.check_output(['ffmpeg','-version']).decode().splitlines()[0],'priorProcedural':'assets/battle-v2/source/phase-b/audio/procedural-history/provenance.json','supersedes':'Procedural Phase B cues; recover and shards now have no sound','records':records}
(root/'phase-b-audio-provenance.json').write_text(json.dumps(ledger,indent=2)+'\n'); core=json.loads((root/'audio-provenance.json').read_text())['records']; Path('src/assets/battle-v2/audio.json').write_text(json.dumps({**{r['id']:r['url'] for r in core},**{r['id']:r['url'] for r in records}},indent=2)+'\n')
print(f'Prepared {len(records)} supplied sounds: {sum(r["sourceBytes"] for r in records)} original bytes -> {sum(r["bytes"] for r in records)} AAC bytes.')
