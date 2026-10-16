import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
async function all(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?all(join(dir,e.name)):[join(dir,e.name)]))).flat();}
const files=await all('dist/client'),records=JSON.parse(await readFile('dist/battle-v2-shipping.json','utf8'));
for(const r of records){const bytes=await readFile('dist/client'+r.url);assert.equal(createHash('sha256').update(bytes).digest('hex'),r.sha256);}
for(const file of files){assert.equal(/\/source\/|fixtures|provenance|generation\.json|Preview/.test(file),false,`Development file shipped: ${file}`);}
for(const file of files.filter(p=>/\.(js|css|html)$/.test(p))){const source=await readFile(file,'utf8');for(const marker of ['integration theatre','__battleV2Audio','Timeline fixture','Modifier fixture','Accepted injection feedback','preview-starter','Support without lunge'])assert.equal(source.includes(marker),false,`Development marker shipped: ${marker} in ${file}`);}
assert.ok(files.some(p=>p.includes('/battle-v2/runtime/phase-b/audio/crawling.m4a')));
assert.ok(files.some(p=>p.includes('/battle-v2/runtime/font/NewRocker-Regular.ttf')));
console.log(`PASS: ${records.length} required runtime files match source hashes; ${files.length} production files contain no gallery fixtures, sources or debug controls.`);
const specimens=JSON.parse(await readFile('assets/specimens/provenance.json','utf8')).records;
const fonts=JSON.parse(await readFile('assets/interface-fonts/provenance.json','utf8')).records;
for(const r of [...specimens,...fonts]){const dest='dist/client/'+r.runtime.replace('public/','');assert.equal(createHash('sha256').update(await readFile(dest)).digest('hex'),r.sha256,`New presentation asset mismatch: ${dest}`);}
for(const file of files.filter(p=>p.endsWith('.js'))){const source=await readFile(file,'utf8');for(const marker of ['Specimen illustration study','Rehearse injection','Skip rehearsal'])assert.equal(source.includes(marker),false,`Development/removed UI shipped: ${marker}`);}
console.log(`PASS: ${specimens.length} specimen illustrations and ${fonts.length} interface fonts match source hashes; specimen gallery and rehearsal excluded.`);

const frames=JSON.parse(await readFile('assets/interface-frames/provenance.json','utf8')).records;for(const r of frames)assert.equal(createHash('sha256').update(await readFile('dist/client/'+r.path.replace('public/',''))).digest('hex'),r.sha256);console.log(`PASS: ${frames.length} original Victorian frame SVGs match provenance.`);

const reservoirs=JSON.parse(await readFile('assets/chamber-reservoir/provenance.json','utf8')).records;for(const r of reservoirs)assert.equal(createHash('sha256').update(await readFile('dist/client/'+r.runtime.replace('public/',''))).digest('hex'),r.sha256);console.log('PASS: registered chamber reservoir image matches provenance.');
