import type { WorkerEnv } from './env.ts';
import { createHealth } from './health.ts';

export { LaboratoryRoom, MatchmakingPool, GuestLease } from './objects.ts';

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
      }
      const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };
      return request.method === 'HEAD'
        ? new Response(null, { headers })
        : Response.json(createHealth(env), { headers });
    }
    if (url.pathname.startsWith('/api/')) {
      return Response.json({ code: 'not-implemented', message: 'Gameplay services arrive in steps 2–3.' }, { status: 501 });
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<WorkerEnv>;
