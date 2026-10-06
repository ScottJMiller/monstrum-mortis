import type { MatchmakingRegion } from './rules.ts';
import type { PROTOCOL_VERSION } from './protocol.ts';
export interface GuestCredentials { guestId: string; accessToken: string; alias: string; symbol: string }
export interface ReplacementOffer {
  roomId: string; round: number; teamScore: number; remainingSessionMs: number;
  reason: 'vacancy' | 'recovery'; vacancies: number; deadlineMs: number;
}
/** Private, authenticated queue projection: admission secrets go only to this ticket's owner. */
export interface PublicQueueStatus {
  protocolVersion: typeof PROTOCOL_VERSION; serverTimeMs: number; ticketId: string; region: MatchmakingRegion;
  mode: 'fresh-session' | 'fill-existing-laboratory'; enteredAtMs: number;
  state: 'waiting' | 'ready-check' | 'allocating' | 'matched' | 'inactive' | 'cancelled';
  waitingPlayers: number; readyCheckId: string | null; readyDeadlineMs: number | null;
  readyConfirmed: boolean; offer: ReplacementOffer | null; suggestAlternatives: boolean;
  admission: { roomId: string; reservationId: string; admissionToken: string; expiresAtMs: number } | null;
}
export type QueueMessage = { kind: 'queue-status'; status: PublicQueueStatus };
