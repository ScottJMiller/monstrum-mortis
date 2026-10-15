"""Offline extraction for approved redesigned sheets; source masters are immutable."""
import hashlib,json,re,subprocess,tempfile
from pathlib import Path
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def extract_family(name,roles,out):
 root=Path('assets/battle-v2');config=json.loads((root/'family-refinement-registration.json').read_text())[name]
 source=Path(config['source']);width,height=map(int,subprocess.check_output(['identify','-format','%w %h',str(source)]).decode().split())
 text=subprocess.check_output(['convert',str(source),'-alpha','extract','-threshold','2%','-define','connected-components:verbose=true','-connected-components','8','null:']).decode()
 figures=[]
 for line in text.splitlines():
  match=re.match(r'\s*(\d+): (\d+)x(\d+)\+(\d+)\+(\d+) ([\d.]+),([\d.]+) (\d+) gray\(255\)',line)
  if match:
   label,w,h,x,y,cx,cy,area=map(float,match.groups());figures.append({'label':str(int(label)),'box':[int(x),int(y),int(w),int(h)],'cx':cx,'cy':cy,'area':area})
 figures=sorted(sorted(figures,key=lambda f:-f['area'])[:len(roles)],key=lambda f:f['cy']);assert len(figures)==len(roles)
 ordered=[]
 for i in range(0,len(figures),2):ordered+=sorted(figures[i:i+2],key=lambda f:f['cx'])
 crops=[]
 for f in ordered:
  x,y,w,h=f['box'];left=max(0,x-3);top=max(0,y-3);crops.append([left,top,min(width,x+w+3)-left,min(height,y+h+3)-top])
 scale=min(560/crops[0][3],720/max(c[2] for c in crops));poses={};records=[]
 for role,figure,crop in zip(roles,ordered,crops):
  x,y,w,h=crop;dest=out/(name+'-'+role+'.webp')
  with tempfile.TemporaryDirectory(prefix='mm-family-') as temp:
   mask=Path(temp)/'mask.png';prepared=Path(temp)/'pose.png'
   subprocess.run(['convert',str(source),'-alpha','extract','-threshold','2%','-define','connected-components:mean-color=true','-define','connected-components:keep='+figure['label'],'-connected-components','8','-morphology','Dilate','Disk:1',str(mask)],check=True)
   subprocess.run(['convert',str(source),'(',str(mask),'-alpha','copy',')','-compose','DstIn','-composite','-crop',f'{w}x{h}+{x}+{y}','+repage','-resize',f'{scale*100}%','-strip','-quality','82',str(dest)],check=True)
  rw,rh=map(int,subprocess.check_output(['identify','-format','%w %h',str(dest)]).decode().split());reg=config['poses'][role];point=lambda p:[round(p[0]*rw,3),round(p[1]*rh,3)]
  entry={'url':'/'+str(dest),'width':rw,'height':rh,'pivot':point(reg['pivot']),'torso':[point(p) for p in reg['torso']],'shoulder':point(reg['shoulder']),'eye':point(reg['eye']),'eyes':[point(p) for p in reg.get('eyes',[reg['eye']])],'eyeRadius':reg.get('eyeRadius',.04)*min(rw,rh),'facing':'right'}
  poses[role]=entry;records.append({'id':name+'.'+role,'source':str(source),'sourceSha256':sha(source),'crop':crop,'uniformScale':scale,'uniformSetScale':scale,'runtime':str(dest),'sha256':sha(dest),'bytes':dest.stat().st_size,'registration':entry,'cleanup':'Actual complete figure component at 2% alpha, expanded one pixel; preserve original alpha and exclude neighboring poses','figureComponent':figure['label']})
 return poses,records
