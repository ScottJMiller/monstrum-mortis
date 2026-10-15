#!/usr/bin/env python3
"""Preserve supplied SVG geometry/color, remove editor metadata, register uniform display footprints."""
import copy, hashlib, json, shutil, xml.etree.ElementTree as ET
from pathlib import Path
root=Path('assets/battle-v2'); source=root/'source/user-review'; out=root/'runtime/effects'; out.mkdir(parents=True,exist_ok=True)
ns='{http://www.w3.org/2000/svg}'; ET.register_namespace('',ns[1:-1])
sizes={'strike':[150,150],'slash':[230,210],'bite':[230,170],'corrosion':[270,125],'retaliation':[160,245],'block':[90,245],'electric':[125,190]}
records=[]; index={}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def clean(el):
 assert el.tag.startswith(ns) and el.tag[len(ns):] in ['svg','g','defs','path','circle','ellipse'], 'Unexpected active SVG content'
 attrs={}
 for k,v in el.attrib.items():
  if k=='style':
   for item in v.split(';'):
    if ':' in item:
     key,value=item.split(':',1)
     if key in ['fill','fill-opacity','stroke','stroke-width','stroke-opacity','stroke-linecap','stroke-linejoin','opacity']:attrs[key]=value
  elif k in ['viewBox','d','transform','cx','cy','r','rx','ry','fill','stroke','opacity']:attrs[k]=v
 el.attrib.clear(); el.attrib.update(attrs)
 for child in list(el):
  if child.tag==ns+'defs':el.remove(child)
  else:clean(child)
for name,box in sizes.items():
 path=source/(name+'.svg'); svg=ET.parse(path).getroot(); clean(svg); vb=list(map(float,svg.attrib['viewBox'].split())); scale=min(box[0]/vb[2],box[1]/vb[3]); width=round(vb[2]*scale,3);height=round(vb[3]*scale,3)
 dest=out/(name+'.svg');ET.ElementTree(svg).write(dest,encoding='unicode'); entry={'url':'/'+str(dest),'width':width,'height':height,'viewBox':vb,'color':'#e9ddaf'}
 if name=='bite':
  group=svg.find(ns+'g'); jaws=list(group); assert len(jaws)==2
  for label,child in zip(['upper','lower'],jaws):
   separate=copy.deepcopy(svg); layer=separate.find(ns+'g'); layer.clear();layer.attrib.update(group.attrib);layer.append(copy.deepcopy(child));piece=out/(f'bite-{label}.svg');ET.ElementTree(separate).write(piece,encoding='unicode');entry[label]='/'+str(piece)
   records.append({'id':f'bite-{label}','source':str(path),'sourceSha256':sha(path),'runtime':str(piece),'sha256':sha(piece),'bytes':piece.stat().st_size,'derivation':'Exact supplied tooth row, same complete viewBox; animate row translation without distorting art'})
 index[name]=entry;records.append({'id':name,'source':str(path),'sourceSha256':sha(path),'sourceBytes':path.stat().st_size,'runtime':str(dest),'sha256':sha(dest),'bytes':dest.stat().st_size,'registration':entry,**({'submittedSource':'docs/battle-v2-phase-b-review/SJM_change-files/electric.svg','receivedAt':'2026-10-14'} if name=='electric' else {})})
Path('src/assets/battle-v2/effect-art.json').write_text(json.dumps(index,indent=2)+'\n')
(root/'effect-provenance.json').write_text(json.dumps({'origin':'User-supplied Inkscape SVG replacements received 13 October 2026','license':'Authorship/licensing unspecified by supplier; development review only','tool':'Python ElementTree metadata removal; original paths, transforms, parchment #e9ddaf, opacity and aspect ratios preserved','direction':'Latest user clarification: orientation follows the acting creature: original for left attacks/defenses, mirrored for right attacks/defenses. Offensive placement follows the attacked target; block/retaliation placement follows the defender actor. Never mirror lettering.','records':records},indent=2)+'\n')
font=root/'source/font/new-rocker/NewRocker-Regular.ttf'; runtime=root/'runtime/font/NewRocker-Regular.ttf';shutil.copy2(font,runtime)
(root/'font-provenance.json').write_text(json.dumps({'family':'New Rocker','designer':'Impallari Type','license':'SIL Open Font License 1.1','licenseFile':str(root/'source/font/new-rocker/OFL.txt'),'officialLicense':'https://raw.githubusercontent.com/google/fonts/main/ofl/newrocker/OFL.txt','source':'https://raw.githubusercontent.com/google/fonts/main/ofl/newrocker/NewRocker-Regular.ttf','metadata':'https://raw.githubusercontent.com/google/fonts/main/ofl/newrocker/METADATA.pb','sourceMaster':str(font),'runtime':str(runtime),'sha256':sha(runtime),'bytes':runtime.stat().st_size,'modified':False,'fallbacks':['Georgia','Times New Roman','serif']},indent=2)+'\n')
print(f'Prepared {len(records)} supplied effect derivatives: {sum(r["bytes"] for r in records)} bytes; font {runtime.stat().st_size} bytes.')
