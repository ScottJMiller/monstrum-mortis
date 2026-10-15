#!/usr/bin/env python3
"""Missing Phase B cues are original deterministic procedural audio, not claimed supplied recordings."""
import math,random,struct,wave,json,hashlib,subprocess,re
from pathlib import Path
r=Path('assets/battle-v2'); source=r/'source/phase-b/audio';out=r/'runtime/phase-b/audio';source.mkdir(parents=True,exist_ok=True);out.mkdir(parents=True,exist_ok=True)
rate=22050
recipes={'electric':(.65,1300,70,.75,.55),'poison':(.55,150,80,.4,.15),'bleed':(.28,110,60,.45,.15),'restraint':(.55,160,100,.40,.32),'roar':(.75,85,42,.55,.36),'regeneration':(.60,100,230,.25,.15),'slowing':(.65,95,40,.50,.22),'crawling':(.60,180,85,.48,.35),'malfunction':(.50,400,45,.75,.45),'detach':(.55,95,35,.45,.36),'recover':(.45,180,340,.15,.30),'shards':(.55,1200,480,.55,.50)}
records=[]
for i,(name,(seconds,start,end,noise,metal))in enumerate(recipes.items()):
 rng=random.Random(0x50484200+i);phase=0;filtered=0;samples=[]
 for n in range(round(seconds*rate)):
  t=n/rate;p=t/seconds;phase+=2*math.pi*(start+(end-start)*p)/rate;filtered=.65*filtered+.35*(rng.random()*2-1)
  envelope=min(1,t/.005)*min(1,(seconds-t)/.03)*(1-p)**.7
  pulse=1 if name not in ['electric','crawling'] else .55+.45*math.sin(t*70)**2
  raw=(math.sin(phase)*.2+filtered*noise+math.sin(phase*2.71)*metal*.25*math.exp(-t*8))*envelope*pulse*.25
  samples.append(round(max(-1,min(1,raw))*32767))
 master=source/(name+'.wav')
 with wave.open(str(master),'wb')as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(struct.pack('<'+'h'*len(samples),*samples))
 rms=math.sqrt(sum((n/32768)**2 for n in samples)/len(samples));peak=max(map(abs,samples))/32768;gain=min(-20-20*math.log10(rms),-6-20*math.log10(peak));dest=out/(name+'.m4a')
 subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(master),'-map_metadata','-1','-af',f'volume={gain}dB','-c:a','aac','-b:a','48k','-movflags','+faststart',str(dest)],check=True)
 records.append({'id':name,'source':str(master),'sourceSha256':hashlib.sha256(master.read_bytes()).hexdigest(),'runtime':str(dest),'url':'/'+str(dest),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'bytes':dest.stat().st_size,'seconds':seconds,'seed':0x50484200+i,'recipe':{'startHz':start,'endHz':end,'noise':noise,'metal':metal},'gainDb':gain})
 levels=subprocess.run(['ffmpeg','-hide_banner','-i',str(dest),'-af','volumedetect','-f','null','-'],capture_output=True,text=True,check=True).stderr
 records[-1]['encodedLevels']={'meanDbFS':float(re.search(r'mean_volume: ([\-\d.]+)',levels)[1]),'peakDbFS':float(re.search(r'max_volume: ([\-\d.]+)',levels)[1])}
(r/'phase-b-audio-provenance.json').write_text(json.dumps({'origin':'Original project-authored procedural oscillator/filtered-noise/inharmonic-pulse cues','license':'Project-authored output, no external sample license asserted','script':'scripts/prepare-battle-v2-phase-b-audio.py','scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'formulas':'Exact deterministic formulas and seeds retained in script; no audio API/runtime synthesis','records':records},indent=2)+'\n')
core=json.loads((r/'audio-provenance.json').read_text())['records'];Path('src/assets/battle-v2/audio.json').write_text(json.dumps({**{x['id']:x['url'] for x in core},**{x['id']:x['url'] for x in records}},indent=2)+'\n')
print(f'Prepared {len(records)} missing procedural cues, {sum(x["bytes"] for x in records)} compressed bytes; original supplied sounds preserved.')
