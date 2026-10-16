#!/usr/bin/env python3
"""Actual production browser screenshots and CDP/Web Audio capture; no mock outcomes."""
import json,subprocess,os,hashlib
from pathlib import Path
os.environ.setdefault('MAGICK_THREAD_LIMIT','1')
out=Path('docs/battle-v2-phase-c-review');scratch=Path('dist/phase-c-review-tiles');scratch.mkdir(parents=True,exist_ok=True)
items=[('entry-desktop','Desktop entry'),('entry-phone','Phone entry'),('briefing','Rival briefing'),('injection-desktop','Accepted injection'),('experiment-phone','Phone private tray'),('integration','Integrating DNA'),('reveal','Integrated reveal'),('arena-detail','Production battle detail'),('tray-detail-phone','Phone private tray detail'),('battle-desktop','Production battle'),('battle-phone','Reduced-motion phone'),('battle-landscape','Phone landscape'),('countdown','Final countdown'),('result-desktop','Authoritative result'),('result-phone','Phone result'),('recovered-art','Artwork recovered')]
tiles=[]
for name,label in items:
 tile=scratch/(name+'.png');subprocess.run(['convert',str(out/(name+'.png')),'-resize','450x310','-background','#111a15','-gravity','center','-extent','460x350','-font','DejaVu-Sans','-fill','#eee3c3','-pointsize','13','-gravity','south','-annotate','+0+6',label,str(tile)],check=True);tiles.append(str(tile))
subprocess.run(['montage',*tiles,'-tile','3x','-geometry','460x350+3+3','-background','#0b130e',str(out/'contact-sheet.png')],check=True)
raw=Path('dist/battle-v2-phase-c-capture');times=json.loads((raw/'times.json').read_text());lines=[]
for i,t in enumerate(times):lines+=[f"file '{(raw/f'{i:05}.jpg').resolve()}'",f'duration {max(.001,times[i+1]-t)if i+1<len(times)else .033333:.6f}']
listing=scratch/'capture.concat';listing.write_text('\n'.join(lines)+'\n')
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','warning','-f','concat','-safe','0','-i',str(listing),'-i',str(out/'production-audio.webm'),'-vf','fps=30,pad=ceil(iw/2)*2:ceil(ih/2)*2','-c:v','libx264','-crf','25','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-shortest','-movflags','+faststart',str(out/'production-recording.mp4')],check=True)
levels=subprocess.run(['ffmpeg','-hide_banner','-i',str(out/'production-audio.webm'),'-af','volumedetect','-f','null','-'],capture_output=True,text=True,check=True).stderr
(out/'audio-evidence.json').write_text(json.dumps({'scope':'Actual production browser Web Audio capture at local device settings; no subjective listening claim','levels':[line.split('] ',1)[-1]for line in levels.splitlines()if 'mean_volume:'in line or 'max_volume:'in line]},indent=2)+'\n')
(out/'review-evidence.json').write_text(json.dumps({'physicalDevices':False,'recordingFrames':len(times),'files':[{'file':str(p),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for p in sorted(out.iterdir())if p.suffix in ['.png','.mp4','.webm']]},indent=2)+'\n')
print(f'Prepared actual Phase C contact sheet, production motion/audio recording ({len(times)} frames) and artifact hashes.')
