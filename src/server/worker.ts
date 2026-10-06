import type { WorkerEnv } from './env.ts';
import { createHealth } from './health.ts';
import { alias, body, exact, failure, operationId, PRIVATE_CODE, PUBLIC_ID, ServiceError } from './validation.ts';
import { hash } from './security.ts';

export { LaboratoryRoom, MatchmakingPool, GuestLease } from './objects.ts';

function checkOrigin(request: Request) {
  const origin = request.headers.get('Origin');
  if (!origin) return; // Non-browser API clients still require room credentials.
  const url = new URL(request.url);
  if (origin === url.origin) return;
  if (['localhost', '127.0.0.1'].includes(url.hostname) && ['http://localhost:5173', 'http://127.0.0.1:5173'].includes(origin)) return;
  throw new ServiceError('unauthorized', 'Use this laboratory from its own origin.', 403);
}
export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') {
      if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
      const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };
      return request.method === 'HEAD' ? new Response(null, { headers }) : Response.json(createHealth(env), { headers });
    }
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      checkOrigin(request);
      const gate = env.ROOMS.get(env.ROOMS.idFromName('control:private-entry'));
      const limitEntry = async (creation: boolean) => {
        const ipHash = await hash(request.headers.get('CF-Connecting-IP') ?? 'local-development');
        if (!await gate.checkEntryRate(ipHash, creation)) throw new ServiceError('rate-limited', 'Too many entry attempts. Retry in a minute.', 429);
      };
      if (url.pathname === '/api/rooms/private') {
        if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
        await limitEntry(true);
        const v = await body(request); exact(v, ['operationId', 'alias', 'presentation']);
        const key = operationId(v.operationId); const name = alias(v.alias);
        if (v.presentation !== 'remote' && v.presentation !== 'same-room') throw new ServiceError('invalid-action', 'Invalid presentation.');
        const opHash = await hash(key); const fingerprint = JSON.stringify([name, v.presentation]);
        let collision: string | null = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          const allocation = await gate.privateCode(opHash, fingerprint, collision);
          if (!allocation.ok) throw new ServiceError(allocation.code, allocation.message, allocation.status);
          const code = allocation.value;
          const response = await env.ROOMS.get(env.ROOMS.idFromName(`room:${code}`)).fetch(new Request('https://room.internal/internal/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...v, roomId: code }) }));
          if (response.status !== 409) return response;
          const error = await response.clone().json() as { code: string };
          if (error.code !== 'code-collision') return response;
          collision = code;
        }
        throw new ServiceError('temporarily-unavailable', 'Unable to allocate an invitation code. Retry shortly.', 503);
      }
      const match = /^\/api\/rooms\/([^/]+)\/(join|admit|snapshot|socket|display)$/.exec(url.pathname);
      if (match) {
        const id = match[1]!; const operation = match[2]!;
        if (operation === 'join' || operation === 'admit') await limitEntry(false);
        if (!PRIVATE_CODE.test(id) && !PUBLIC_ID.test(id)) throw new ServiceError('invalid-room-code', 'Use the six-character invitation code or issued public room ID.');
        const expected = ['join', 'admit', 'display'].includes(operation) ? 'POST' : 'GET';
        if (request.method !== expected) return new Response(null, { status: 405, headers: { Allow: expected } });
        const internal = new URL(`https://room.internal/internal/${operation}`); internal.search = url.search;
        const forwarded = new Request(internal, request);
        return env.ROOMS.get(env.ROOMS.idFromName(`room:${id}`)).fetch(forwarded);
      }
      if (url.pathname.startsWith('/api/queue')) return Response.json({ code: 'not-implemented', message: 'Public matchmaking belongs to step 3.' }, { status: 501 });
      throw new ServiceError('not-found', 'Unknown API route.', 404);
    } catch (error) { return failure(error); }
  },
} satisfies ExportedHandler<WorkerEnv>;
