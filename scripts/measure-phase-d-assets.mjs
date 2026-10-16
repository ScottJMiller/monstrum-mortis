/** Offline, built-artifact acceptance baseline. Never fetches or deploys. */
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const walk=async dir=>(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(`${dir}/${e.name}`):`${dir}/${e.name}`))).flat();
const sha=b=>createHash('sha256').update(b).digest('hex');
const files=await Promise.all((await walk('dist/client')).sort().map(async path=>{const b=await readFile(path);return {path:path.replace('dist/client',''),bytes:b.length,sha256:sha(b)};}));
const core=await read('src/assets/battle-v2/art.json'),phaseB=await read('src/assets/battle-v2/phase-b-art.json');
const bodies={'family-1':core['family-1'],'iron-widow':core['iron-widow'],...phaseB.bodies};
const size=url=>{const r=files.find(f=>f.path===url);if(!r)throw Error(`Missing shipped asset ${url}`);return r.bytes;};
const sets=Object.entries(bodies).map(([id,poses])=>{const values=Object.values(poses);return {id,poseImages:values.length,bytes:[...new Set(values.map(a=>a.url))].reduce((n,url)=>n+size(url),0),oneCopyRgbaBytes:values.reduce((n,a)=>n+a.width*a.height*4,0)};});
const arenas=Object.entries({laboratory:core.arena,...phaseB.arenas}).map(([id,url])=>({id,url,bytes:size(url)}));
const scripts=await Promise.all(files.filter(f=>/\/index-[^/]+\.js$/.test(f.path)).map(async f=>({...f,illustrativeGzipBytes:gzipSync(await readFile('dist/client'+f.path)).length})));
const fonts=files.filter(f=>/\.(woff2|ttf)$/.test(f.path)),audio=files.filter(f=>/\.(m4a|wav|ogg|mp3)$/.test(f.path));
const report={recordedAt:new Date().toISOString(),scope:'Offline current production build. Byte inventory and theoretical one-copy RGBA arithmetic; NOT network transfer, decoded browser/GPU retention or Cloudflare usage.',buildFingerprint:sha(Buffer.from(files.map(f=>`${f.path}\t${f.sha256}`).join('\n'))),production:{files:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0),mainScripts:scripts,cssBytes:files.filter(f=>f.path.endsWith('.css')).reduce((n,f)=>n+f.bytes,0),fontBytes:fonts.reduce((n,f)=>n+f.bytes,0),audioFiles:audio.length,audioBytes:audio.reduce((n,f)=>n+f.bytes,0)},bodySets:sets,arenas,reviewBudgets:{bodySetTargetBytes:600000,overTargetBodySets:sets.filter(s=>s.bytes>600000).map(s=>s.id),arenaTargetBytes:400000,overTargetArenas:arenas.filter(a=>a.bytes>400000).map(a=>a.id)},limitations:['Whole shipped library is not the initial downloaded/decoded asset set. Measure actual cold/warm selected-media requests on devices.','Gzip figures are illustrative gzipSync output, not observed CDN content encoding.','One-copy RGBA arithmetic omits GPU duplication, render targets and browser overhead; does not measure retention.','Asset fingerprint identifies the exact output tree even while the repository contains uncommitted changes.'],files};
await mkdir('docs/battle-v2-phase-d-review',{recursive:true});await writeFile('docs/battle-v2-phase-d-review/assets.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({buildFingerprint:report.buildFingerprint,production:report.production,reviewBudgets:report.reviewBudgets},null,2));
