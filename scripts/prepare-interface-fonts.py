#!/usr/bin/env python3
"""Record unchanged official Google Fonts, using the retained download manifest offline."""
import json,hashlib,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[1]
faces=json.loads((root/'assets/interface-fonts/downloads.json').read_text())
records=[]
for url in sorted({f['url'] for f in faces}):
 p=root/'public/assets/fonts'/url.rsplit('/',1)[-1]
 records.append({'url':url,'runtime':str(p.relative_to(root)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size,'processing':'Unmodified official WOFF2; Latin/Latin Extended subsets supplied by Google Fonts'})
for name in ['Cabin','PTSerif']:
 shutil.copyfile(root/f'assets/interface-fonts/{name}-OFL.txt',root/f'public/assets/fonts/{name}-OFL.txt')
(root/'assets/interface-fonts/provenance.json').write_text(json.dumps({'date':'2026-10-15','origin':'Google Fonts official fonts repository and CSS2 service','license':'SIL Open Font License 1.1; original licenses retained and shipped','stylesheet':'assets/interface-fonts/google-fonts.css','repository':'https://github.com/google/fonts','records':records},indent=2)+'\n')
print(f'Prepared {len(records)} locally hosted WOFF2 files ({sum(r["bytes"] for r in records)} bytes) and both OFL licenses.')
