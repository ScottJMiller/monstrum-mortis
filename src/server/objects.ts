import { DurableObject } from 'cloudflare:workers';
import type { WorkerEnv } from './env.ts';

export { LaboratoryRoom } from './laboratory-room.ts';

/** Stable infrastructure identities. Queue and cross-pool leasing remain step 3. */
export class MatchmakingPool extends DurableObject<WorkerEnv> {
  async fetch(): Promise<Response> { return Response.json({ code: 'not-implemented', step: 3 }, { status: 501 }); }
}
export class GuestLease extends DurableObject<WorkerEnv> {
  async fetch(): Promise<Response> { return Response.json({ code: 'not-implemented', step: 3 }, { status: 501 }); }
}
