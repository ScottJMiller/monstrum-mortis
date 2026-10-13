import art from '../../assets/battle-v2/art.json';
import { EFFECTS } from './effects.ts';
/** Bounded pose/background/effect images, shared across DEV strict-effect remounts. */
let pending:Promise<boolean>|null=null;
export function preloadSample(retry=false):Promise<boolean>{
 if(pending&&!retry)return pending;
 const urls=[...Object.values(art['family-1']),...Object.values(art['iron-widow'])].map(a=>a.url).concat([art.arena,art.panel,art.shoulderEye],Object.values(EFFECTS).flatMap(e=>e.art?e.art.upper&&e.art.lower?[e.art.upper,e.art.lower]:[e.art.url]:[]));
 pending=Promise.allSettled(urls.map(url=>new Promise<void>((resolve,reject)=>{
  const image=new Image(),timeout=setTimeout(()=>reject(new Error('Study artwork timeout')),12_000);
  image.onload=()=>{clearTimeout(timeout);resolve();};image.onerror=()=>{clearTimeout(timeout);reject(new Error('Study artwork unavailable'));};image.src=url;
 }))).then(results=>results.every(r=>r.status==='fulfilled'));
 return pending;
}
