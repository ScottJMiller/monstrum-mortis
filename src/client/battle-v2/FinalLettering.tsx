import { useLayoutEffect, useRef } from 'react';

/** Fit the real loaded lettering into its arena, including short result panes.
 * This is purely typographic; resizing never changes the timeline or wording. */
export function FinalLettering({title,winner}:{title:string;winner:string|null}){
 const ref=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{
  const node=ref.current,arena=node?.parentElement;
  if(!node||!arena)return;
  let active=true;
  const fit=()=>{
   if(!active)return;
   const width=arena.clientWidth,height=arena.clientHeight;
   if(!width||!height)return;
   let size=Math.min(144,width*.115,height*.28);
   // Measure actual glyphs, rather than estimating from character count. The
   // winner uses a smaller em size and participates in the same height budget.
   for(let i=0;i<3;i++){
    node.style.fontSize=`${size}px`;
    const widest=Math.max(...Array.from(node.children,e=>e.scrollWidth));
    const ratio=Math.min(1,node.clientWidth/Math.max(1,widest),height*.65/Math.max(1,node.scrollHeight));
    if(ratio>=.999)break;
    size*=ratio;
   }
  };
  fit();
  const observer=new ResizeObserver(fit);observer.observe(arena);
  void document.fonts.ready.then(fit);
  document.fonts.addEventListener('loadingdone',fit);
  return()=>{active=false;observer.disconnect();document.fonts.removeEventListener('loadingdone',fit);};
 },[title,winner]);
 return <div ref={ref} className="v2-word v2-final-word" data-word="final" role="status"><span className="v2-final-title">{title}</span>{winner&&<span className="v2-timeout-winner">{winner}</span>}</div>;
}
