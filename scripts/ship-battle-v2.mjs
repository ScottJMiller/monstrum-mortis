import {readFile,mkdir,copyFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {createHash} from 'node:crypto';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const core=await json('src/assets/battle-v2/art.json'),phase=await json('src/assets/battle-v2/phase-b-art.json'),effects=await json('src/assets/battle-v2/effect-art.json'),audio=await json('src/assets/battle-v2/audio.json');
const urls=new Set([core.panel,core.arena,...Object.values(phase.arenas),...Object.values(audio),'/assets/battle-v2/runtime/font/NewRocker-Regular.ttf','/assets/battle-v2/runtime/font/OFL.txt']);
for(const body of [core['family-1'],core['iron-widow'],...Object.values(phase.bodies)])for(const art of Object.values(body))urls.add(art.url);
for(const graft of Object.values(phase.grafts))urls.add(graft.url);
for(const effect of Object.values(effects))for(const url of effect.upper&&effect.lower?[effect.upper,effect.lower]:[effect.url])urls.add(url);
const records=[];
for(const url of [...urls].sort()){
 if(!url.startsWith('/assets/battle-v2/runtime/')||url.includes('..'))throw Error(`Unsafe runtime URL: ${url}`);
 const source=url.endsWith('/font/OFL.txt')?'assets/battle-v2/source/font/new-rocker/OFL.txt':'.'+url;
 const bytes=await readFile(source),dest=resolve('dist/client'+url);await mkdir(dirname(dest),{recursive:true});await copyFile(source,dest);
 records.push({url,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
await writeFile('dist/battle-v2-shipping.json',JSON.stringify(records,null,2)+'\n');
console.log(`Shipped ${records.length} approved runtime files (${records.reduce((n,r)=>n+r.bytes,0)} bytes); no source masters or gallery fixtures.`);
