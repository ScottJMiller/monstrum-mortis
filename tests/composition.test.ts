import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ART, DRAW_BOUNDS, axes, bodyLayout, colorMatrix, creatureLayers, fitAtAnchor, layerBounds } from '../src/client/creature-render.ts';
import type { CreatureView } from '../src/shared/types.ts';
const fixtures = JSON.parse(readFileSync(new URL('../src/assets/composition-fixtures.json', import.meta.url), 'utf8')) as {id:string;creature:CreatureView}[];
const preset = (id:string) => fixtures.find(f=>f.id===id)!.creature;
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-8,`${a} versus ${b}`);

test('actual attachment pivot stays fixed under growth, fitting, and mirroring',()=>{
  const anchor={x:480,y:430},pivot={x:.17,y:.08};
  for(const mirror of [false,true])for(const w of [70,150,1000]){
    const r=fitAtAnchor(anchor,pivot,w,1.7,mirror);
    near(r.x-r.width/2+(mirror?1-pivot.x:pivot.x)*r.width,anchor.x);
    near(r.y-r.height/2+pivot.y*r.height,anchor.y);
    near(r.height/r.width,1.7);
    assert.ok(r.x-r.width/2>=DRAW_BOUNDS.left-1e-8&&r.x+r.width/2<=DRAW_BOUNDS.right+1e-8);
    assert.ok(r.y-r.height/2>=DRAW_BOUNDS.top-1e-8&&r.y+r.height/2<=DRAW_BOUNDS.bottom+1e-8);
  }
});
test('all authoritative fixture layers survive projection unchanged and fit at the chamber extremes',()=>{
  for(const f of fixtures){const before=structuredClone(f.creature);const {layers,missing}=creatureLayers(f.creature);
    assert.deepEqual(missing,[],f.id);assert.deepEqual(new Set(layers.map(l=>l.key)),new Set(f.creature.parts.map(p=>p.instanceId)),f.id);
    for(const l of layers){const b=layerBounds(l);assert.ok(l.width>0&&l.height>0);assert.ok(b.left>=DRAW_BOUNDS.left-1e-8&&b.left+b.width<=DRAW_BOUNDS.right+1e-8);assert.ok(b.top>=DRAW_BOUNDS.top-1e-8&&b.top+b.height<=DRAW_BOUNDS.bottom+1e-8);}
    assert.deepEqual(f.creature,before);
  }
});
test('replacement artwork preserves the canonical head frame; reinforcement cannot move any socket',()=>{
  const frames=['starter','candle','skeleton','two-bodies'].map(id=>bodyLayout(preset(id)));
  assert.equal(frames[0]!.profile,'blob');assert.equal(frames[1]!.profile,'candle');assert.equal(frames[2]!.profile,'skeleton');assert.equal(frames[3]!.profile,'skeleton');
  for(const f of frames)assert.deepEqual(f.anchors,frames[0]!.anchors);
  // The tall composite texture is a draw extent, not a reason to move the face or limbs.
  const candle=ART.find(a=>a.id==='mutation.candle-flesh')!;const original=candle.dimensions;
  try{candle.dimensions=[original[0]!,original[1]!*2];assert.deepEqual(bodyLayout(preset('candle')),frames[1]);}finally{candle.dimensions=original;}
  for(const id of ['heavy-all-slots','candle','skeleton','two-bodies']){const c=preset(id);const grown={...c,parts:c.parts.map(p=>({...p,scale:1.3}))};
    assert.deepEqual(bodyLayout(c),bodyLayout(grown));const original=creatureLayers(c).layers;
    for(const l of creatureLayers(grown).layers)assert.deepEqual(l.anchor,original.find(o=>o.key===l.key)!.anchor);
  }
});
test('paired limbs extend outward from their rooted shoulders with independently authored poses',()=>{
  for(const id of ['single-razor-talons','single-kitten-paws']){const limbs=creatureLayers(preset(id)).layers.filter(l=>l.asset.slot==='forelimb-left');
    assert.equal(limbs.length,2);const left=limbs.find(l=>l.key.endsWith('forelimb-left'))!;const right=limbs.find(l=>l.key.endsWith('forelimb-right'))!;
    assert.ok(left.x<left.anchor.x&&right.x>right.anchor.x);assert.notEqual(left.mirror,right.mirror);
    const grown={...preset(id),parts:preset(id).parts.map(p=>({...p,scale:1.3}))};
    for(const l of creatureLayers(grown).layers.filter(l=>l.asset.slot==='forelimb-left'))assert.deepEqual(l.anchor,limbs.find(o=>o.key===l.key)!.anchor);
    assert.ok(Math.abs(left.width-right.width)/left.width<.05);
  }
});
test('facial features remain above the organs and distinct through maximum supported reinforcement',()=>{
  for(const id of ['heavy-viscera','reinforced','skeleton','two-bodies']){const {layers}=creatureLayers(preset(id));const eyes=layers.find(l=>l.asset.slot==='eyes')!,mouth=layers.find(l=>l.asset.slot==='mouth')!;
    // The sheet intentionally overlaps transparent image edges and organ roots behind the face.
    assert.ok(mouth.y-eyes.y>Math.max(eyes.height,mouth.height)*.3,id);
    for(const organ of layers.filter(l=>l.asset.id==='mutation.excessive-viscera'))assert.ok(organ.y>mouth.y+mouth.height/2&&organ.order<mouth.order,id);
    assert.ok(layers.filter(l=>l.asset.layer==='surface'||l.asset.layer==='organs').every(l=>l.order<eyes.order));
  }
});
test('baseline facial images keep authored proportions rather than being squashed by reinforcement caps',()=>{
 const c=preset('single-porcelain-teeth'),face=ART.find(a=>a.id==='mutation.porcelain-teeth')!;
 const heightScale=face.heightScale;
 try{
  face.heightScale=2;
  const normal=creatureLayers(c).layers.find(l=>l.asset.id===face.id)!;
  near(normal.width,face.width!*bodyLayout(c).width);
  const grown=creatureLayers({...c,parts:c.parts.map(p=>({...p,scale:1.3}))}).layers.find(l=>l.asset.id===face.id)!;
  near(normal.height/normal.width,grown.height/grown.width);assert.deepEqual(normal.anchor,grown.anchor);
 }finally{face.heightScale=heightScale;}
});
test('replacement draws the authoritative paws only; translucent full-body coexistence stays visible',()=>{
  const paws=creatureLayers(preset('replacement-paws')).layers;assert.equal(paws.filter(l=>l.asset.id==='mutation.kitten-paws').length,2);assert.equal(paws.filter(l=>l.asset.id==='mutation.razor-talons').length,0);
  const body=creatureLayers(preset('two-bodies')).layers.filter(l=>l.asset.layer==='body');assert.equal(body.length,2);assert.equal(body[0]!.asset.id,'mutation.brittle-skeleton');assert.equal(body[1]!.opacity,.45);
});

