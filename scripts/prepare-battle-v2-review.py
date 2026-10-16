#!/usr/bin/env python3
"""Contact sheets from actual browser screenshots and timestamped browser motion/audio capture."""
import json, subprocess, hashlib
from pathlib import Path
out=Path('docs/battle-v2-phase-c-review/phase-a-regressions'); scratch=Path('dist/battle-v2-review'); scratch.mkdir(parents=True,exist_ok=True)
main=[('modifier-0-idle','Idle: both complete bodies'),('modifier-0-attack','Attack: pose-specific anatomy'),('modifier-0-recoil','Recoil: distinct from defense'),('modifier-0-defense','Defense: braced'),('modifier-0-defeat','Defeat: folded/collapsed'),('simultaneous','Simultaneous contact study'),('effect-strike','Strike: legal producer fixture'),('effect-slash','Slash: legal producer fixture'),('effect-bite','Bite: legal producer fixture'),('effect-corrosion','Corrosion: legal producer fixture'),('effect-retaliation','Retaliation: reactive, no lunge'),('accepted-injection','Accepted projections: coalesced'),('modifier-5-idle','Barbs: legal active skin'),('modifier-6-idle','Veins: legal active skin'),('modifier-7-idle','Mouths: legal active skin'),('modifier-8-idle','Shoulder growth: legal active body'),('modifier-10-idle','All treatments: ART ONLY'),('integration-unleash','Release: five-second interval'),('bite-modifier-0','Dedicated forward bite lunge'),('bite-open','Supplied teeth: open/close'),('effect-block','Supplied incoming-contact guard')]
mods=[(f'modifier-{i}-idle',name) for i,name in enumerate(['Unmodified: legal','Titan 1.10: legal','Red .50: legal','Green .50: legal','Combined fixed tint: legal','Sparse barbs: legal','Marbled veins: legal','Surface mouths: legal','Shoulder eye: legal','Decorative tremor: legal','All treatments: ART ONLY','No-vote blob: legal'])]
lettering=[(f'lettering-{id}',label) for id,label in [('strike','Strike variants'),('slash','Slash variants'),('bite','Bite variants'),('corrosion','Corrosion variants'),('retaliation','Retaliation variants'),('knockout','Defeat variants'),('block','Block variants'),('dodge','Miss variants'),('timeout','Result: choreography study')]]
placement=[('placement-block-team','Left blocking: original orientation'),('effect-block','Right blocking: mirrored'),('placement-retaliation-team','Left retaliation: original orientation'),('placement-retaliation-rival','Right retaliation: mirrored'),('placement-slash-team','Left attacked: right attack, mirrored'),('placement-slash-rival','Right attacked: left attack, original')]
for name,items in [('contact-sheet',main),('modifier-contact-sheet',mods),('placement-contact-sheet',placement),('lettering-contact-sheet',lettering)]:
 tiles=[]
 for i,(file,label) in enumerate(items):
  tile=scratch/f'{name}-{i}.png'
  subprocess.run(['convert',str(out/(file+'.png')),'-resize','520x290','-background','#111c14','-gravity','center','-extent','520x326','-fill','#e5d9b4','-font','DejaVu-Serif','-pointsize','17','-gravity','south','-annotate','+0+8',label,str(tile)],check=True);tiles.append(str(tile))
 subprocess.run(['montage',*tiles,'-tile','3x','-geometry','520x326+4+4','-background','#080f0a',str(out/(name+'.png'))],check=True)
capture=Path('dist/battle-v2-capture')
if capture.exists():
 times=json.loads((capture/'times.json').read_text());lines=[]
 for i,t in enumerate(times):
  lines.append(f"file '{(capture/f'{i:05}.jpg').resolve()}'")
  lines.append(f'duration {max(.001, times[i+1]-t) if i+1<len(times) else .033333:.6f}')
 listing=scratch/'recording.concat';listing.write_text('\n'.join(lines)+'\n')
 subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','warning','-f','concat','-safe','0','-i',str(listing),'-i',str(out/'live-audio.webm'),'-vf','fps=30,scale=1280:1000','-c:v','libx264','-crf','25','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-shortest','-movflags','+faststart',str(out/'phase-a-recording.mp4')],check=True)
 motion=[]
 for j,target in enumerate([0,.8,1.6,2.1,2.8,3.5,4.5,5.3,6.0,6.2,6.4,6.7,7.0,7.5,8.0]):
  i=min(range(len(times)),key=lambda i:abs(times[i]-times[0]-target));tile=scratch/f'motion-{j}.png'
  subprocess.run(['convert',str(capture/f'{i:05}.jpg'),'-resize','400x320','-background','#112017','-gravity','center','-extent','400x345','-font','DejaVu-Serif','-fill','#e4d9b7','-pointsize','17','-gravity','south','-annotate','+0+4',f'Capture +{times[i]-times[0]:.2f}s',str(tile)],check=True);motion.append(str(tile))
 subprocess.run(['montage',*motion,'-tile','3x','-geometry','400x345+4+4','-background','#071009',str(out/'motion-frames.png')],check=True)

audio=out/'live-audio.webm'
if audio.exists():
 analysis=subprocess.run(['ffmpeg','-hide_banner','-i',str(audio),'-af','volumedetect','-f','null','-'],capture_output=True,text=True,check=True)
 levels=[line.split('] ',1)[-1] for line in analysis.stderr.splitlines() if 'mean_volume:' in line or 'max_volume:' in line]
 (out/'audio-evidence.json').write_text(json.dumps({'scope':'Actual captured browser Web Audio output at per-device volume 0.70; no perceptual listening supported in agent environment','capture':str(audio),'sha256':hashlib.sha256(audio.read_bytes()).hexdigest(),'analysisTool':'FFmpeg volumedetect','levels':levels,'priorIteration':'Initial overlapping cues reached 0 dBFS; cue headroom and limiter added before final capture','humanListening':'Outstanding Phase A review'},indent=2)+'\n')
evidence=[p for p in sorted(out.iterdir()) if p.suffix in ['.png','.mp4','.webm']]
(out/'review-evidence.json').write_text(json.dumps({'scope':'Actual local browser review artifacts; no physical-device evidence','files':[{'file':str(p),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in evidence]},indent=2)+'\n')
print('Prepared four labeled contact sheets, available browser-captured recording, and evidence hashes.')
