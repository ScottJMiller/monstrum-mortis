import type {
  GuestId, PlayerId, QueueMode, SpecimenId,
} from '../shared/types.ts';
import type { MatchmakingRegion } from '../shared/rules.ts';

/** Server-only persistence contracts. Never broadcast these records to clients. */
export interface SpecimenRecord {
  specimenId: SpecimenId;
  dnaId: string;
}

export interface PrivateSeatRecord {
  playerId: PlayerId;
  guestId: GuestId;
  reconnectTokenHash: string;
  tray: SpecimenRecord[];
  pendingDrawDnaIds: string[];
  remainingDoses: number;
  nextInjectionAtMs: number;
  lastActivityAtMs: number;
}

/** Active schema-4 SQLite room record. Foundation records were never persisted. */
export type { StoredRoom as RoomRecord } from './room-model.ts';

export interface QueueTicketRecord {
  schemaVersion: 1;
  ticketId: string;
  guestId: GuestId;
  region: MatchmakingRegion;
  mode: QueueMode;
  enteredAtMs: number;
  state: 'waiting' | 'ready-check' | 'reserved' | 'inactive';
  reservationId: string | null;
  expiresAtMs: number;
}

export interface GuestLeaseRecord {
  schemaVersion: 1;
  guestId: GuestId;
  holder: { kind: 'queue' | 'room'; id: string } | null;
  revision: number;
  expiresAtMs: number;
}
