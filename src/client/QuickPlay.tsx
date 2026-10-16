import { useEffect, useRef, useState } from 'react';
import { LABS_SOCKET_PROTOCOL } from '../shared/protocol.ts';
import { clientId } from './random-id.ts';
import type { GuestCredentials } from '../shared/matchmaking.ts';
import type { FormingLab, RoomEntryResponse } from '../shared/room-service.ts';
const KEY='mm.guest.v6',NAME_KEY='mm.player-name.v1';
function savedName():string|null{try{const value=localStorage.getItem(NAME_KEY);return value?.trim()&&value.length<=24?value:null;}catch{return null;}}
export function guestHeaders():Record<string,string>{try{const g=JSON.parse(localStorage.getItem(KEY)??'null');return g?{'X-Guest-Id':g.guestId,Authorization:`Bearer ${g.accessToken}`} : {};}catch{return {};}}
/** Explicit public discovery; polling is bounded and stops while hidden/unmounted. */
export function QuickPlay({onEntry}:{onEntry:(entry:RoomEntryResponse)=>void}){
 const [guest,setGuest]=useState<GuestCredentials|null>(null),[name,setName]=useState(()=>savedName()??''),[labs,setLabs]=useState<FormingLab[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[now,setNow]=useState(Date.now());
 const op=useRef<{fingerprint:string;id:string}|null>((()=>{try{return JSON.parse(sessionStorage.getItem('mm.entry-intent.v6')??'null');}catch{return null;}})()),offset=useRef(0),live=useRef(true),nameEdited=useRef(false);
 useEffect(()=>{live.current=true;let controller=new AbortController();
  async function start(){try{
   let g:GuestCredentials|null=null;try{g=JSON.parse(localStorage.getItem(KEY)??'null');}catch{}
   if(!g){let key=sessionStorage.getItem('mm.guest-issue.v6');if(!key){key=clientId();sessionStorage.setItem('mm.guest-issue.v6',key);}const r=await fetch('/api/guests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operationId:key}),signal:controller.signal});g=await r.json();if(!r.ok)throw new Error('Could not prepare your scientist. Retry.');localStorage.setItem(KEY,JSON.stringify(g));}
   if(!live.current||!g)return;if(!nameEdited.current)setName(savedName()??g.alias);
   const recovery=await fetch('/api/guests/session',{headers:guestHeaders(),signal:controller.signal});
   if(recovery.status===401){localStorage.removeItem(KEY);sessionStorage.removeItem('mm.guest-issue.v6');setError('Your previous session expired. Reload to begin again.');return;}
   if(recovery.ok){const result=await recovery.json();if(live.current&&result.entry){onEntry(result.entry);return;}}
   if(live.current)setGuest(g);
  }catch(e){if(live.current&&!(e instanceof DOMException&&e.name==='AbortError'))setError(e instanceof Error?e.message:'Entry unavailable. Reload to retry.');}}
  void start();return()=>{live.current=false;controller.abort();};
 },[]);
 useEffect(()=>{
  let disposed=false,inflight=false,ws:WebSocket|null=null,retry:ReturnType<typeof setTimeout>|undefined;
  const controller=new AbortController();
  function receive(data:{labs:FormingLab[];serverTimeMs:number}){if(!disposed){setLabs(data.labs);offset.current=data.serverTimeMs-Date.now();}}
  async function refresh(){if(document.hidden||inflight||ws?.readyState===WebSocket.OPEN)return;inflight=true;try{const r=await fetch('/api/labs',{signal:controller.signal});if(r.ok)receive(await r.json());}catch{if(!disposed)setError('Laboratories unavailable. Retrying…');}finally{inflight=false;}}
  function connect(){if(disposed||document.hidden||ws?.readyState===WebSocket.OPEN||ws?.readyState===WebSocket.CONNECTING)return;const url=new URL('/api/labs/socket',location.href);url.protocol=location.protocol==='https:'?'wss:':'ws:';const socket=new WebSocket(url,[LABS_SOCKET_PROTOCOL]);ws=socket;socket.onmessage=e=>{if(e.data==='pong')return;try{receive(JSON.parse(e.data));}catch{}};socket.onclose=()=>{if(ws===socket)ws=null;if(!disposed&&!document.hidden)retry=setTimeout(connect,5000);};socket.onerror=()=>socket.close();}
  void refresh();connect();
  const heartbeat=setInterval(()=>{if(ws?.readyState===WebSocket.OPEN)ws.send('ping');},20000),fallback=setInterval(refresh,30000),tick=setInterval(()=>setNow(Date.now()),250);
  const visible=()=>{if(document.hidden){ws?.close();ws=null;if(retry)clearTimeout(retry);}else{connect();void refresh();}};
  document.addEventListener('visibilitychange',visible);return()=>{disposed=true;ws?.close();controller.abort();if(retry)clearTimeout(retry);clearInterval(heartbeat);clearInterval(fallback);clearInterval(tick);document.removeEventListener('visibilitychange',visible);};
 },[]);
 function changeName(value:string){
  nameEdited.current=true;setName(value);
  // A preference, separate from credentials: Leave and session expiry keep it.
  try{if(value.trim())localStorage.setItem(NAME_KEY,value);else localStorage.removeItem(NAME_KEY);}catch{/* storage failure must not block entry or editing */}
 }
 async function enter(id:string|null){if(busy||!guest)return;setBusy(true);setError('');const path=id?`/api/rooms/${id}/join`:'/api/labs',fingerprint=JSON.stringify([path,name]);if(op.current?.fingerprint!==fingerprint)op.current={fingerprint,id:clientId()};try{sessionStorage.setItem('mm.entry-intent.v6',JSON.stringify(op.current));const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json',...guestHeaders()},body:JSON.stringify({operationId:op.current.id,alias:name})});const data=await r.json();if(!r.ok)throw new Error(data.message??'Unable to join. Retry.');op.current=null;sessionStorage.removeItem('mm.entry-intent.v6');onEntry(data);}catch(e){setError(e instanceof Error?e.message:'Unable to join. Retry.');}finally{setBusy(false);}}
 return <section className="entry-panel lab-browser" aria-busy={busy}><p className="eyebrow">Remote cooperative play</p><h2>Find a laboratory</h2><label>Player Name<span className="alias-entry"><span aria-hidden="true">{guest?.symbol??'⚗'}</span><input aria-label="Player Name" autoComplete="nickname" maxLength={24} value={name} onChange={e=>changeName(e.target.value)}/></span></label><h3>Join lab</h3><div className="forming-labs">{labs.filter(l=>l.deadlineMs===null||l.deadlineMs-now-offset.current>3000).map(l=><div className="lab-choice" key={l.roomId}><button className="lab-join" disabled={busy||!guest||!name.trim()} onClick={()=>enter(l.roomId)}><span>{l.name}</span><span aria-label={`${l.players.length} of 8 players`}>{['⓪','①','②','③','④','⑤','⑥','⑦','⑧'][l.players.length]}</span><span>{l.deadlineMs===null?'Waiting':`${Math.max(0,Math.ceil((l.deadlineMs-now-offset.current)/1000))}s`}</span></button><details><summary aria-label={`Scientists in ${l.name}`}><span aria-hidden="true">▸</span></summary><ul>{l.players.map((p,i)=><li key={i}>{p.symbol} {p.alias}</li>)}</ul></details></div>)}{!labs.length&&<p className="note">No laboratories forming. Start one below.</p>}</div><button className="create-lab" disabled={busy||!guest||!name.trim()} onClick={()=>enter(null)}>Create new</button>{error&&<p role="alert">{error}</p>}</section>;
}
