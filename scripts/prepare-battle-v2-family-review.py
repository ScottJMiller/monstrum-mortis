#!/usr/bin/env python3
"""Assemble actual family browser captures; no generated mockups or runtime endpoint."""
import json,subprocess,hashlib
from pathlib import Path
out=Path('docs/battle-v2-family-review');raw=Path('dist/battle-v2-family-capture');scratch=Path('dist/family-review-tiles');scratch.mkdir(parents=True,exist_ok=True)
def sheet(name,items,columns=3):
 tiles=[]
 for i,(file,label)in enumerate(items):
  tile=scratch/f'{name}-{i}.png';subprocess.run(['convert',str(file),'-resize','450x290','-background','#102018','-gravity','center','-extent','450x330','-font','DejaVu-Sans','-fill','#eee3c9','-pointsize','14','-gravity','south','-annotate','+0+8',label,str(tile)],check=True);tiles.append(str(tile))
 subprocess.run(['montage',*tiles,'-tile',f'{columns}x','-geometry','450x330+3+3','-background','#0b130e',str(out/(name+'.png'))],check=True)
sheet('poses-contact-sheet',[(out/f'family-1-{role}.png',f'Executioner: {role}')for role in ['idle','attack','recoil','defense','defeat','bite']]+[(out/f'family-3-{role}.png',f'Fluffy kitten: {role}')for role in ['idle','attack','recoil','defense','defeat']],3)
sheet('contact-sheet',[(out/f'battle-{body}.png',f'Actual battle: {body}')for body in ['family-1','family-3','blob']]+[(out/f'phone-{body}.png',f'Phone reduced motion: {body}')for body in ['family-1','family-3','blob']],3)
# Retained actual pre-redesign captures make comparisons reproducible after build cleanup.
for body,i in [('family-1',0),('family-3',2)]:
 before=out/f'{body}-before.png'
 if not before.exists():
  subprocess.run(['cp',f'dist/battle-v2-phase-b-capture/poses-{i}-idle.png',str(before)],check=True)
sheet('before-after',[(out/'family-1-before.png','Before: long talons'),(out/'family-1-idle.png','After: bone plates / blunt hands'),(out/'family-3-before.png','Before: weighted tail / bared grin'),(out/'family-3-idle.png','After: bobtail / softer face')],2)
times=json.loads((raw/'times.json').read_text());listing=scratch/'capture.concat';lines=[]
for i,t in enumerate(times):lines.extend([f"file '{(raw/f'{i:05}.jpg').resolve()}'",f'duration {max(.001,times[i+1]-t)if i+1<len(times)else .033333:.6f}'])
listing.write_text('\n'.join(lines)+'\n');subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','warning','-f','concat','-safe','0','-i',str(listing),'-i',str(out/'family-audio.webm'),'-vf','fps=30,pad=ceil(iw/2)*2:ceil(ih/2)*2','-c:v','libx264','-crf','25','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-shortest','-movflags','+faststart',str(out/'family-recording.mp4')],check=True)
sheet('motion-frames',[(raw/f'{min(range(len(times)),key=lambda i:abs(times[i]-times[0]-t)):05}.jpg',f'Actual motion +{t:.1f}s')for t in [0,1,2,3,4,5,6,7,8]],3)
(out/'review-evidence.json').write_text(json.dumps({'scope':'Actual local Chrome screenshots/audio/motion; human acceptance and physical devices separate','files':[{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}for p in sorted(out.iterdir())if p.suffix in ['.png','.mp4','.webm']]},indent=2)+'\n')
print('Prepared redesigned-family pose/battle/before-after/motion sheets and actual audio/video recording.')
