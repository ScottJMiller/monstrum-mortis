/** Reproducible, development-only review artifacts from screenshots of the REAL renderer. */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const phase=process.argv[2]??'hires',c=JSON.parse(await readFile('src/assets/reference-calibration.json','utf8'));
const reference=await readFile(c.reference);assert.equal(createHash('sha256').update(reference).digest('hex'),c.sha256,'Reference changed: inspect and recalibrate before claiming a match.');
const dir=resolve(`dist/composition-review/${phase}/reference-comparison`);await mkdir(dir,{recursive:true});
const tiles=[],pairs=[],metrics=[];
const label=(text,width)=>Buffer.from(`<svg width="${width}" height="42"><text x="12" y="27" fill="#eee5ca" font-family="sans-serif" font-size="18">${text}</text></svg>`);
for(let i=0;i<12;i++){
 const id=`reference-${String(i+1).padStart(2,'0')}`,source=`dist/composition-review/${phase}/${id}.png`,m=await sharp(source).metadata(),k=m.width/c.camera.stageWidth;
 const rendered=await sharp(source).extract({left:Math.round(c.camera.left*k),top:Math.round(c.camera.top*k),width:Math.round(c.camera.width*k),height:Math.round(c.camera.height*k)}).resize(...c.cellSize,{fit:'fill'}).png().toBuffer();
 const ref=await sharp(reference).extract({left:c.columns[i%4],top:c.rows[Math.floor(i/4)],width:c.cellSize[0],height:c.cellSize[1]}).png().toBuffer();
 await sharp(rendered).toFile(`${dir}/${id}-rendered.png`);await sharp(ref).toFile(`${dir}/${id}-reference.png`);
 const tileW=550,tileH=785,x=i%4*tileW,y=Math.floor(i/4)*tileH;
 tiles.push({input:rendered,left:x+10,top:y+4},{input:label(`SJM ${i+1} · actual renderer`,tileW),left:x,top:y+737});
 const pair=await sharp({create:{width:1100,height:785,channels:4,background:'#171e18'}}).composite([{input:ref,left:10,top:4},{input:rendered,left:560,top:4},{input:label(`SJM ${i+1} reference`,550),left:0,top:737},{input:label('Actual renderer',550),left:550,top:737}]).png().toBuffer();
 await sharp(pair).toFile(`${dir}/${id}-comparison.png`);
 pairs.push({input:await sharp(pair).resize(550,393).toBuffer(),left:i%4*550,top:Math.floor(i/4)*393});
 // Whole-cell difference is diagnostic only: edited colors, glass and flattened occlusion are not exact originals.
 const a=await sharp(ref).removeAlpha().raw().toBuffer(),b=await sharp(rendered).removeAlpha().raw().toBuffer();
 metrics.push({id,wholeCellMeanDifference:a.reduce((s,v,j)=>s+Math.abs(v-b[j]),0)/a.length});
}
await sharp({create:{width:2200,height:2355,channels:4,background:'#171e18'}}).composite(tiles).png().toFile(`${dir}/rendered-contact-sheet.png`);
await sharp({create:{width:2200,height:1179,channels:4,background:'#171e18'}}).composite(pairs).png().toFile(`${dir}/reference-render-comparison-sheet.png`);
await writeFile(`${dir}/metrics.json`,JSON.stringify({referenceSha256:c.sha256,camera:c.camera,metrics},null,2)+'\n');
console.log(`Prepared 12 reference/render pairs and high-resolution contact sheets from ${phase} browser captures: ${dir}`);
