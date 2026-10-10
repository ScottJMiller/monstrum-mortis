#!/usr/bin/env python3
"""Rebuild selected rival derivatives from retained generated masters; no image API."""
import hashlib
import json
import subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
ledger = ROOT / 'assets/rival-provenance.json'
rows = json.loads(ledger.read_text())
index = []
for row in rows:
    master = ROOT / row['source']
    target = ROOT / row['runtime']
    target.parent.mkdir(parents=True, exist_ok=True)
    channels = subprocess.check_output(['identify', '-format', '%[channels]', str(master)], text=True)
    if 'a' not in channels.lower():
        raise ValueError(f"Master must retain transparency: {master}")
    subprocess.run(['convert', str(master), '-trim', '+repage', '-resize', '640x640>', '-strip', '-quality', '82', str(target)], check=True)
    row['sourceSha256'] = hashlib.sha256(master.read_bytes()).hexdigest()
    row['runtimeSha256'] = hashlib.sha256(target.read_bytes()).hexdigest()
    row['runtimeBytes'] = target.stat().st_size
    row['runtimeDimensions'] = list(map(int, subprocess.check_output(['identify', '-format', '%w %h', str(target)], text=True).split()))
    index.append({'id': row['id'], 'url': '/' + str(target.relative_to(ROOT / 'public')), 'attachment': {'x': .5, 'y': 1}})
ledger.write_text(json.dumps(rows, indent=2) + '\n')
(ROOT / 'src/assets/rivals.json').write_text(json.dumps(index, indent=2) + '\n')
print(f"Prepared {len(rows)} retained rival sprites, {sum(r['runtimeBytes'] for r in rows):,} runtime bytes.")
