import { useId } from 'react';
import type { IntegratedModifiers } from '../../shared/integrated-form.ts';
import { TINT_PALETTES } from '../../shared/integrated-form.ts';
import { BODY_ART, GRAFTS } from './art.ts';
import type { BodyId,PoseArt } from './art.ts';
export type {PoseArt} from './art.ts';
import type { Pose } from './animation.ts';
export const POSES:Pose[]=['idle','attack','recoil','defense','defeat'];
const neutral:IntegratedModifiers={scale:1,tint:'none',overlay:'none',growth:false,tremor:false};
export function poseArt(body:BodyId,pose:Pose,attackStyle:'generic'|'bite'='generic'):PoseArt{return body==='family-1'&&pose==='attack'&&attackStyle==='bite'?BODY_ART['family-1'].bite!:BODY_ART[body][pose];}
/** Pose-local art and overlays share the same pivot, facing and uniform transform. */
export function Sprite({body,pose,attackStyle='generic',modifiers=neutral,mirrored=false,time=0,motion=false,onError=()=>{}}:{body:BodyId;pose:Pose;attackStyle?:'generic'|'bite';modifiers?:IntegratedModifiers;mirrored?:boolean;time?:number;motion?:boolean;onError?:()=>void}){
 const art=poseArt(body,pose,attackStyle),id=useId().replaceAll(':',''),points=art.torso.map(p=>p.join(',')).join(' ');
 const xs=art.torso.map(p=>p[0]!),ys=art.torso.map(p=>p[1]!);const cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
 const width=Math.max(...xs)-Math.min(...xs),height=Math.max(...ys)-Math.min(...ys);
 const tint=modifiers.tint==='none'?null:TINT_PALETTES[modifiers.tint];
 const matrix=tint?`.5 0 0 0 ${tint[0]/510} 0 .5 0 0 ${tint[1]/510} 0 0 .5 0 ${tint[2]/510} 0 0 0 1 0`:undefined;
 const tremor=motion&&modifiers.tremor&&time%6000<380?Math.sin(time*.08)*2:0;
 const breath=motion&&pose==='idle'?Math.sin(time*.002)*.007:0;
 const [sx,sy]=art.shoulder;
 const polygonArea=Math.abs(art.torso.reduce((n,p,i)=>{const q=art.torso[(i+1)%art.torso.length]!;return n+p[0]!*q[1]!-q[0]!*p[1]!;},0))/2;
 return <g className="v2-sprite" data-body={body} data-pose={pose} data-attack-style={attackStyle} data-overlay={modifiers.overlay} data-tint={modifiers.tint} data-scale={modifiers.scale} transform={`scale(${mirrored?-1:1} 1) scale(${modifiers.scale}) rotate(${tremor}) scale(${1+breath} ${1-breath})`}>
  <defs><clipPath id={`${id}-torso`}><polygon points={points}/></clipPath><filter id={`${id}-tint`} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values={matrix}/></filter>
   <mask id={`${id}-eyes`}><rect width={art.width} height={art.height} fill="white"/>{(art.eyes??[art.eye]).map(([x,y],i)=><ellipse key={i} cx={x} cy={y} rx={art.eyeRadius} ry={art.eyeRadius*.7} fill="black"/>)}</mask>
   <mask id={`${id}-surface`} style={{maskType:"alpha"}}><image href={art.url} width={art.width} height={art.height}/></mask>
  </defs>
  <g transform={`translate(${-art.pivot[0]!} ${-art.pivot[1]!})`}>
   <g><image className="v2-pose-image" href={art.url} width={art.width} height={art.height} onError={onError}/>
   {tint&&<image href={art.url} width={art.width} height={art.height} filter={`url(#${id}-tint)`} mask={`url(#${id}-eyes)`} onError={onError}/>}</g>
   <g clipPath={`url(#${id}-torso)`} mask={`url(#${id}-surface)`} data-registration={pose}>
    {modifiers.overlay==='veins'&&[[-.15,-.2,18],[.15,.18,-15]].map(([x,y,angle],i)=><image key={i} href={GRAFTS.veins!.url} width={Math.min(width*.95,height*.75)} height={Math.min(width*.95,height*.75)*GRAFTS.veins!.height/GRAFTS.veins!.width} x={cx+x!*width-width*.45} y={cy+y!*height-height*.3} transform={`rotate(${angle} ${cx} ${cy})`} onError={onError}/>)}
    {modifiers.overlay==='barbs'&&[[-.30,-.30],[.18,-.30],[.32,.0],[-.18,.1],[.10,.30],[-.32,.30]].map(([x,y],i)=>{const h=Math.min(42,height*.24),w=h*GRAFTS.barb!.width/GRAFTS.barb!.height;return <image key={i} href={GRAFTS.barb!.url} x={cx+x!*width-w*.45} y={cy+y!*height-h*.83} width={w} height={h} transform={`rotate(${i%2?18:-12} ${cx+x!*width} ${cy+y!*height})`} onError={onError}/>;})}
    {modifiers.overlay==='mouths'&&[[-.20,-.22],[.20,-.08],[-.02,.25]].map(([x,y],i)=>{const w=Math.min(width*.57,Math.sqrt(polygonArea/9*GRAFTS.mouth!.width**2/GRAFTS.mouth!.alphaArea)),h=w*GRAFTS.mouth!.height/GRAFTS.mouth!.width;return <image key={i} href={GRAFTS.mouth!.url} x={cx+x!*width-w/2} y={cy+y!*height-h/2} width={w} height={h} transform={`rotate(${i*12-10} ${cx+x!*width} ${cy+y!*height})`} onError={onError}/>;})}
   </g>
   {modifiers.growth&&<g transform={`translate(${sx} ${sy})`} data-growth-registration={pose}>
    <g transform={`scale(${72/GRAFTS.growth.width}) translate(${-GRAFTS.growth.pivot[0]!} ${-GRAFTS.growth.pivot[1]!})`}>
     <image href={GRAFTS.growth.url} width={GRAFTS.growth.width} height={GRAFTS.growth.height} onError={onError}/>
     <circle cx={GRAFTS.growth.eye[0]!+(motion?Math.sin(time*.0015)*8:0)} cy={GRAFTS.growth.eye[1]} r="10" fill="#201d22"/><circle cx={GRAFTS.growth.eye[0]!+3} cy={GRAFTS.growth.eye[1]!-3} r="3" fill="#ede3c5"/>
    </g>
   </g>}

  </g>
 </g>;
}
