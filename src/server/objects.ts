import { DurableObject } from 'cloudflare:workers';
import type { WorkerEnv } from './env.ts';

/** Provisioned class names are persistent infrastructure identities; do not rename casually. */
export class LaboratoryRoom extends DurableObject<WorkerEnv> {
  async fetch(): Promise<Response> {
    return Response.json({ code: 'not-implemented', step: 2 }, { status: 501 });
  }
}

export class MatchmakingPool extends DurableObject<WorkerEnv> {
  async fetch(): Promise<Response> {
    return Response.json({ code: 'not-implemented', step: 3 }, { status: 501 });
  }
}

export class GuestLease extends DurableObject<WorkerEnv> {
  async fetch(): Promise<Response> {
    return Response.json({ code: 'not-implemented', step: 3 }, { status: 501 });
  }
}
