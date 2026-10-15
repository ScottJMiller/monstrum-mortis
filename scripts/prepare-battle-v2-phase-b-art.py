#!/usr/bin/env python3
"""Extract selected sheets without touching masters; explicit registration per pose is retained separately."""
import hashlib,json,subprocess,re,tempfile
from pathlib import Path
from battle_v2_family_art import extract_family
root=Path('assets/battle-v2'); source=root/'source/phase-b'; out=root/'runtime/phase-b';out.mkdir(parents=True,exist_ok=True)
ids=['family-2','family-3','family-4','family-5','blob','gutter-seraph','carrion-duke','coil-saint','maw-engine','the-unfinished']
roles=['idle','attack','recoil','defense','defeat'];records=[];bodies={}
registration=Path('assets/battle-v2/phase-b-registration.json')
custom=json.loads(registration.read_text()) if registration.exists() else {}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def geometry(p):return list(map(int,subprocess.check_output(['identify','-format','%w %h',str(p)]).decode().split()))
for name in ids:
 if name=='family-3' and (root/'family-refinement-registration.json').exists():
  body,refined=extract_family(name,roles,out);bodies[name]=body;records+=refined;continue
 master=source/(name+'-poses.png')
 if not master.exists():continue
 width,height=geometry(master);bounds=[]
 rival=not(name.startswith('family')or name=='blob')
 threshold='2%' if rival else '25%'
 components=subprocess.check_output(['convert',str(master),'-alpha','extract','-threshold',threshold,'-define','connected-components:verbose=true','-connected-components','8','null:']).decode()
 figures=[]
 for line in components.splitlines():
  match=re.match(r'\s*(\d+): (\d+)x(\d+)\+(\d+)\+(\d+) ([\d.]+),([\d.]+) (\d+) gray\(255\)',line)
  if match:
   label,w,h,x,y,cx,cy,area=map(float,match.groups());figures.append({'label':str(int(label)),'box':[int(x),int(y),int(w),int(h)],'cx':cx,'cy':cy,'area':area})
 figures=sorted(figures,key=lambda f:-f['area'])[:5];assert len(figures)==5,f'{name} has no five complete figures'
 figures=sorted(figures,key=lambda f:f['cy']);groups=[sorted(figures[:2],key=lambda f:f['cx']),sorted(figures[2:4],key=lambda f:f['cx']),figures[4:]]
 ordered=[f for group in groups for f in group]
 ybreak=[0]+[round((max(f['box'][1]+f['box'][3] for f in groups[i])+min(f['box'][1] for f in groups[i+1]))/2) for i in [0,1]]+[height]
 regions=[]
 for row,group in enumerate(groups):
  xbreak=round((group[0]['box'][0]+group[0]['box'][2]+group[1]['box'][0])/2) if len(group)==2 else width
  for col,f in enumerate(group):regions.append([0 if col==0 else xbreak,ybreak[row],xbreak if col==0 else width-xbreak,ybreak[row+1]-ybreak[row]])

 for i,role in enumerate(roles):
  x,y,w,h=regions[i]
  crop=custom.get(name,{}).get(role,{}).get('sourceCrop',[x,y,w,h]);x,y,w,h=crop
  alpha=subprocess.check_output(['convert',str(master),'-crop',f'{w}x{h}+{x}+{y}','+repage','-alpha','extract','-depth','8','gray:-'])
  points=[(n%w,n//w) for n,a in enumerate(alpha) if a>=24];assert points,f'{name}.{role} empty'
  minx,miny=max(0,min(p[0] for p in points)-3),max(0,min(p[1] for p in points)-3);maxx,maxy=min(w-1,max(p[0] for p in points)+3),min(h-1,max(p[1] for p in points)+3)
  bounds.append([x+minx,y+miny,maxx-minx+1,maxy-miny+1])
  if rival:
   # Equal-cell/gutter cuts included tails/hands from neighboring poses whose bounds overlap.
   # Isolate the actual whole-sheet figure, not a guessed half-sheet rectangle.
   fx,fy,fw,fh=ordered[i]['box'];left=max(0,fx-3);top=max(0,fy-3)
   bounds[-1]=[left,top,min(width,fx+fw+3)-left,min(height,fy+fh+3)-top]
 factor=min(560/bounds[0][3],720/max(c[2] for c in bounds))
 body={}
 for role,crop in zip(roles,bounds):
  x,y,w,h=crop; dest=out/(name+'-'+role+'.webp')
  with tempfile.TemporaryDirectory(prefix='mm-pose-') as temp:
   prepared=master
   if rival:
    mask=Path(temp)/'mask.png';prepared=Path(temp)/'isolated.png'
    subprocess.run(['convert',str(master),'-alpha','extract','-threshold','2%','-define','connected-components:mean-color=true','-define','connected-components:keep='+ordered[roles.index(role)]['label'],'-connected-components','8','-morphology','Dilate','Disk:1',str(mask)],check=True)
    subprocess.run(['convert',str(master),'(',str(mask),'-alpha','copy',')','-compose','DstIn','-composite',str(prepared)],check=True)
   subprocess.run(['convert',str(prepared),'-crop',f'{w}x{h}+{x}+{y}','+repage','-resize',f'{factor*100}%','-strip','-quality','82',str(dest)],check=True)
  rw,rh=geometry(dest);reg=custom.get(name,{}).get(role,{})
  # Defaults are provisional anatomy landmarks; authored per-pose overrides must pass real-render inspection.
  point=lambda p:[round(p[0]*rw,3),round(p[1]*rh,3)]
  torso=reg.get('torso',[[.3,.25],[.62,.25],[.63,.65],[.27,.65]])
  body[role]={'url':'/'+str(dest),'width':rw,'height':rh,'pivot':point(reg.get('pivot',[.5,.98])),'torso':[point(p) for p in torso],'shoulder':point(reg.get('shoulder',[.4,.33])),'eye':point(reg.get('eye',[.7,.21] if name.startswith('family') or name=='blob' else [.3,.21])),'eyeRadius':reg.get('eyeRadius',.05)*min(rw,rh),'facing':'right' if name.startswith('family') or name=='blob' else 'left','limb':[point(p) for p in reg.get('limb',[[.67,.5],[.8,.5],[.8,.9],[.65,.9]])],'jaw':[point(p) for p in reg.get('jaw',[[.64,.25],[.79,.25],[.79,.36],[.64,.36]])]}
  if 'bodyGuard'in reg:body[role]['bodyGuard']=[point(p) for p in reg['bodyGuard']]
  body[role]['eyes']=[point(p) for p in reg.get('eyes',[reg.get('eye',[.7,.21])])]
  records.append({'id':name+'.'+role,'source':str(master),'sourceSha256':sha(master),'crop':crop,'uniformSetScale':factor,'runtime':str(dest),'sha256':sha(dest),'bytes':dest.stat().st_size,'registration':body[role],**({'cleanup':'Whole-sheet 2% alpha figure component, expanded one pixel, multiplied into original alpha; neighboring pose fragments excluded','figureComponent':ordered[roles.index(role)]['label']}if rival else {})})
 bodies[name]=body
arenas={}
for name in ['arena-catacomb','arena-foundry']:
 master=source/(name+'.png')
 if master.exists():
  dest=out/(name+'.webp');subprocess.run(['convert',str(master),'-resize','1280x1280>','-strip','-quality','82',str(dest)],check=True);arenas[name]='/'+str(dest);records.append({'id':name,'source':str(master),'sourceSha256':sha(master),'runtime':str(dest),'sha256':sha(dest),'bytes':dest.stat().st_size})
grafts={};master=source/'graft-parts.png'
if master.exists():
 width,height=geometry(master)
 for i,name in enumerate(['barb','veins','mouth','growth','wound','scar','shards','limb-fragment']):
  row,col=divmod(i,4);x=round(col*width/4);y=round(row*height/2);w=round(width/4);h=min(round(height/2),height-y);dest=out/('graft-'+name+'.webp')
  with tempfile.TemporaryDirectory(prefix='mm-graft-') as temp:
   prepared=Path(temp)/'part.png';mask=Path(temp)/'mask.png'
   subprocess.run(['convert',str(master),'-crop',f'{w}x{h}+{x}+{y}','+repage','-trim','+repage','-resize','256x256>','-strip',str(prepared)],check=True)
   components=subprocess.check_output(['convert',str(prepared),'-alpha','extract','-threshold','2%','-define','connected-components:verbose=true','-connected-components','8','null:']).decode()
   areas=[]
   for line in components.splitlines():
    match=re.match(r'\s*(\d+): .* ([\d]+) gray\(255\)',line)
    if match:areas.append((int(match[1]),int(match[2])))
   keep=[str(c[0]) for c in sorted(areas,key=lambda a:-a[1])[:3 if name=='shards'else 1]]
   masks=[]
   for component in keep:
    island=Path(temp)/('island-'+component+'.png');masks.append(str(island))
    subprocess.run(['convert',str(prepared),'-alpha','extract','-threshold','2%','-define','connected-components:mean-color=true','-define','connected-components:keep='+component,'-connected-components','8','-morphology','Dilate','Disk:1',str(island)],check=True)
   # Union individually retained components: the ImageMagick build merges a multi-keep list into its last label.
   subprocess.run(['convert',*masks,'-evaluate-sequence','max',str(mask)],check=True)
   subprocess.run(['convert',str(prepared),'(',str(mask),'-alpha','copy',')','-compose','DstIn','-composite','-strip','-quality','84',str(dest)],check=True)
  rw,rh=geometry(dest);alpha=subprocess.check_output(['convert',str(dest),'-alpha','extract','-depth','8','gray:-']);grafts[name]={'url':'/'+str(dest),'width':rw,'height':rh,'alphaArea':sum(alpha)/255};records.append({'id':'graft-'+name,'source':str(master),'sourceSha256':sha(master),'crop':[x,y,w,h],'keptAlphaComponents':keep,'cleanup':'Keep main connected anatomical part; shards retain three intended fragments. Frame retained for stable roots; original alpha multiplied by union of individually retained one-pixel-expanded masks.','runtime':str(dest),'sha256':sha(dest),'bytes':dest.stat().st_size})
growth=grafts.get('growth')
if growth:
 growth['pivot']=[growth['width']*.49,growth['height']*.96];growth['eye']=[growth['width']*.65,growth['height']*.33]
originalDamage={}
original=json.loads(Path('src/assets/battle-v2/art.json').read_text())
for name in ['family-1']:
 originalDamage[name]={}
 for role,reg in custom[name].items():
  a=original[name][role]
  originalDamage[name][role]={key:[[round(p[0]*a['width'],3),round(p[1]*a['height'],3)] for p in reg[key]] for key in ['limb','jaw']}
Path('src/assets/battle-v2/phase-b-art.json').write_text(json.dumps({'bodies':bodies,'arenas':arenas,'grafts':grafts,'originalDamage':originalDamage},indent=2)+'\n')
(root/'phase-b-derivatives.json').write_text(json.dumps({'tool':'ImageMagick offline crops; uniform scale per new set, WebP82/84; pose-local registration and graft alpha cleanup','script':'scripts/prepare-battle-v2-phase-b-art.py','scriptSha256':sha(Path(__file__)),'registrationSource':str(registration),'registrationSha256':sha(registration),'familyRefinement':{'script':'scripts/battle_v2_family_art.py','scriptSha256':sha(Path('scripts/battle_v2_family_art.py')),'registration':'assets/battle-v2/family-refinement-registration.json','registrationSha256':sha(root/'family-refinement-registration.json')},'records':records},indent=2)+'\n')
print(f'Prepared {len(bodies)} new sets, {len(arenas)} arenas, {len(grafts)} graft parts; {sum(r["bytes"] for r in records)} bytes.')
