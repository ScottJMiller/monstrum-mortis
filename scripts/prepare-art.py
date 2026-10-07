"""Copy selected generation outputs and create reproducible runtime art derivatives.

Input is an uncommitted local JSON inventory with source paths and exact prompts.
Requires ImageMagick 6+ with WebP support. Does not generate or repaint artwork.
"""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / 'assets/source'
PUBLIC = ROOT / 'public/assets/laboratory'
SOURCES.mkdir(parents=True, exist_ok=True)
PUBLIC.mkdir(parents=True, exist_ok=True)
if sys.argv[1] == '--from-masters':
    rows = json.loads((ROOT / 'assets/provenance.json').read_text())
    for row in rows:
        row['source'] = str(ROOT / row['source'])
else:
    rows = json.loads(Path(sys.argv[1]).read_text())
records = []
defaults = {
    'creature.blob': ('body', .5, .55, .78, 0),
    'creature.eyes': ('eyes', .5, .44, .28, 4),
    'creature.mouth': ('mouth', .5, .57, .24, 4),
}
for row in rows:
    name = row['id']
    master = SOURCES / f'{name}.png'
    if Path(row['source']).resolve() != master.resolve():
        shutil.copyfile(row['source'], master)
    is_chamber = name == 'lab.chamber'
    runtime = PUBLIC / f'{name}.webp'
    subprocess.run(['convert', str(master), *([] if is_chamber else ['-trim', '+repage']),
                    '-resize', '1024x1536>' if is_chamber else '640x640>',
                    '-strip', '-quality', '82', str(runtime)], check=True)
    dimensions = subprocess.check_output(['identify', '-format', '%w %h', str(runtime)], text=True).split()
    source_dimensions = subprocess.check_output(['identify', '-format', '%w %h', str(master)], text=True).split()
    if is_chamber:
        phone = PUBLIC / 'lab.chamber-phone.webp'
        subprocess.run(['convert', str(master), '-resize', '576x864>', '-strip', '-quality', '78', str(phone)], check=True)
    if name in defaults:
        slot, x, y, width, order = defaults[name]
        row.update(slot=slot, attachment={'x': x, 'y': y}, width=width, order=order)
    records.append({
        'id': name, 'url': f'/assets/laboratory/{runtime.name}',
        'source': str(master.relative_to(ROOT)), 'origin': 'generated',
        'creator': 'OpenAI built-in image generation tool; model identifier not exposed',
        'date': '2026-10-06', 'prompt': row['prompt'], 'references': [],
        'terms': 'https://openai.com/policies/terms-of-use/',
        'edits': 'ImageMagick: trim transparent margins for modules, resize, strip metadata, WebP quality 82; chamber phone quality 78. Source unchanged.',
        'sourceSha256': hashlib.sha256(master.read_bytes()).hexdigest(),
        'sourceDimensions': list(map(int, source_dimensions)),
        'dimensions': list(map(int, dimensions)), 'bytes': runtime.stat().st_size,
        **({k: row[k] for k in ['slot', 'attachment', 'width', 'order']} if not is_chamber else {}),
        'pivot': {'x': .5, 'y': .5}, 'mirroredSlots': ['forelimb-left', 'forelimb-right'] if row.get('slot') == 'forelimb-left' else [],
        'description': row.get('description', {'lab.chamber': 'Corroded containment machinery surrounding an empty glass chamber.', 'creature.blob': 'A waxy olive-green blob.', 'creature.eyes': 'Two weary bulging eyes.', 'creature.mouth': 'A crooked uneasy smile.'}.get(name, name)),
    })
(ROOT / 'assets/provenance.json').write_text(json.dumps(records, indent=2) + '\n')
runtime_keys = ['id', 'url', 'dimensions', 'slot', 'attachment', 'width', 'order', 'pivot', 'mirroredSlots', 'description']
(ROOT / 'src/assets/production.json').write_text(json.dumps([{k: r[k] for k in runtime_keys if k in r} for r in records], indent=2) + '\n')
print(f'Prepared {len(records)} assets; {sum(r["bytes"] for r in records):,} bytes in main runtime derivatives.')
