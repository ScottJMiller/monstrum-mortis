#!/usr/bin/env python3
"""Rebuild original, non-spoiling SVG specimen clues; no model or external art."""
import hashlib
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
FAMILIES = ['serrated', 'pulsing', 'branching', 'fuzzy', 'spiral']
COLORS = [('olive', '#afba72'), ('violet', '#b09fc0'), ('ivory', '#e1d6b5')]

def svg(family, variant, color):
    count = 3 + variant
    pieces = ['<circle cx="80" cy="72" r="52" fill="#202b27" stroke="#897655" stroke-width="3"/>']
    if family == 'serrated':
        pts = ' '.join(f'{30+i*100/(count*2):.1f},{45 if i%2 else 90}' for i in range(count*2+1))
        pieces.append(f'<polyline points="{pts}" fill="none" stroke="{color}" stroke-width="8" stroke-linejoin="round"/>')
    elif family == 'pulsing':
        for i in range(count): pieces.append(f'<ellipse cx="80" cy="72" rx="{12+i*4}" ry="{9+i*3}" fill="none" stroke="{color}" stroke-width="2"/>')
    elif family == 'branching':
        pieces.append(f'<path d="M80 112 V32" stroke="{color}" stroke-width="5"/>')
        for i in range(count):
            y=40+i*60/count
            pieces.append(f'<path d="M80 {y} L{48 if i%2 else 112} {y-12}" stroke="{color}" stroke-width="3"/>')
    elif family == 'fuzzy':
        pieces.append(f'<ellipse cx="80" cy="72" rx="27" ry="20" fill="{color}"/>')
        for i in range(count):
            x=48+i*64/count
            pieces.append(f'<path d="M{x} 52 l-5 -14 M{x} 92 l5 14" stroke="{color}" stroke-width="3"/>')
    else:
        pieces.append(f'<path d="M80 72 c-12 -15 -27 5 -10 20 c30 22 58 -20 27 -45 c-30 -24 -69 5 -50 43" fill="none" stroke="{color}" stroke-width="{3+variant/2}"/>')
    for i in range(count): pieces.append(f'<circle cx="{40+i*80/count}" cy="124" r="2.5" fill="{color}"/>')
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 144">' + ''.join(pieces) + '</svg>\n'

def main():
    out=ROOT/'public/assets/specimens'; out.mkdir(parents=True, exist_ok=True)
    index=[]; ledger=[]
    for i in range(35):
        family=FAMILIES[i%5]; variant=0 if i>=30 else i//5
        colorname,color=COLORS[(i//5)%3]
        key=f'c{i+1:02}' if i<30 else family
        asset_id='clue.'+key
        file=out/(key+'.svg'); file.write_text(svg(family, variant, color))
        description=f'{colorname.capitalize()} {family} filaments with {3+variant} dotted marks.'
        index.append({'id':asset_id,'url':f'/assets/specimens/{key}.svg','description':description})
        ledger.append({'id':asset_id,'source':str(file.relative_to(ROOT)),'origin':'original','creator':'Project-authored SVG via scripts/prepare-specimens.py','date':'2026-10-07','description':description,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'bytes':file.stat().st_size,'dimensions':[160,144],'attachment':None,'license':'Original project code artwork; no third-party source or invented stock license.'})
    (ROOT/'src/assets/specimen-clues.json').write_text(json.dumps(index,indent=2)+'\n')
    (ROOT/'assets/specimen-provenance.json').write_text(json.dumps(ledger,indent=2)+'\n')
    print(f'Prepared {len(index)} original specimen SVGs ({sum(a["bytes"] for a in ledger)} bytes).')
if __name__ == '__main__': main()
