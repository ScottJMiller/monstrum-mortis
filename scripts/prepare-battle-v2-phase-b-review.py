#!/usr/bin/env python3
"""Reproducible labeled contact sheets from actual Phase B browser screenshots, not generated mockups."""
import json,subprocess,hashlib,sys,os
from pathlib import Path
os.environ.setdefault('MAGICK_THREAD_LIMIT','1')
out=Path('docs/battle-v2-phase-c-review/development-regressions');raw=Path('dist/battle-v2-refinement-capture');scratch=Path('dist/phase-b-refinement-tiles');scratch.mkdir(parents=True,exist_ok=True)
players=['family-1','family-2','family-3','family-4','family-5','blob'];rivals=['Iron Widow','Gutter Seraph','Carrion Duke','Coil Saint','Maw Engine','The Unfinished'];roles=['idle','attack','recoil','defense','defeat']
def sheet(name,items,columns=3,size=(420,280)):
 tiles=[];width,height=size
 for i,(file,label,crop)in enumerate(items):
  tile=scratch/f'{name}-{i}.png';args=['convert',str(file)]
  if crop=='left':
   w,h=map(int,subprocess.check_output(['identify','-format','%w %h',str(file)]).decode().split());args+=['-crop',f'{w//2}x{h}+0+0','+repage']
  args+=['-resize',f'{width}x{height-32}','-background','#142019','-gravity','center','-extent',f'{width}x{height}','-font','DejaVu-Sans','-fill','#eee3c9','-pointsize','13','-gravity','south','-annotate','+0+5',label,str(tile)]
  subprocess.run(args,check=True);tiles.append(str(tile))
 subprocess.run(['montage',*tiles,'-tile',f'{columns}x','-geometry',f'{width}x{height}+3+3','-background','#0b130e',str(out/(name+'.png'))],check=True)
def terminal_sheet():
 global out
 # Latest timeout-only outcome line and blocked-strike treatment; preserve earlier sheets.
 newest=Path('docs/battle-v2-phase-c-review/terminal-regressions')
 if (newest/'timeout-390-60-20.png').exists():
  previous=out;out=newest
  sheet('contact-sheet',[(newest/f'timeout-{width}-{team}-{rival}.png',f'Isolated timeout: {label} / {width}px',None)for width in [1280,390]for team,rival,label in [(60,20,'our specimen wins'),(20,60,'rival wins'),(50,50,'draw')]]+[(newest/f'strike-{side}-{state}.png',f'Isolated strike: {side} / {state}',None)for side in ['team','rival']for state in ['unblocked','blocked']],2,(520,340))
  out=previous

if '--terminal' in sys.argv:
 terminal_sheet()
 print('Prepared timeout-winner and blocked-strike contact sheet from actual browser captures.')
 sys.exit(0)
sheet('poses-contact-sheet',[(raw/f'poses-{i}-{role}.png',f'{players[i]} / {rivals[i]} : {role}',None)for i in range(6)for role in roles],5,(380,252))
sheet('graft-contact-sheet',[(raw/f'graft-{body}-{s}-idle.png',f'ART study: {body} / {label}','left')for body in players for s,label in [(5,'barbs'),(6,'veins'),(7,'mouths'),(8,'shoulder eye')]],4,(330,260))
sheet('damage-contact-sheet',[(raw/f'damage-{body}-{s}.png',f'TEXT only: {body} / {s}','left')for body in players for s in ['critical','melted','limb-lost','teeth-lost']],4,(330,260))
for damage in ['limb-lost','teeth-lost']:
 sheet('damage-poses-'+damage,[(raw/f'damage-pose-{body}-{role}-{damage}.png',f'TEXT only: {body} / {role} / {damage}','left')for body in players for role in roles],5,(280,230))
