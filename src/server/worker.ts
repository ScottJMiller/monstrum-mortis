import type { WorkerEnv } from './env.ts';
import { createHealth } from './health.ts';
import { alias, body, exact, failure, operationId, ServiceError } from './validation.ts';
import { hash } from './security.ts';
export { LaboratoryRoom, MatchmakingPool, GuestLease } from './objects.ts';
function checkOrigin(request:Request){const origin=request.headers.get('Origin'),url=new URL(request.url);if(!origin||origin===url.origin)return;if(['localhost','127.0.0.1'].includes(url.hostname)&&['http://localhost:5173','http://127.0.0.1:5173'].includes(origin))return;throw new ServiceError('unauthorized','Use the game from its own origin.',403);}
export default {
 async fetch(request:Request,env:WorkerEnv):Promise<Response>{
  const url=new URL(request.url);
  if(url.pathname==='/api/health'){if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405});const headers={'Cache-Control':'no-store','Content-Type':'application/json'};return request.method==='HEAD'?new Response(null,{headers}):Response.json(createHealth(env),{headers});}
  if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
  try{
   checkOrigin(request);
   const pool=()=>env.MATCHMAKING.get(env.MATCHMAKING.idFromName('pool:americas'));
   const limit=async(create=false)=>{const ip=await hash(request.headers.get('CF-Connecting-IP')??'local-development');if(!await env.ROOMS.get(env.ROOMS.idFromName('control:private-entry')).checkEntryRate(ip,create))throw new ServiceError('rate-limited','Too many attempts. Retry shortly.',429);};
   const authenticate=async()=>{const id=operationId(request.headers.get('X-Guest-Id'));const authority=env.GUEST_LEASES.get(env.GUEST_LEASES.idFromName(`guest:${id}`));const token=(request.headers.get('Authorization')??'').replace(/^Bearer /,'');if(!await authority.authenticate(token))throw new ServiceError('unauthorized','Your old session has expired. Return to the laboratory browser.',401);return {id,authority};};
   const unwrap=<T,>(r:{ok:true;value:T}|{ok:false;code:string;message:string;status:number})=>{if(!r.ok)throw new ServiceError(r.code,r.message,r.status);return Response.json(r.value,{headers:{'Cache-Control':'no-store'}});};
   if(url.pathname==='/api/guests'&&request.method==='POST'){
    await limit();const v=await body(request);exact(v,['operationId']);return Response.json(await env.GUEST_LEASES.get(env.GUEST_LEASES.idFromName('control:guest-identities')).issue(operationId(v.operationId)),{headers:{'Cache-Control':'no-store'}});
   }
   if(url.pathname==='/api/labs/socket'&&request.method==='GET')return pool().fetch(new Request('https://pool.internal/internal/directory',request));
   if(url.pathname==='/api/labs'&&request.method==='GET')return Response.json({labs:await pool().formingLabs(),serverTimeMs:Date.now()},{headers:{'Cache-Control':'no-store'}});
   if(url.pathname==='/api/labs'&&request.method==='POST'){
    await limit(true);const {id}=await authenticate();const v=await body(request);exact(v,['operationId','alias']);return unwrap(await pool().createForming(id,operationId(v.operationId),alias(v.alias)));
   }
   if(url.pathname==='/api/guests/session'&&request.method==='GET'){
    const {id,authority}=await authenticate();const h=await authority.currentHolder();if(!h)return Response.json({entry:null},{headers:{'Cache-Control':'no-store'}});
    if(h.kind!=='room'||!h.id.startsWith('l-')){await authority.release(h.kind,h.id,h.nonce);return Response.json({entry:null});}
    const result=await env.ROOMS.get(env.ROOMS.idFromName(`room:${h.id}`)).recoverForming(id,h.nonce);
    if(!result.ok){if([401,404,409,410].includes(result.status)){await authority.release('room',h.id,h.nonce);return Response.json({entry:null});}return unwrap(result);}
    return Response.json({entry:result.value},{headers:{'Cache-Control':'no-store'}});
   }
   const match=/^\/api\/rooms\/(l-[0-9a-f-]{36})\/(join|snapshot|socket|leave)$/.exec(url.pathname);
   if(match){
    const id=match[1]!,op=match[2]!,room=env.ROOMS.get(env.ROOMS.idFromName(`room:${id}`));
    if(op==='join'&&request.method==='POST'){await limit();const guest=await authenticate();const v=await body(request);exact(v,['operationId','alias']);return unwrap(await room.enterForming(id,guest.id,operationId(v.operationId),alias(v.alias),null));}
    if(op==='leave'&&request.method==='POST'){
      const guest=await authenticate(),h=await guest.authority.currentHolder();if(h?.kind==='room'&&h.id===id){const response=await room.fetch(new Request('https://room.internal/internal/leave-guest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({guestId:guest.id,nonce:h.nonce})}));if(!response.ok&&![404,410].includes(response.status))return response;await guest.authority.release('room',id,h.nonce);}return Response.json({left:true});
    }
    if(['snapshot','socket'].includes(op)&&request.method==='GET'){const internal=new URL(`https://room.internal/internal/${op}`);internal.search=url.search;return room.fetch(new Request(internal,request));}
    return new Response(null,{status:405});
   }
   if(/^\/api\/(rooms|queue|pools|guests\/leave-session)/.test(url.pathname))throw new ServiceError('stale-session','This previous laboratory session has expired. Reload to find a laboratory.',410);
   throw new ServiceError('not-found','Unknown API route.',404);
  }catch(error){return failure(error);}
 }
} satisfies ExportedHandler<WorkerEnv>;
