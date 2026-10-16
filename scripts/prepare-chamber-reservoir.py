#!/usr/bin/env python3
"""Crop/resize the selected immutable generated gauge, retaining alpha and registration."""
from pathlib import Path
import subprocess,json,hashlib
root=Path(__file__).resolve().parents[1]
source=root/'assets/chamber-reservoir/source/final-dark-glass.png'
runtime=root/'public/assets/interface/chamber-reservoir.webp'
subprocess.run(['convert',str(source),'-crop','320x1360+406+8','+repage','-resize','120x510','-strip','-quality','86',str(runtime)],check=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
gen=json.loads((root/'assets/chamber-reservoir/generation.json').read_text())
originals=[{'path':r['source'],'sha256':sha(root/r['source']),'bytes':(root/r['source']).stat().st_size,'selected':r['selected']}for r in gen['records']]
ledger={'date':'2026-10-15','tool':'Built-in image_gen; development only','license':'Generated project output; own specimen artwork used as style reference; no third-party stock','prompts':'assets/chamber-reservoir/generation.json','originals':originals,'records':[{'source':str(source.relative_to(root)),'sourceSha256':sha(source),'runtime':str(runtime.relative_to(root)),'sha256':sha(runtime),'bytes':runtime.stat().st_size,'dimensions':[120,510],'processing':'ImageMagick crop 320x1360+406+8, resize 120x510, strip metadata, WebP quality 86; preserve exterior alpha, no content repainting','registration':{'top':[0,0,120,101],'shaft':[0,101,120,329],'base':[0,430,120,80],'liquidChannel':[20,0,80,329]},'rendering':'Three SVG image windows preserve cap/base aspect ratios and stretch only the straight glass shaft vertically. Liquid pulse overlays the dark glass channel. One shared derivative for both sides; native SVG fallback if it fails.'}]}
(root/'assets/chamber-reservoir/provenance.json').write_text(json.dumps(ledger,indent=2)+'\n')
print(f'Prepared registered reservoir image ({runtime.stat().st_size} bytes); all three original generations retained.')
