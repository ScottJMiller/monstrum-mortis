import original from '../../assets/battle-v2/art.json';
import {BODY_ART,ARENAS,GRAFTS} from './art.ts';
import type {BodyId} from './art.ts';
import { EFFECTS } from './effects.ts';
/** Retain only a selected-pair-sized image cache, never a complete animation library. */
const cached=new Map<string,Promise<boolean>>();
const MAX_IMAGES=28;
export function preloadSample(retry=false,player:BodyId|null='family-1',rival:BodyId='iron-widow',arena:string|null='laboratory'):Promise<boolean>{
 const urls=[...Object.values(player?BODY_ART[player]:{}),...Object.values(BODY_ART[rival])].map(a=>a!.url).concat([...(arena?[ARENAS[arena]!]:[]),original.panel],[GRAFTS.barb,GRAFTS.veins,GRAFTS.mouth,GRAFTS.growth].map(g=>g.url),Object.values(EFFECTS).flatMap(e=>e.art?e.art.upper&&e.art.lower?[e.art.upper,e.art.lower]:[e.art.url]:[]));
 return Promise.all([...new Set(urls)].map(url=>{
  if(retry)cached.delete(url);
  const previous=cached.get(url);if(previous){cached.delete(url);cached.set(url,previous);return previous;}
  const load=new Promise<boolean>(resolve=>{const image=new Image(),timeout=setTimeout(()=>resolve(false),12_000);image.onload=()=>{clearTimeout(timeout);resolve(true);};image.onerror=()=>{clearTimeout(timeout);resolve(false);};image.src=url;});
  cached.set(url,load);while(cached.size>MAX_IMAGES)cached.delete(cached.keys().next().value!);return load;
 })).then(results=>results.every(Boolean));
}
export function cachedSampleImages(){return cached.size;}
