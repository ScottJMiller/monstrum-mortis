// Optional local diagnostic, outside the regression gate. No game code or deployment.
// The inspection mode may emit an RPC disposal warning when workerd collects stubs.
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

const inspect = !process.argv.includes('--http-only');
const mf = new Miniflare(convertV4MiniflareOptions({
 name: 'inspection-probe', modules: true, compatibilityDate: '2026-10-05',
 unsafeInspectDurableObjects: true,
 durableObjects: { PROBE: { className: 'Probe', useSQLite: true } },
 script: `
 import { DurableObject } from 'cloudflare:workers';
 export class Probe extends DurableObject {
  fetch(request) {
   this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS probe (value INTEGER)');
   if (request.headers.get('Upgrade') === 'websocket') {
    const pair = new WebSocketPair(); this.ctx.acceptWebSocket(pair[1]);
    return new Response(null, { status: 101, webSocket: pair[0] });
   }
   return new Response('x'.repeat(100000));
  }
  webSocketMessage(ws, message) { ws.send(message); }
 }
 export default { fetch(request, env) {
  return env.PROBE.get(env.PROBE.idFromName('probe')).fetch(request);
 } };`,
}));
let socket;
try {
 await (await mf.dispatchFetch('http://localhost/')).text();
 const url = new URL('/socket', await mf.ready); url.protocol = 'ws:';
 socket = new WebSocket(url);
 await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
 });
 if (inspect) {
  const sql = await mf.unsafeGetDurableObjectStorage('inspection-probe', 'Probe', { name: 'probe' });
  for (let i = 0; i < 300; i++) await sql.exec('SELECT ? AS value', 'x'.repeat(100000));
  await mf.unsafeEvictDurableObject('inspection-probe', 'Probe', { name: 'probe', webSockets: 'hibernate' });
 } else {
  for (let i = 0; i < 300; i++) await (await mf.dispatchFetch('http://localhost/')).text();
 }
 console.log(`Completed standalone ${inspect ? 'SQLite inspection' : 'HTTP-only'} probe; warning timing depends on garbage collection.`);
 await new Promise(resolve => setTimeout(resolve, 2000));
} finally {
 socket?.close(); await mf.dispose();
}
