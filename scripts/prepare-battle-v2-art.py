#!/usr/bin/env python3
"""Offline crop/optimization only; retained imagegen masters stay unchanged."""
import json, hashlib, subprocess
from pathlib import Path
root=Path('assets/battle-v2'); runtime=root/'runtime'; runtime.mkdir(parents=True,exist_ok=True)
# Explicit source crop, uniform factor and source-relative grounded pivot.
# Each registration is specific to that pose, including torso outline and protected eye zone.
# Coordinates below are within cropped sprite before scaling.
poses={
 'family-1':{
 'idle':([204,28,677,1480],.398,[361,1455],[[219,254],[399,237],[341,552],[161,532]],[246,252],[512,87]),
 'attack':([480,20,606,493],1.16,[290,477],[[195,89],[269,123],[275,225],[216,218]],[223,98],[376,56]),
 'bite':([10,10,1516,1004],.47,[930,970],[[756,218],[1058,257],[1010,447],[739,402]],[773,230],[1390,77]),
 'recoil':([60,515,530,518],1.16,[335,496],[[79,53],[178,125],[227,213],[151,194]],[83,76],[83,40]),
 'defense':([615,535,450,501],1.16,[240,477],[[136,135],[232,131],[187,258],[103,208]],[145,144],[290,113]),
 'defeat':([10,1110,685,310],1.10,[335,278],[[184,83],[278,106],[260,174],[126,172]],[200,91],[145,154]),
 },
 'iron-widow':{
 'idle':([0,10,538,449],1.12,[270,435],[[128,190],[334,175],[390,287],[162,320]],[210,185],[180,163]),
 'attack':([533,35,553,432],1.12,[285,417],[[143,216],[354,160],[399,254],[175,312]],[239,199],[159,224]),
 'recoil':([0,462,557,530],1.12,[280,514],[[215,212],[351,222],[443,329],[195,340]],[280,195],[359,103]),
 'defense':([568,538,518,434],1.12,[265,414],[[153,172],[354,151],[395,263],[155,305]],[209,178],[203,195]),
 'defeat':([0,1021,627,386],1.12,[305,365],[[155,180],[365,128],[459,283],[136,312]],[202,190],[148,240]),
 }}
index={}; records=[]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
for body,definitions in poses.items():
 source=root/'source'/(body+'-poses.png'); info={}
 for role,(crop,scale,pivot,torso,shoulder,eye) in definitions.items():
  source=root/'source'/(f'family-1-{role}.png' if body=='family-1' and role in ['idle','bite'] else body+'-poses.png')
  x,y,w,h=crop; dest=runtime/(body+'-'+role+'.webp')
  subprocess.run(['convert',str(source),'-crop',f'{w}x{h}+{x}+{y}','+repage','-resize',f'{scale*100}%','-strip','-quality','84',str(dest)],check=True)
  dimensions=[int(n) for n in subprocess.check_output(['identify','-format','%w %h',str(dest)]).decode().split()]
  # Same uniform factor for geometry; never stretch a torso independently of its associated art.
  point=lambda p:[round(p[0]*scale,3),round(p[1]*scale,3)]
  entry={'url':'/'+str(dest),'width':dimensions[0],'height':dimensions[1],'pivot':point(pivot),'torso':[point(p) for p in torso],'shoulder':point(shoulder),'eye':point(eye),'eyeRadius':24*scale,'facing':'right' if body=='family-1' else 'left'}
  info[role]=entry;records.append({'id':body+'.'+role,'source':str(source),'sourceSha256':sha(source),'crop':crop,'uniformScale':scale,'runtime':str(dest),'sha256':sha(dest),'bytes':dest.stat().st_size,'registration':entry})
 index[body]=info
for name in ['arena','panel']:
 source=root/'source'/(name+'.png'); dest=runtime/(name+'.webp')
 subprocess.run(['convert',str(source),'-resize','1280x1280>','-strip','-quality','82',str(dest)],check=True)
 index[name]='/'+str(dest);records.append({'id':name,'source':str(source),'sourceSha256':sha(source),'runtime':str(dest),'sha256':sha(dest),'bytes':dest.stat().st_size})
source=Path('assets/source/mutation.existential-organ.png'); dest=runtime/'shoulder-eye.webp'
subprocess.run(['convert',str(source),'-trim','+repage','-resize','128x128','-strip','-quality','84',str(dest)],check=True)
index['shoulderEye']='/'+str(dest)
records.append({'id':'shoulder-eye','source':str(source),'sourceSha256':sha(source),'runtime':str(dest),'sha256':sha(dest),'bytes':dest.stat().st_size,'origin':'Reused approved generated Existential Organ; exact original prompt/tool in assets/provenance.json','registration':'Pose-specific shoulder anchors in art.json; uniform size, pupil animation on associated growth'})
index['readiness']={'family-1':'five-pose-sample-with-dedicated-bite-variant','iron-widow':'five-pose-sample','blob':'existing-art-idle-animation-only','remainingFamilies':'planned','remainingRivals':'planned','remainingArenas':'planned','damageVariants':'planned-phase-B'}
Path('src/assets/battle-v2/art.json').write_text(json.dumps(index,indent=2)+'\n')
(root/'derivatives.json').write_text(json.dumps({'tool':'ImageMagick offline crop/uniform resize/WebP84; backgrounds WebP82','records':records},indent=2)+'\n')
print(f'Prepared {len(records)} raster derivatives, {sum(r["bytes"] for r in records)} bytes.')
