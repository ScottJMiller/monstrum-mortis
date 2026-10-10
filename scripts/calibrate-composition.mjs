/** Apply inspected reference-cell transforms to body-relative attachment metadata. Development only. */
import { readFileSync, writeFileSync } from 'node:fs';
import { bodyLayout } from '../src/client/creature-render.ts';
const calibration=JSON.parse(readFileSync('src/assets/reference-calibration.json','utf8'));
const provenance=JSON.parse(readFileSync('assets/provenance.json','utf8'));
const layout=bodyLayout(null),frame=calibration.bodyFrame;
function pose(row,q,slot){
 const mirror=q.mirror,r=q.rotation*Math.PI/180,w=q.width/frame.width*layout.width,h=q.height/frame.height*layout.height;
 const cx=layout.x+(q.cx-frame.cx)/frame.width*layout.width,cy=layout.y+(q.cy-frame.cy)/frame.height*layout.height;
 const dx=((mirror?1-row.pivot.x:row.pivot.x)-.5)*w,dy=(row.pivot.y-.5)*h;
 const root={x:cx+dx*Math.cos(r+(q.skew?.y??0)*Math.PI/180)-dy*Math.sin(r-(q.skew?.x??0)*Math.PI/180),y:cy+dx*Math.sin(r+(q.skew?.y??0)*Math.PI/180)+dy*Math.cos(r-(q.skew?.x??0)*Math.PI/180)};
 const socket=layout.anchors[slot==='forelimb-right'?'shoulder-right':row.anchor];
 return{width:w/layout.width,heightScale:(h/w)/(row.dimensions[1]/row.dimensions[0]),rotation:q.rotation,...(q.skew?{skew:q.skew}:{}),offset:{x:(root.x-socket.x)/layout.width,y:(root.y-socket.y)/layout.height}};
}
for(const row of provenance){
 const q=calibration.parts.find(p=>p.id===row.id);if(!q||row.id==='creature.blob')continue;
 if(row.bodyFrame){row.compositionReview=`9–10 October 2026: original-part assembly from high-resolution reference ${calibration.sha256}. Canonical head frame preserved.`;continue;}
 // The reference contains one right-side wandering limb. Author its left pose by reflecting the same source.
 let left=q;if(row.id==='mutation.wandering-limb')left={...q,cx:2*frame.cx-q.cx,mirror:!q.mirror,rotation:-q.rotation,...(q.skew?{skew:{x:-q.skew.x,y:-q.skew.y}}:{})};
 // Calibration is replaceable: a new unskewed fit must clear an earlier skew.
 delete row.skew;
 Object.assign(row,pose(row,left,row.slot));
 if(row.slot==='forelimb-left'){
  row.mirrorOnLeft=left.mirror;
  const right=calibration.parts.find(p=>p.id===`${row.id}:right`)??{...left,cx:2*frame.cx-left.cx,mirror:!left.mirror,rotation:-left.rotation,...(left.skew?{skew:{x:-left.skew.x,y:-left.skew.y}}:{})};
  row.rightPose=pose(row,right,'forelimb-right');
 }else row.mirror=left.mirror;
 row.attachment={x:(layout.anchors[row.anchor].x-layout.x)/layout.width+.5+row.offset.x,y:(layout.anchors[row.anchor].y-layout.y)/layout.height+.5+row.offset.y};
 row.compositionReview=`9–10 October 2026: inspected high-resolution reference ${calibration.sha256}, cell ${q.cell}; independent horizontal/vertical dimensions, rotation and actual trimmed-source pivot.`;
}
writeFileSync('assets/provenance.json',JSON.stringify(provenance,null,2)+'\n');
const keys=['id','url','dimensions','slot','attachment','width','order','pivot','mirroredSlots','description','anchor','layer','mirrorOnLeft','offset','rotation','skew','heightScale','opacity','mirror','color','colorGrade','bodyFrame','rightPose'];
writeFileSync('src/assets/production.json',JSON.stringify(provenance.map(r=>Object.fromEntries(keys.filter(k=>k in r).map(k=>[k,r[k]]))),null,2)+'\n');
console.log('Calibrated all 30 parts and both mirrored limb poses against the canonical blob frame.');
