import { useEffect, useRef, useState } from 'react';

function freshEntry(){
 try { return !sessionStorage.getItem('mm.splash.v6')&&!sessionStorage.getItem('mm.room.v6'); }
 catch { return true; }
}
/** Decorative first-entry introduction; never gates requests, ownership or recovery. */
export function Splash({recovering}:{recovering:boolean}){
 const [remaining,setRemaining]=useState(15);
 const [open,setOpen]=useState(freshEntry),dialog=useRef<HTMLDialogElement>(null);
 function dismiss(){setOpen(false);try{sessionStorage.setItem('mm.splash.v6','seen');}catch{/* optional */}}
 useEffect(()=>{if(recovering){setOpen(false);return;}if(!open)return;const d=dialog.current;d?.showModal();const tick=setInterval(()=>setRemaining(n=>Math.max(0,n-1)),1000);const timer=setTimeout(()=>{setOpen(false);try{sessionStorage.setItem('mm.splash.v6','seen');}catch{/* optional */}},15000);return()=>{clearTimeout(timer);clearInterval(tick);d?.close();};},[open,recovering]);
 if(!open||recovering)return null;
 return <dialog ref={dialog} className="welcome-splash ornate-frame" aria-labelledby="welcome-title" aria-describedby="welcome-description" onCancel={dismiss}><div className="welcome-copy"><p className="eyebrow">Institute of questionable outcomes</p><h1 id="welcome-title">Monstrum Mortis</h1><p id="welcome-description">A creature-building party game for 2–8 accomplices.</p><p className="welcome-instruction">Inject mysterious DNA.</p><p className="welcome-instruction">Unleash your creation.<br/>Watch it fight.</p><button autoFocus onClick={dismiss}>Enter laboratory{remaining<=3&&remaining>0?` · ${remaining}`:''}</button></div></dialog>;
}
