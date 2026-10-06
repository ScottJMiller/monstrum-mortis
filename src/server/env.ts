import type { LaboratoryRoom } from './laboratory-room.ts';

export interface WorkerEnv {
  ASSETS: Fetcher;
  ROOMS: DurableObjectNamespace<LaboratoryRoom>;
  MATCHMAKING: DurableObjectNamespace;
  GUEST_LEASES: DurableObjectNamespace;
}