sheet('effect-contact-sheet',[(raw/f'isolated-{fx}-{side}.png',f'Feedback study: {fx} / {side}',None)for fx in ['electric','poison','bleed','restraint','roar','regeneration','slowing','crawling','malfunction','detach','recover','retaliation']for side in ['team','rival']],4,(420,290))
items=[(out/f'arena-{a}.png',label,None)for a,label in [('laboratory','Existing laboratory'),('arena-catacomb','New ossuary laboratory'),('arena-foundry','New anatomical foundry')]]
items+=[(raw/f'poses-{i}-idle.png',f'{players[i]} / {rivals[i]}',None)for i in range(6)]
items+=[(out/f'real-detach-{t}.png',f'LEGAL: accepted damage at {t/1000:g}s',None)for t in [11990,12000,18000]]
items+=[(out/f'effect-{fx}.png',f'LEGAL producer effect: {fx}',None)for fx in ['electric','roar','regeneration'] if (out/f'effect-{fx}.png').exists()]
sheet('contact-sheet',items,3,(480,300))
sheet('before-after-grafts',[(Path('docs/archive/battle-v2/battle-v2-review')/f'modifier-{s}-idle.png',f'Phase A before: {label}','left') for s,label in [(5,'barbs'),(6,'veins'),(7,'mouths'),(8,'growth')]]+[(raw/f'graft-family-1-{s}-idle.png',f'Phase B after: {label}','left')for s,label in [(5,'barbs'),(6,'veins'),(7,'mouths'),(8,'growth')]],4,(320,320))
sheet('opponent-before-after',[(Path('docs/archive/battle-v2/battle-v2-phase-b-review/refinement-2026-10-14')/f'opponent-before-{body}.png',f'13 Oct before: {body}',None)for body in ['carrion-duke','coil-saint','maw-engine']]+[(raw/f'poses-{i}-idle.png',f'14 Oct cleaned: {body}',None)for i,body in [(2,'carrion-duke'),(3,'coil-saint'),(4,'maw-engine')]],3,(440,290))
# The later same-day terminal/countdown/shield request has separate focused evidence.
latest=out/'final-lettering'
if (latest/'final-desktop.png').exists():
 previous=out;out=latest
 sheet('contact-sheet',[(latest/f'countdown-{view}-{n}.png',f'{view}: {n} seconds remain',None)for view in ['desktop','phone']for n in [3,2,1]]+[(latest/f'final-{view}.png',f'{view}: centered final word',None)for view in ['desktop','phone']]+[(latest/'final-timeout-phone.png','Phone: round-end wording',None)],3,(450,300))
 sheet('shields-contact-sheet',[(latest/f'shield-{i}-{effect}-{time}.png',f'{players[i]} / {rivals[i]} : {label}',None)for i in range(6)for effect,time,label in [('block',6200,'block'),('retaliation',13400,'left retaliation'),('retaliation',14300,'right retaliation')]],3,(450,300))
 out=previous
terminal_sheet()
times=json.loads((raw/'times.json').read_text());lines=[]
for i,t in enumerate(times):
 lines.append(f"file '{(raw/f'{i:05}.jpg').resolve()}'");lines.append(f'duration {max(.001,times[i+1]-t)if i+1<len(times)else .033333:.6f}')
listing=scratch/'capture.concat';listing.write_text('\n'.join(lines)+'\n')
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','warning','-f','concat','-safe','0','-i',str(listing),'-i',str(out/'live-audio.webm'),'-vf','fps=30,pad=ceil(iw/2)*2:ceil(ih/2)*2','-c:v','libx264','-crf','25','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-shortest','-movflags','+faststart',str(out/'phase-b-recording.mp4')],check=True)
frames=[]
for target in [0,.5,1,1.5,2,2.5,3,3.5,4,5,6,7]:
 i=min(range(len(times)),key=lambda i:abs(times[i]-times[0]-target));frames.append((raw/f'{i:05}.jpg',f'Actual capture +{times[i]-times[0]:.2f}s',None))
sheet('motion-frames',frames,3,(420,350))
audio=out/'live-audio.webm';levels=subprocess.run(['ffmpeg','-hide_banner','-i',str(audio),'-af','volumedetect','-f','null','-'],capture_output=True,text=True,check=True).stderr
(out/'audio-evidence.json').write_text(json.dumps({'scope':'Actual browser Web Audio output captured under CDP at default device volume; agent cannot perceptually listen','levels':[line.split('] ',1)[-1]for line in levels.splitlines()if 'mean_volume:'in line or 'max_volume:'in line],'captureSha256':hashlib.sha256(audio.read_bytes()).hexdigest(),'humanListening':'Outstanding'},indent=2)+'\n')
(out/'review-evidence.json').write_text(json.dumps({'scope':'Actual local Chrome screenshots/motion/audio; no physical devices','files':[{'file':str(p),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for p in sorted(out.iterdir())if p.suffix in ['.png','.mp4','.webm']]},indent=2)+'\n')
print('Prepared refined Phase B pose/graft/text-feedback/effect/representative/before-after/motion sheets and real browser audio/video recording.')
