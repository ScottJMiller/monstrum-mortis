import {useId, useState} from 'react';
const URL='/assets/interface/chamber-reservoir.webp';

/** Decorative accepted-injection pulse; no counters, intentions, timers or transport ownership. */
export function InjectionReservoirs(){
 const prefix=useId().replaceAll(':','');
 const [failed,setFailed]=useState(false);
 const image=(y=0)=>(!failed&&<image href={URL} x="0" y={y} width="120" height="510" onError={()=>setFailed(true)}/>);
 return <div className="injection-tubes" aria-hidden="true" data-art={failed?'fallback':'illustrated'}>
  {['left','right'].map(side=>{
   const id=`${prefix}-${side}`;
   return <div className="injection-reservoir" key={side}>
    <svg className="reservoir-cap" viewBox="0 0 120 101" focusable="false">
     <defs><linearGradient id={`${id}-metal`}><stop stopColor="#504b2f"/><stop offset=".25" stopColor="#c1a259"/><stop offset=".55" stopColor="#393a28"/><stop offset="1" stopColor="#786c3e"/></linearGradient></defs>
     {failed&&<path d="M8 101V47Q8 35 30 35V20Q60 0 90 20V35Q112 35 112 47V101Z" fill={`url(#${id}-metal)`}/>}{image()}
    </svg>
    <svg className="reservoir-shaft" viewBox="0 0 120 329" preserveAspectRatio="none" focusable="false">
     <defs><clipPath id={`${id}-channel`}><rect x="20" width="80" height="329" rx="5"/></clipPath><linearGradient id={`${id}-fluid`} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#c3cf72" stopOpacity=".9"/><stop offset=".16" stopColor="#9fb852" stopOpacity=".7"/><stop offset="1" stopColor="#617f37" stopOpacity=".18"/></linearGradient></defs>
     <rect x="17" width="86" height="329" rx="6" fill="#10291b" stroke="#7c8a57" strokeWidth="3"/>{image(-101)}
     <g clipPath={`url(#${id}-channel)`}><g className="reservoir-bolus"><rect x="20" width="80" height="100" fill={`url(#${id}-fluid)`}/><path d="M21 2Q60 9 99 2" fill="none" stroke="#d7dea1" strokeOpacity=".8" strokeWidth="3"/><circle cx="43" cy="27" r="3" fill="#d0da8d"/><circle cx="78" cy="69" r="2" fill="#c2d17b"/></g></g>
    </svg>
    <svg className="reservoir-base" viewBox="0 0 120 80" focusable="false">{failed&&<path d="M8 0H112V67Q60 84 8 67Z" fill={`url(#${id}-metal)`}/>}{image(-430)}</svg>
   </div>;
  })}
 </div>;
}
