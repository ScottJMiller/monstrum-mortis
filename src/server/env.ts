import type { LaboratoryRoom } from './laboratory-room.ts';
import type { MatchmakingPool } from './matchmaking-pool.ts';
import type { GuestLease } from './guest-lease.ts';

export interface WorkerEnv {
  ASSETS: Fetcher;
  ROOMS: DurableObjectNamespace<LaboratoryRoom>;
  MATCHMAKING: DurableObjectNamespace<MatchmakingPool>;
  GUEST_LEASES: DurableObjectNamespace<GuestLease>;
}
