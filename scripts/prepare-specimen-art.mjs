import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const generation=JSON.parse(readFileSync('assets/specimens/generation.json','utf8'));
const clues=JSON.parse(readFileSync('src/assets/specimen-clues.json','utf8'));
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
mkdirSync('public/assets/specimens/illustrated',{recursive:true});
const records=[];
for(const r of generation.records){
 const runtime=`public/assets/specimens/illustrated/${r.id}.webp`;
 execFileSync('convert',[r.source,'-resize','224x224','-strip','-quality','82',runtime]);
 const clue=clues.find(c=>c.id===`clue.${r.id}`);if(!clue)throw Error(`Missing public clue ${r.id}`);
 clue.url='/'+runtime.replace('public/','');
 records.push({id:clue.id,description:clue.description,source:r.source,sourceSha256:sha(r.source),sourceBytes:readFileSync(r.source).length,runtime,sha256:sha(runtime),bytes:readFileSync(runtime).length,dimensions:[224,224],fallback:`public/assets/specimens/${r.id}.svg`,processing:'ImageMagick resize to 224px square, strip metadata, WebP quality 82; no content repainting',origin:'generated',tool:'Built-in image_gen',license:'Generated project output; prompts and original paths in assets/specimens/generation.json; no third-party stock reference'});
}
if(records.length!==30||new Set(records.map(r=>r.sha256)).size!==30)throw Error('Need thirty distinct real illustrations');
writeFileSync('src/assets/specimen-clues.json',JSON.stringify(clues,null,2)+'\n');
writeFileSync('assets/specimens/provenance.json',JSON.stringify({date:'2026-10-15',records},null,2)+'\n');
console.log(`Prepared ${records.length} illustrated specimens (${records.reduce((n,r)=>n+r.bytes,0)} runtime bytes); original SVG fallbacks retained.`);
