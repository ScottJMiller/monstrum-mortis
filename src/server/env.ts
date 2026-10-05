export interface WorkerEnv {
  ASSETS: Fetcher;
  ROOMS: DurableObjectNamespace;
  MATCHMAKING: DurableObjectNamespace;
  GUEST_LEASES: DurableObjectNamespace;
}
