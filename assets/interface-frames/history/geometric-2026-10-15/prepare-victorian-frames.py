#!/usr/bin/env python3
"""Original vector motifs; dual-repeat border-image technique inspired by Jacob Filipp."""
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[1];out=root/'public/assets/interface';out.mkdir(parents=True,exist_ok=True)
paint='stroke="#b8a576" stroke-width="1.25" fill="none" stroke-linecap="round" stroke-linejoin="round"'
def flower(x,y,r=9):
 return f'<g transform="translate({x} {y})"><path d="M0 {-r}C{r} {-r} {r} {r} 0 {r}C{-r} {r} {-r} {-r} 0 {-r}ZM{-r} 0C{-r} {-r} {r} {-r} {r} 0C{r} {r} {-r} {r} {-r} 0Z"/><path d="M0 {-r-3}V{r+3}M{-r-3} 0H{r+3}"/><circle r="2.5" fill="#796e4d"/></g>'
def diamond(x,y):return f'<path d="M{x-5} {y}q5-3 5-8 0 5 5 8-5 3-5 8 0-5-5-8Z" fill="#7b714f"/>'
def frame(thick):
 top='<path d="M36 3H108M36 33H108M36 18H108"/>'
 for x in [54,90]:top+=flower(x,18,7 if thick else 4)
 for x in [36,72,108]:top+=diamond(x,18)
 corner='<path d="M3 36V3H36M33 36V33H36M7 29Q3 7 25 7Q35 10 29 18Q23 23 20 16Q20 10 25 12M12 31Q28 31 31 22"/>'+flower(17,19,8 if thick else 5)
 pieces=[]
 for angle in [0,90,180,270]:pieces.append(f'<g transform="rotate({angle} 72 72)">{top}{corner}</g>')
 return '<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><g '+paint+'>'+''.join(pieces)+'</g></svg>\n'
strip='<path d="M2 12H198"/>'+''.join(flower(x,12,8)for x in [20,70,130,180])+''.join(diamond(x,12)for x in [40,100,160])
files={'victorian-thin.svg':frame(False),'victorian-thick.svg':frame(True),'victorian-dual-strip.svg':'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="24" viewBox="0 0 200 24"><g '+paint+'>'+strip+'</g></svg>\n'}
records=[]
for name,data in files.items():
 p=out/name;p.write_text(data);records.append({'path':str(p.relative_to(root)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'origin':'original project-authored vector geometry','license':'Original project code artwork; no third-party motif copied'})
(root/'assets/interface-frames/provenance.json').write_text(json.dumps({'date':'2026-10-15','techniqueReference':'https://jacobfilipp.com/victorian-dual/','implementation':'Original rosette/diamond motif geometry. Nine-slice surround with complete repeated edge motifs, plus Method B fixed-cap/doubled-repeat horizontal friezes quantized by CSS round(down,...). Fallback uses border-image-repeat:round. No tutorial images or source ornaments redistributed.','source':'scripts/prepare-victorian-frames.py','records':records},indent=2)+'\n')
print('Prepared three original Victorian dual-motif SVGs and provenance.')
