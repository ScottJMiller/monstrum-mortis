#!/usr/bin/env python3
"""Review-only layouts of actual browser captures and the generated runtime illustrations."""
from pathlib import Path
import json,hashlib,subprocess,os
os.environ.setdefault('MAGICK_THREAD_LIMIT','1')
out=Path('docs/predeploy-refinement-review');scratch=Path('dist/refinement-review');scratch.mkdir(parents=True,exist_ok=True)
items=[(out/'splash-desktop.png','Desktop splash'),(out/'splash-phone.png','Phone splash'),(out/'entry-desktop.png','Desktop entry'),(out/'entry-phone.png','Phone entry'),(out/'tray-phone.png','Real phone tray'),(out/'experiment-desktop.png','Accepted injection / desktop'),(Path('docs/battle-v2-phase-c-review/arena-detail.png'),'Actual battle / thin frame'),(Path('docs/battle-v2-phase-c-review/reveal.png'),'New Rocker release'),(Path('docs/battle-v2-phase-c-review/result-desktop.png'),'Authoritative result')]
tiles=[]
for i,(p,label) in enumerate(items):
 tile=scratch/f'ui-{i}.png';subprocess.run(['convert',str(p),'-resize','460x330','-background','#101a13','-gravity','center','-extent','470x370','-font','DejaVu-Sans','-fill','#eee1be','-pointsize','13','-gravity','south','-annotate','+0+8',label,str(tile)],check=True);tiles.append(str(tile))
subprocess.run(['montage',*tiles,'-tile','3x','-geometry','470x370+4+4','-background','#08110b',str(out/'contact-sheet.png')],check=True)
records=json.loads(Path('assets/specimens/provenance.json').read_text())['records'];names={c['id']:c['name']for c in json.loads(Path('src/assets/specimen-clues.json').read_text())};tiles=[]
for r in records:
 tile=scratch/(r['id']+'.png');subprocess.run(['convert',r['runtime'],'-resize','224x224','-background','#101a13','-gravity','north','-extent','240x275','-font','DejaVu-Sans','-fill','#eee1be','-pointsize','12','-gravity','south','-annotate','+0+10',names[r['id']],str(tile)],check=True);tiles.append(str(tile))
subprocess.run(['montage',*tiles,'-tile','5x','-geometry','240x275+4+4','-background','#08110b',str(out/'specimen-contact-sheet.png')],check=True)
tiles=[]
for i,(p,label) in enumerate([(Path('docs/predeploy-refinement-review/before-victorian-labels/tray-phone.png'),'Before / codes and descriptions'),(out/'tray-phone.png','After / short specimen names'),(Path('docs/battle-v2-phase-c-review/before-victorian-labels/arena-detail.png'),'Before / plain frame'),(Path('docs/battle-v2-phase-c-review/arena-detail.png'),'After / Victorian frame')]):
 tile=scratch/f'before-{i}.png';subprocess.run(['convert',str(p),'-resize','460x600','-background','#101a13','-gravity','center','-extent','470x640','-font','DejaVu-Sans','-fill','#eee1be','-pointsize','13','-gravity','south','-annotate','+0+8',label,str(tile)],check=True);tiles.append(str(tile))
subprocess.run(['montage',*tiles,'-tile','2x','-geometry','470x640+4+4','-background','#08110b',str(out/'before-after.png')],check=True)
# Current frame-only comparison; preserve the accepted geometric version beside fresh captures.
frame_items=[
 (out/'before-sculpted-iron/entry-desktop.png','450x515+800+255','Before / geometric control frame'),
 (out/'entry-desktop.png','450x515+800+255','After / moulded Gothic iron'),
 (out/'before-sculpted-iron/entry-phone.png','375x485+8+708','Before / phone control frame'),
 (out/'entry-phone.png','375x485+8+708','After / phone ironwork'),
 (Path('docs/battle-v2-phase-c-review/before-sculpted-iron/arena-detail.png'),None,'Before / thin artwork frame'),
 (Path('docs/battle-v2-phase-c-review/arena-detail.png'),None,'After / thin acanthus frame')]
tiles=[]
for i,(p,crop,label) in enumerate(frame_items):
 tile=scratch/f'frame-{i}.png';args=['convert',str(p)]
 if crop:args+=['-crop',crop,'+repage']
 subprocess.run(args+['-resize','460x515','-background','#101a13','-gravity','center','-extent','470x555','-font','DejaVu-Sans','-fill','#eee1be','-pointsize','13','-gravity','south','-annotate','+0+8',label,str(tile)],check=True);tiles.append(str(tile))
subprocess.run(['montage',*tiles,'-tile','2x','-geometry','470x555+4+4','-background','#08110b',str(out/'frame-before-after.png')],check=True)
# Latest chamber/frame refinement: actual accepted injection and failure/reduced-motion captures.
reservoir_items=[
 (out/'before-reservoirs/entry-desktop.png','734x901+38+231','Before / plain chamber gauges'),
 (out/'chamber-desktop.png',None,'After / illustrated glass and brass'),
 (out/'chamber-injection.png',None,'Actual accepted injection / 300ms'),
 (out/'chamber-phone.png',None,'Phone / reduced motion'),
 (out/'reservoir-fallback.png',None,'Image failure / native fallback'),
 (out/'splash-phone.png',None,'Splash / inner scrollwork retained')]
tiles=[]
for i,(p,crop,label) in enumerate(reservoir_items):
 tile=scratch/f'reservoir-{i}.png';args=['convert',str(p)]
 if crop:args+=['-crop',crop,'+repage']
 subprocess.run(args+['-resize','430x530','-background','#101a13','-gravity','center','-extent','440x570','-font','DejaVu-Sans','-fill','#eee1be','-pointsize','13','-gravity','south','-annotate','+0+8',label,str(tile)],check=True);tiles.append(str(tile))
subprocess.run(['montage',*tiles,'-tile','3x','-geometry','440x570+4+4','-background','#08110b',str(out/'reservoir-contact-sheet.png')],check=True)
(out/'review-evidence.json').write_text(json.dumps({'scope':'Local Chrome production captures plus specimen contact sheet; no physical-device claim','artBytes':sum(r['bytes'] for r in records),'files':[{'file':str(p),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for p in sorted(out.iterdir())if p.suffix=='.png']},indent=2)+'\n')
print('Prepared refinement UI/specimen/before-after contact sheets and actual artifact hashes.')
