import original from '../../assets/battle-v2/art.json';
import produced from '../../assets/battle-v2/phase-b-art.json';
import type { Pose } from './animation.ts';
export type PlayerBody='family-1'|'family-2'|'family-3'|'family-4'|'family-5'|'blob';
export type RivalBody='iron-widow'|'gutter-seraph'|'carrion-duke'|'coil-saint'|'maw-engine'|'the-unfinished';
export type BodyId=PlayerBody|RivalBody;
export interface PoseArt {url:string;width:number;height:number;pivot:number[];torso:number[][];shoulder:number[];eye:number[];eyes?:number[][];eyeRadius:number;facing:string;limb?:number[][];jaw?:number[][];bodyGuard?:number[][]}
export const PLAYER_BODIES:PlayerBody[]=['family-1','family-2','family-3','family-4','family-5','blob'];
export const RIVAL_BODIES:RivalBody[]=['iron-widow','gutter-seraph','carrion-duke','coil-saint','maw-engine','the-unfinished'];
export const BODY_ART:Record<BodyId,Record<Pose,PoseArt>&{bite?:PoseArt}>={
 'family-1':original['family-1'],'iron-widow':original['iron-widow'],...produced.bodies,
} as Record<BodyId,Record<Pose,PoseArt>&{bite?:PoseArt}>;
for(const [body,poses] of Object.entries(produced.originalDamage))for(const [pose,regions] of Object.entries(poses))Object.assign(BODY_ART[body as BodyId][pose as Pose],regions);
export const ARENAS:Record<string,string>={laboratory:original.arena,...produced.arenas};
export const GRAFTS=produced.grafts;
export function familyBody(family:1|2|3|4|5|'blob'):PlayerBody{return family==='blob'?'blob':`family-${family}`;}
