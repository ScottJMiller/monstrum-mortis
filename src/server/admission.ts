import type { MatchmakingRegion } from '../shared/rules.ts';
/** Binding-only contracts for step 3. Never expose allocation or cancellation as browser routes. */
export interface PublicAllocation {
  allocationId: string;
  roomId: string;
  region?: MatchmakingRegion;
  members: { reservationId: string; guestId: string; alias: string; ticketId?: string }[];
}
export interface PublicGrant {
  reservationId: string;
  guestId: string;
  admissionToken: string;
  expiresAtMs: number;
}
export type ServiceResult<T> = { ok: true; value: T } | { ok: false; code: string; message: string; status: number };
