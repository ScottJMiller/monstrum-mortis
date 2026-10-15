import type { PoseArt } from './art.ts';
import type { Side } from './animation.ts';
interface Movement { x:number; rotation:number }
/** Shared world placement for a fighter and its defender-relative shield anchor. */
export function fighterPlacement(side:Side,movement:Movement){
 const direction=side==='team'?1:-1;
 return {x:(side==='team'?355:890)+movement.x*direction*3,y:592,rotation:movement.rotation*direction,scale:.8};
}
/** The SVG's nearest edge sits twelve arena units beyond the defender's inward anatomy.
 * Pose landmarks, grounded pivot, Titan size and decorative movement all affect placement. */
export function shieldPosition(art:PoseArt,side:Side,movement:Movement,graphicWidth:number,modifierScale=1){
 const fighter=fighterPlacement(side,movement),direction=side==='team'?1:-1;
 const xs=art.torso.map(p=>p[0]!),ys=art.torso.map(p=>p[1]!);
 const front=side==='team'?Math.max(...xs,art.eye[0]!+art.eyeRadius):Math.min(...xs,art.eye[0]!-art.eyeRadius);
 const mid=(Math.min(...ys)+Math.max(...ys))/2,scale=fighter.scale*modifierScale;
 const x=(front-art.pivot[0]!)*scale,y=(mid-art.pivot[1]!)*scale,radians=fighter.rotation*Math.PI/180;
 const edgeX=fighter.x+x*Math.cos(radians)-y*Math.sin(radians);
 return {x:edgeX+direction*(graphicWidth/2+12),y:fighter.y+x*Math.sin(radians)+y*Math.cos(radians),edgeX};
}
