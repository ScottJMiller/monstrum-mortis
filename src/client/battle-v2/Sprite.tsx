import { useId } from 'react';
import type { IntegratedModifiers } from '../../shared/integrated-form.ts';
import { TINT_PALETTES } from '../../shared/integrated-form.ts';
import artwork from '../../assets/battle-v2/art.json';
import type { Pose } from './animation.ts';
export interface PoseArt {url:string;width:number;height:number;pivot:number[];torso:number[][];shoulder:number[];eye:number[];eyeRadius:number;facing:string}
export const POSES:Pose[]=['idle','attack','recoil','defense','defeat'];
const neutral:IntegratedModifiers={scale:1,tint:'none',overlay:'none',growth:false,tremor:false};
export function poseArt(body:'family-1'|'iron-widow',pose:Pose,attackStyle:'generic'|'bite'='generic'):PoseArt{return body==='family-1'&&pose==='attack'&&attackStyle==='bite'?artwork['family-1'].bite:artwork[body][pose];}
/** Pose-local art and overlays share the same pivot, facing and uniform transform. */
export function Sprite({body,pose,attackStyle='generic',modifiers=neutral,mirrored=false,time=0,motion=false,onError=()=>{}}:{body:'family-1'|'iron-widow';pose:Pose;attackStyle?:'generic'|'bite';modifiers?:IntegratedModifiers;mirrored?:boolean;time?:number;motion?:boolean;onError?:()=>void}){
 const art=poseArt(body,pose,attackStyle),id=useId().replaceAll(':',''),points=art.torso.map(p=>p.join(',')).join(' ');
 const xs=art.torso.map(p=>p[0]!),ys=art.torso.map(p=>p[1]!);const cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
 const width=Math.max(...xs)-Math.min(...xs),height=Math.max(...ys)-Math.min(...ys);
 const tint=modifiers.tint==='none'?null:TINT_PALETTES[modifiers.tint];
 const matrix=tint?`.5 0 0 0 ${tint[0]/510} 0 .5 0 0 ${tint[1]/510} 0 0 .5 0 ${tint[2]/510} 0 0 0 1 0`:undefined;
 const tremor=motion&&modifiers.tremor&&time%6000<380?Math.sin(time*.08)*2:0;
 const breath=motion&&pose==='idle'?Math.sin(time*.002)*.007:0;
 const [sx,sy]=art.shoulder; const [ex,ey]=art.eye;
 return <g className="v2-sprite" data-body={body} data-pose={pose} data-attack-style={attackStyle} data-overlay={modifiers.overlay} data-tint={modifiers.tint} data-scale={modifiers.scale} transform={`scale(${mirrored?-1:1} 1) scale(${modifiers.scale}) rotate(${tremor}) scale(${1+breath} ${1-breath})`}>
  <defs><clipPath id={`${id}-torso`}><polygon points={points}/></clipPath><filter id={`${id}-tint`} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values={matrix}/></filter>
   <mask id={`${id}-eyes`}><rect width={art.width} height={art.height} fill="white"/><ellipse cx={ex} cy={ey} rx={art.eyeRadius} ry={art.eyeRadius*.7} fill="black"/></mask>
   <radialGradient id={`${id}-flesh`}><stop stopColor="#c2bc86"/><stop offset=".48" stopColor="#77774c"/><stop offset="1" stopColor="#302e22"/></radialGradient>
  </defs>
  <g transform={`translate(${-art.pivot[0]!} ${-art.pivot[1]!})`}>
   <image className="v2-pose-image" href={art.url} width={art.width} height={art.height} onError={onError}/>
   {tint&&<image href={art.url} width={art.width} height={art.height} filter={`url(#${id}-tint)`} mask={`url(#${id}-eyes)`} onError={onError}/>}
   <g clipPath={`url(#${id}-torso)`} data-registration={pose}>
    {modifiers.overlay==='veins'&&<g fill="none" stroke="#27212b" strokeWidth={3.5}>{[0,1,2,3,4,5].map(i=><path key={i} d={`M${cx-width*.48+i*width*.2} ${cy-height*.6} q${-width*.2} ${height*.35} ${width*.2} ${height*.56} t${-width*.23} ${height*.6} m${width*.04} ${-height*.35} l${width*.2} ${-height*.17}`}/>)}</g>}
    {modifiers.overlay==='barbs'&&<g fill="#d2c8a0" stroke="#4d3b28" strokeWidth="2">{[[-.36,-.32],[.1,-.38],[.36,-.1],[-.22,.1],[.12,.34],[-.4,.3]].map(([x,y],i)=><path key={i} d={`M${cx+x!*width} ${cy+y!*height} l-7 10 l18 8 l-5 -35 Z`}/>)}</g>}
    {modifiers.overlay==='mouths'&&<g>{[[-.15,-.23],[.23,-.02],[-.12,.24]].map(([x,y],i)=><g key={i} transform={`translate(${cx+x!*width} ${cy+y!*height}) rotate(${i*17-12})`}><ellipse rx={width*.26} ry={height*.105} fill="#573527" stroke="#c7ac7b" strokeWidth="3"/><path d={`M${-width*.22} 0 Q0 ${height*.07} ${width*.22} 0`} stroke="#1b1010" strokeWidth={height*.09}/>{[-.15,-.05,.05,.15].map((v,j)=><path key={j} d={`M${v*width-3} -6 l4 12 l4 -12 Z`} fill="#dbd0a6"/>)}</g>)}</g>}
   </g>
   {modifiers.growth&&<g transform={`translate(${sx} ${sy})`} data-growth-registration={pose}>
    <image href={artwork.shoulderEye} x="-40" y="-42" width="84" height="85" onError={onError}/>
    <circle cx="1" cy="-23" r="9" fill="#795b81"/><circle cx={1+(motion?Math.sin(time*.0015)*4:0)} cy="-24" r="5" fill="#201d22"/><circle cx="4" cy="-27" r="1.7" fill="#ede3c5"/>
   </g>}
  </g>
 </g>;
}
