/** Development asset assembly. Reuse the exact existing masters; no new generation or game rules. */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
const calibration=JSON.parse(readFileSync('src/assets/reference-calibration.json','utf8'));
const provenance=JSON.parse(readFileSync('assets/provenance.json','utf8'));
const frame=calibration.bodyFrame;
const width=400,height=400*frame.height/frame.width;
const scratch=mkdtempSync(join(tmpdir(),'mm-body-assembly-'));
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const embedded=id=>{const path=`assets/source/${id}.png`,trimmed=join(scratch,`${id}.png`);execFileSync('convert',[path,'-trim','+repage',trimmed]);return{path,sha256:sha(path),uri:`data:image/png;base64,${readFileSync(trimmed).toString('base64')}`};};
try{
 const blob=embedded('creature.blob');
 for(const id of ['mutation.brittle-skeleton','mutation.candle-flesh']){
  const q=calibration.parts.find(p=>p.id===id),part=embedded(id);
  const w=q.width/frame.width*width,h=q.height/frame.height*height;
  const x=width/2+(q.cx-frame.cx)/frame.width*width,y=height/2+(q.cy-frame.cy)/frame.height*height;
  const radians=q.rotation*Math.PI/180,bw=Math.abs(Math.cos(radians))*w+Math.abs(Math.sin(radians))*h,bh=Math.abs(Math.sin(radians))*w+Math.abs(Math.cos(radians))*h;
  const left=Math.min(0,x-bw/2),top=Math.min(0,y-bh/2),right=Math.max(width,x+bw/2),bottom=Math.max(height,y+bh/2),vw=right-left,vh=bottom-top;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${Math.ceil(vw*3)}" height="${Math.ceil(vh*3)}" viewBox="${left} ${top} ${vw} ${vh}"><image x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none" xlink:href="${blob.uri}"/><g transform="translate(${x} ${y}) rotate(${q.rotation}) scale(${q.mirror?-1:1} 1)"><image x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" preserveAspectRatio="none" xlink:href="${part.uri}"/></g></svg>`;
  const master=`assets/source/${id}-v3.png`;await sharp(Buffer.from(svg)).png().toFile(master);
  const row=provenance.find(r=>r.id===id);
  if(row.source!==master)row.previousProduction={...row};
  Object.assign(row,{source:master,origin:'assembled-generated-masters',date:'2026-10-10',prompt:'Deterministic SVG assembly of the original blob and original anatomical module using the inspected high-resolution contact-sheet transforms. No new image generation. Original generation prompts remain in previousProduction.',references:[blob.path,part.path,calibration.reference],assembly:{tool:'SVG affine composition rasterized with Sharp; no repainting',preserveFrame:true,components:[{source:blob.path,sha256:blob.sha256,x:0,y:0,width,height},{source:part.path,sha256:part.sha256,...q}],viewBox:{left,top,width:vw,height:vh},referenceSha256:calibration.sha256},bodyFrame:{width,height},width:vw/width,pivot:{x:(width/2-left)/vw,y:(height/2-top)/vh},offset:{x:0,y:0},heightScale:1,rotation:0,mirror:false});
 }
 writeFileSync('assets/provenance.json',JSON.stringify(provenance,null,2)+'\n');
 console.log('Assembled two replacement-body masters from the original blob and original anatomical modules.');
}finally{rmSync(scratch,{recursive:true,force:true});}
