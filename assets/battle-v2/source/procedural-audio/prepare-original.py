#!/usr/bin/env python3
"""Original project-authored procedural sound. No third-party samples or generation API."""
import math, random, wave, struct, json, hashlib
from pathlib import Path
root=Path('assets/battle-v2'); out=root/'runtime/audio'; out.mkdir(parents=True,exist_ok=True)
rate=22050
# Envelope, swept oscillator, filtered noise and inharmonic metallic partials.
recipes={
 'strike':(.30,82,28,.70,.34), 'slash':(.34,740,90,.90,.08), 'bite':(.32,145,35,.65,.28),
 'corrosion':(.72,390,105,.70,.12), 'retaliation':(.40,990,175,.45,.40), 'miss':(.24,540,100,.60,.05),
 'guard':(.27,460,160,.25,.55), 'recoil':(.25,150,65,.40,.23), 'defeat':(.85,175,32,.48,.25),
 'result':(.60,330,110,.16,.50), 'injection':(.80,230,72,.55,.24), 'integration':(1.40,72,180,.30,.45),
 'unleash':(.52,115,35,.45,.48), 'ambient':(4.0,50,50,.035,.035),
}
records=[]
for seed,(name,(seconds,f0,f1,noise,metal)) in enumerate(recipes.items()):
 rng=random.Random(0x4d4d0000+seed); samples=[]; phase=0; filtered=0
 for i in range(round(seconds*rate)):
  t=i/rate; p=t/seconds; hz=f0+(f1-f0)*p; phase+=2*math.pi*hz/rate
  filtered=.72*filtered+.28*(rng.random()*2-1)
  attack=min(1,t/.012); env=attack*(1-p)**(1.8 if name!='ambient' else 0)
  if name=='ambient':env=min(1,t/.10,(seconds-t)/.10)*.40
  elif name=='integration':env=attack*min(1,(seconds-t)/.12)*(.2+.5*p)
  tone=math.sin(phase)*.23
  clang=sum(math.sin(phase*k)*math.exp(-t*decay) for k,decay in [(2.71,8),(4.13,12),(6.77,18)])*metal*.22
  bubbles=(math.sin(phase*(1+.2*math.sin(t*37)))*math.sin(t*53)**8*.2 if name in ['injection','corrosion','ambient'] else 0)
  raw=math.tanh((tone+filtered*noise+clang+bubbles)*1.8)*env*.68
  samples.append(round(max(-1,min(1,raw))*32767))
 path=out/(name+'.wav')
 with wave.open(str(path),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(struct.pack('<'+'h'*len(samples),*samples))
 data=path.read_bytes(); records.append({'id':name,'path':str(path),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'durationSeconds':seconds,'sampleRate':rate,'recipe':{'startHz':f0,'endHz':f1,'noise':noise,'metal':metal,'seed':0x4d4d0000+seed}})
(root/'audio-provenance.json').write_text(json.dumps({'origin':'Original project-authored procedural PCM WAV; no external samples','tool':'Python standard library, scripts/prepare-battle-v2-audio.py','license':'Project-authored output; no third-party license asserted','algorithm':'Swept oscillator, seeded low-pass noise, inharmonic decaying partials and bubble modulation. Exact formulas retained in source script.','records':records},indent=2)+'\n')
print(f'Produced {len(records)} original sounds, {sum(r["bytes"] for r in records)} bytes.')