test('rotated, mirrored attachments stay rooted while the entire rotated rectangle fits',()=>{
 const anchor={x:120,y:230},pivot={x:.3,y:.06};
 for(const rotation of [Math.PI,Math.PI/3,-Math.PI/4])for(const mirror of [false,true])for(const width of [90,900]){
  const r=fitAtAnchor(anchor,pivot,width,1.5,mirror,rotation);const dx=((mirror?1-pivot.x:pivot.x)-.5)*r.width,dy=(pivot.y-.5)*r.height;
  near(r.x+dx*Math.cos(rotation)-dy*Math.sin(rotation),anchor.x);near(r.y+dx*Math.sin(rotation)+dy*Math.cos(rotation),anchor.y);
  const b=layerBounds({...r,rotation});assert.ok(b.left>=DRAW_BOUNDS.left-1e-8&&b.left+b.width<=DRAW_BOUNDS.right+1e-8&&b.top>=DRAW_BOUNDS.top-1e-8&&b.top+b.height<=DRAW_BOUNDS.bottom+1e-8);
 }
});
test('reference proportions and de-emphasis preserve authoritative opacity, source parts and face ordering',()=>{
 const c=preset('single-bellows-lung');const input=structuredClone(c);const lung=creatureLayers(c).layers.find(l=>l.asset.id==='mutation.bellows-lung')!;
 assert.equal(lung.opacity,.5);const faint={...c,parts:c.parts.map(p=>({...p,opacity:.45}))};near(creatureLayers(faint).layers.find(l=>l.asset.id===lung.asset.id)!.opacity,.225);assert.deepEqual(c,input);
 const paws=creatureLayers(preset('single-kitten-paws')).layers.filter(l=>l.asset.id==='mutation.kitten-paws');assert.ok(paws.every(l=>l.y<l.anchor.y));
 const grin=creatureLayers(preset('single-guillotine-teeth')).layers.find(l=>l.asset.slot==='mouth')!;assert.ok(grin.height/grin.width<.4);
 const body=creatureLayers(preset('skeleton')).layers.filter(l=>l.asset.slot==='body');assert.equal(body.length,1);assert.equal(body[0]!.asset.id,'mutation.brittle-skeleton');
});
test('shared color grades leave alpha unchanged and cannot encode any creature state',()=>{
 for(const asset of ART){const matrix=colorMatrix(asset);assert.equal(matrix.length,20);assert.ok(matrix.every(Number.isFinite));assert.deepEqual(matrix.slice(15),[0,0,0,1,0]);}
 const plain=colorMatrix(ART.find(a=>a.id==='creature.blob')!);assert.deepEqual(plain,[1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0]);
});
test('skewed, mirrored parts remain rooted while fitting all transformed corners',()=>{
 const anchor={x:530,y:480},pivot={x:.12,y:.17},rotation=-.4,skew={x:-.35,y:.16},[a,b,c,d]=axes(rotation,skew);
 for(const mirror of [false,true])for(const width of [60,200,1000]){
  const l=fitAtAnchor(anchor,pivot,width,.8,mirror,rotation,skew),dx=((mirror?1-pivot.x:pivot.x)-.5)*l.width,dy=(pivot.y-.5)*l.height;
  near(l.x+dx*a+dy*c,anchor.x);near(l.y+dx*b+dy*d,anchor.y);
  for(const x of [0,1])for(const y of [0,1]){const u=(x-.5)*l.width,v=(y-.5)*l.height,px=l.x+u*a+v*c,py=l.y+u*b+v*d;
   assert.ok(px>=DRAW_BOUNDS.left-1e-8&&px<=DRAW_BOUNDS.right+1e-8&&py>=DRAW_BOUNDS.top-1e-8&&py<=DRAW_BOUNDS.bottom+1e-8);
  }
 }
});
test('three independently identified hook landmarks project to the reference through the real composition',()=>{
 const ref=JSON.parse(readFileSync(new URL('../src/assets/reference-calibration.json',import.meta.url),'utf8'));
 const q=ref.parts.find(p=>p.id==='mutation.hook-tentacles'),f=ref.bodyFrame,c=preset('single-hook-tentacles');
 const l=creatureLayers(c).layers.find(l=>l.asset.id===q.id)!,layout=bodyLayout(c),[a,b,d,e]=axes(l.rotation,l.skew);
 for(const p of q.landmarks.points){const u=(p.source[0]/q.landmarks.dimensions[0]-.5)*l.width*(l.mirror?-1:1),v=(p.source[1]/q.landmarks.dimensions[1]-.5)*l.height;
  const px=l.x+u*a+v*d,py=l.y+u*b+v*e;
  assert.ok(Math.abs(f.cx+(px-layout.x)/layout.width*f.width-p.reference[0])<1.5);
  assert.ok(Math.abs(f.cy+(py-layout.y)/layout.height*f.height-p.reference[1])<1.5);
 }
});
