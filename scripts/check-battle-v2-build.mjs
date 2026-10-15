import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
async function all(dir){return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?all(join(dir,e.name)):[join(dir,e.name)]))).flat();}
const files=await all('dist/client');
assert.equal(files.some(p=>p.includes('battle-v2')||p.includes('Preview')),false,'Development media must not ship');
for(const file of files.filter(p=>/\.(js|css|html)$/.test(p))){const text=await readFile(file,'utf8');for(const marker of ['integration theatre','battle-v2-a1','battle-v2-b2','__battleV2Audio','CORROSION!','/assets/battle-v2/','Accepted injection feedback'])assert.equal(text.includes(marker),false,`Development marker shipped: ${marker} in ${file}`);}
console.log(`PASS: inspected ${files.length} production files; Battle v2 modules, media and fixture markers excluded. No new production route/endpoint.`);
