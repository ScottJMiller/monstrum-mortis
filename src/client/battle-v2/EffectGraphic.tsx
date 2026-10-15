import { EFFECTS } from './effects.ts';
import type { EffectId } from './effects.ts';
import { biteJawOffset } from './animation.ts';
/** Graphics are opt-in supplied art; status feedback stays in readable captions. */
export function EffectGraphic({id,age,motion,onError}:{id:EffectId;age:number;motion:boolean;onError:()=>void}){
 const art=EFFECTS[id].art;if(!art)return null;
 const attributes={x:-art.width/2,y:-art.height/2,width:art.width,height:art.height,preserveAspectRatio:'xMidYMid meet',onError};
 if(id==='bite'&&art.upper&&art.lower){const offset=biteJawOffset(age,motion);return <g data-supplied-effect="bite" data-jaw-offset={offset}><g transform={`translate(0 ${-offset})`} data-jaw="upper"><image {...attributes} href={art.upper}/></g><g transform={`translate(0 ${offset})`} data-jaw="lower"><image {...attributes} href={art.lower}/></g></g>;}
 return <image {...attributes} href={art.url} data-supplied-effect={id}/>;
}
