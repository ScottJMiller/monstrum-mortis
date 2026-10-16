import { useState } from 'react';
import clues from '../assets/specimen-clues.json' with { type: 'json' };

/** Public opaque clue assets only. Never imports the hidden DNA mapping. */
export function SpecimenImage({id}:{id:string}) {
 const clue=clues.find(c=>c.id===id),[failed,setFailed]=useState<string|null>(null);
 const fallback='/assets/specimens/'+id.replace('clue.','')+'.svg';
 return <span className="specimen-art"><img src={failed===id?fallback:clue?.url} alt="" loading="lazy" decoding="async" width="160" height="160" onError={()=>{if(failed!==id)setFailed(id);}}/></span>;
}
